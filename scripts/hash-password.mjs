#!/usr/bin/env node
/**
 * Generates a PBKDF2-SHA256 password record for the admin account.
 *
 *   node scripts/hash-password.mjs "your long passphrase"
 *
 * Prints a ready-to-run SQL INSERT. The plaintext never leaves your machine
 * and never enters the repo, the Worker bundle, or wrangler.jsonc.
 */
import { webcrypto as crypto } from "node:crypto";
import { randomUUID } from "node:crypto";

const ITERATIONS = 210_000;
const KEY_BITS = 256;
const SALT_BYTES = 16;

const password = process.argv[2];
const email = process.argv[3] ?? "aghababaky@gmail.com";

if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "<password>" [email]');
  process.exit(1);
}
if (password.length < 12) {
  console.error("Use at least 12 characters. This is the only door to your admin.");
  process.exit(1);
}

const toB64 = (buf) => Buffer.from(buf).toString("base64");

const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
const keyMaterial = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(password),
  "PBKDF2",
  false,
  ["deriveBits"],
);
const bits = await crypto.subtle.deriveBits(
  { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
  keyMaterial,
  KEY_BITS,
);

const record = `pbkdf2$${ITERATIONS}$${toB64(salt)}$${toB64(bits)}`;
const id = `usr_${randomUUID().slice(0, 8)}`;

console.log("\nRun this against your D1 database:\n");
console.log(
  `INSERT INTO users (id, email, password_hash, display_name, created_at) VALUES ('${id}', '${email}', '${record}', 'Babak', unixepoch());`,
);
console.log("\nThen:  npx wrangler d1 execute bioluma-db --remote --command \"<paste above>\"\n");
