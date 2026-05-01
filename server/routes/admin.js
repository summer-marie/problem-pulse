const express = require('express');
const router = express.Router();
const { clearCache, cacheAge } = require('../data/cache');

// POST /api/admin/clear-cache
// Deletes the cache file so the next /api/cards call triggers a fresh scrape.
router.post('/clear-cache', (req, res) => {
  const wasCleared = clearCache();
  res.json({
    success: true,
    message: wasCleared ? 'Cache cleared. Next /api/cards call will re-scrape.' : 'No cache file found — nothing to clear.',
    cacheAgeMs: cacheAge()
  });
});

// GET /api/admin/cache-status
// Returns current cache age in minutes so you know how stale it is.
router.get('/cache-status', (req, res) => {
  const ageMs = cacheAge();
  const ageMinutes = ageMs === Infinity ? null : Math.round(ageMs / 1000 / 60);
  res.json({
    exists: ageMs !== Infinity,
    ageMinutes,
    isStale: ageMs > 30 * 60 * 1000
  });
});

module.exports = router;
