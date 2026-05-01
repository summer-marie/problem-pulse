const fs = require('fs');
const path = require('path');

const CACHE_PATH = path.join(__dirname, '..', 'data', 'cache.json');

/**
 * Reads the cached cards from disk.
 * Returns an empty array if the file doesn't exist or is unreadable.
 */
function readCache() {
  try {
    if (!fs.existsSync(CACHE_PATH)) return [];
    const raw = fs.readFileSync(CACHE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[cache] Failed to read cache:', err.message);
    return [];
  }
}

/**
 * Writes an array of cards to the cache file.
 */
function writeCache(cards) {
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cards, null, 2), 'utf-8');
    console.log(`[cache] Wrote ${cards.length} cards to cache.`);
  } catch (err) {
    console.error('[cache] Failed to write cache:', err.message);
  }
}

/**
 * Returns the age of the cache in milliseconds.
 * Returns Infinity if the cache doesn't exist.
 */
function cacheAge() {
  try {
    if (!fs.existsSync(CACHE_PATH)) return Infinity;
    const stat = fs.statSync(CACHE_PATH);
    return Date.now() - stat.mtimeMs;
  } catch {
    return Infinity;
  }
}

/**
 * Deletes the cache file from disk.
 * Forces the next /api/cards request to do a fresh live scrape.
 */
function clearCache() {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      fs.unlinkSync(CACHE_PATH);
      console.log('[cache] Cache cleared.');
      return true;
    }
    return false;
  } catch (err) {
    console.error('[cache] Failed to clear cache:', err.message);
    return false;
  }
}

module.exports = { readCache, writeCache, cacheAge, clearCache };
