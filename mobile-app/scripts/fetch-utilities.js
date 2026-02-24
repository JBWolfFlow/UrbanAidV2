#!/usr/bin/env node

/**
 * Build-time script: Fetches all utilities from the production API
 * and writes a trimmed JSON snapshot to src/assets/data/utilities.json.
 *
 * Usage:  node scripts/fetch-utilities.js
 *    or:  npm run fetch-utilities
 *
 * Run before every release build to refresh the bundled pin data.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://urbanaidv2-production.up.railway.app/utilities/all';
const OUTPUT = path.join(__dirname, '..', 'src', 'assets', 'data', 'utilities.json');

// Fields to strip — not needed for pin rendering on the map
const STRIP_FIELDS = ['created_by', 'external_id', 'images', 'distance'];

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        res.resume();
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString()));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log(`Fetching utilities from ${API_URL}...`);
  const data = await fetch(API_URL);

  if (!Array.isArray(data)) {
    throw new Error(`Expected array, got ${typeof data}`);
  }

  // Strip unnecessary fields to reduce bundle size
  const trimmed = data.map((u) => {
    const copy = { ...u };
    for (const field of STRIP_FIELDS) {
      delete copy[field];
    }
    return copy;
  });

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(trimmed));

  const sizeKB = (Buffer.byteLength(JSON.stringify(trimmed)) / 1024).toFixed(0);
  console.log(`Wrote ${trimmed.length} utilities to ${path.relative(process.cwd(), OUTPUT)} (${sizeKB} KB)`);
}

main().catch((err) => {
  console.error('Failed to fetch utilities:', err.message);
  process.exit(1);
});
