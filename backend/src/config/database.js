/**
 * Prisma database client singleton.
 * Uses the Prisma client generated from ../database/prisma/schema.prisma
 * The client is output to database/node_modules/@prisma/client by default.
 */

const path = require("path");

// Resolve the generated Prisma client from the database package with fallback
let PrismaClient;
try {
  const clientPath = path.resolve(__dirname, "..", "..", "..", "database", "node_modules", "@prisma", "client");
  PrismaClient = require(clientPath).PrismaClient;
} catch {
  PrismaClient = require("@prisma/client").PrismaClient;
}

let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // Prevent multiple instances during development hot-reload
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ["warn", "error"],
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;
