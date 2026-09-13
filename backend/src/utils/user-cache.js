/**
 * High-performance In-Memory TTL Cache for User Permissions and Profiles.
 * Eliminates repetitive 5-table relational JOINs across the network on every authenticated request.
 */

class UserCache {
  constructor(defaultTtlSeconds = 180, maxSize = 10000) { // Default: 3 minutes, max 10,000 entries
    this.cache = new Map();
    this.defaultTtlMs = defaultTtlSeconds * 1000;
    this.maxSize = maxSize;

    // Periodic sweep every 5 minutes to purge expired keys without blocking exit
    this.sweepTimer = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
    if (this.sweepTimer.unref) {
      this.sweepTimer.unref();
    }
  }

  /**
   * Remove all expired entries.
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Retrieve cached user context.
   * @param {string} userId
   * @returns {object | null}
   */
  get(userId) {
    if (!userId) return null;
    const entry = this.cache.get(userId);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(userId);
      return null;
    }

    return entry.data;
  }

  /**
   * Store user context with TTL.
   * @param {string} userId
   * @param {object} data
   * @param {number} [ttlSeconds]
   */
  set(userId, data, ttlSeconds) {
    if (!userId || !data) return;

    // Cap cache size to prevent memory leaks under massive traffic
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    const duration = ttlSeconds ? ttlSeconds * 1000 : this.defaultTtlMs;
    this.cache.set(userId, {
      data,
      expiresAt: Date.now() + duration,
    });
  }

  /**
   * Invalidate cached data for a specific user (call when roles/assignments change).
   * @param {string} userId
   */
  invalidate(userId) {
    if (!userId) return;
    this.cache.delete(userId);
  }

  /**
   * Clear entire cache.
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Current number of cached user contexts.
   */
  size() {
    return this.cache.size;
  }
}

// Export singleton instance
const userCache = new UserCache(180); // 3 minutes TTL

module.exports = userCache;
