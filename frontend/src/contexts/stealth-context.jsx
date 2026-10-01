"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getStoredVpsUrl } from "@/lib/api-client";
import { isAndroidNativeApp } from "@/lib/platform";
import { ServerConfigModal } from "@/components/decoy/server-config-modal";

export { isAndroidNativeApp };

const StealthContext = createContext(null);
const DEFAULT_PASSCODE = "2007";

export function StealthProvider({ children }) {
  const router = useRouter();
  const [isAndroid, setIsAndroid] = useState(() => {
    if (typeof window !== "undefined") return isAndroidNativeApp();
    return false;
  });

  const [isStealthEnabled, setIsStealthEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      if (!isAndroidNativeApp()) return false;
      const stored = localStorage.getItem("firm_stealth_enabled");
      return stored !== null ? stored === "true" : true;
    }
    return false;
  });

  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window !== "undefined") {
      if (!isAndroidNativeApp()) return true;
      return sessionStorage.getItem("firm_stealth_unlocked") === "true";
    }
    return false;
  });

  const [passcode, setPasscode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("firm_stealth_passcode") || DEFAULT_PASSCODE;
    }
    return DEFAULT_PASSCODE;
  });

  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [hasVpsConfigured, setHasVpsConfigured] = useState(false);
  const [isInitialized, setIsInitialized] = useState(() => typeof window !== "undefined");

  // Initialize and synchronize state
  const syncPlatformState = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const androidNative = isAndroidNativeApp();
      setIsAndroid(androidNative);

      // Stealth mode is strictly for the Android Native App
      if (androidNative) {
        const storedStealthEnabled = localStorage.getItem("firm_stealth_enabled");
        if (storedStealthEnabled !== null) {
          setIsStealthEnabled(storedStealthEnabled === "true");
        } else {
          // Default to true on Android app
          setIsStealthEnabled(true);
        }
        const sessionUnlocked = sessionStorage.getItem("firm_stealth_unlocked") === "true";
        setIsUnlocked(sessionUnlocked);
      } else {
        // On regular web/desktop/mobile-web browsers, stealth mode is permanently DISABLED
        setIsStealthEnabled(false);
        setIsUnlocked(true);
      }

      const storedPasscode = localStorage.getItem("firm_stealth_passcode");
      if (storedPasscode) {
        setPasscode(storedPasscode);
      }

      const vpsUrl = getStoredVpsUrl();
      setHasVpsConfigured(!!vpsUrl);
    } catch {
      // Storage access error
    } finally {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    syncPlatformState();

    if (typeof window !== "undefined") {
      window.addEventListener("firm_platform_changed", syncPlatformState);
      return () => {
        window.removeEventListener("firm_platform_changed", syncPlatformState);
      };
    }
  }, [syncPlatformState]);

  // Unlock with passcode
  const unlock = useCallback(
    (enteredPin) => {
      const currentPin =
        typeof window !== "undefined"
          ? localStorage.getItem("firm_stealth_passcode") || passcode || DEFAULT_PASSCODE
          : DEFAULT_PASSCODE;

      if (enteredPin === currentPin) {
        setIsUnlocked(true);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("firm_stealth_unlocked", "true");
        }
        return true;
      }
      return false;
    },
    [passcode]
  );

  // Instantly lock back to Calculator decoy (Panic button)
  const lock = useCallback(() => {
    console.log("--> Stealth lock() triggered!");
    setIsUnlocked(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("firm_stealth_unlocked");
      try {
        router.replace("/");
      } catch {
        window.location.href = "/";
      }
    }
  }, [router]);

  // Update master passcode
  const updatePasscode = useCallback((newPin) => {
    if (!newPin || newPin.length < 4) return false;
    setPasscode(newPin);
    if (typeof window !== "undefined") {
      localStorage.setItem("firm_stealth_passcode", newPin);
    }
    return true;
  }, []);

  // Toggle stealth mode
  const setStealthActive = useCallback((active) => {
    setIsStealthEnabled(active);
    if (typeof window !== "undefined") {
      localStorage.setItem("firm_stealth_enabled", active ? "true" : "false");
    }
  }, []);

  // Check/update VPS configured status
  const refreshVpsStatus = useCallback(() => {
    const url = getStoredVpsUrl();
    setHasVpsConfigured(!!url);
    return !!url;
  }, []);

  const value = {
    isStealthEnabled,
    setStealthActive,
    isUnlocked,
    unlock,
    lock,
    passcode,
    updatePasscode,
    isServerModalOpen,
    setIsServerModalOpen,
    hasVpsConfigured,
    refreshVpsStatus,
    isInitialized,
    isAndroidNative: isAndroid,
  };

  return (
    <StealthContext.Provider value={value}>
      {children}
      {isAndroid && (
        <ServerConfigModal
          open={isServerModalOpen}
          onOpenChange={setIsServerModalOpen}
        />
      )}
    </StealthContext.Provider>
  );
}

export function useStealth() {
  const context = useContext(StealthContext);
  if (!context) {
    throw new Error("useStealth must be used within a StealthProvider");
  }
  return context;
}
