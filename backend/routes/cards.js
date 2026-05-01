const express = require('express');
const router = express.Router();
const { scrapeAll } = require('../scrapers/scraper');
const { filterAndShape } = require('../scrapers/filter');
const { readCache, writeCache, cacheAge } = require('../data/cache');

// How long to reuse the cache before re-scraping (30 minutes)
const CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * GET /api/cards
 * Returns a random batch of complaint cards.
 * Query param: ?count=5  (default: 5, max: 20)
 *
 * Flow:
 *  1. If the cache is fresh, serve cards from it.
 *  2. Otherwise, scrape live data, filter it, cache it, then serve from it.
 *  3. If live scraping fails and cache exists, fall back to the cache.
 *  4. If nothing is available, return the built-in fallback dataset.
 */
router.get('/', async (req, res) => {
  const count = Math.min(parseInt(req.query.count) || 5, 20);

  // --- Try cache first ---
  if (cacheAge() < CACHE_TTL_MS) {
    const cached = readCache();
    if (cached.length > 0) {
      return res.json(pickRandom(cached, count));
    }
  }

  // --- Live scrape ---
  try {
    const raw = await scrapeAll();
    const cards = filterAndShape(raw);

    if (cards.length > 0) {
      writeCache(cards);
      return res.json(pickRandom(cards, count));
    }
  } catch (err) {
    console.error('[/api/cards] Scrape error:', err.message);
  }

  // --- Stale cache fallback ---
  const stale = readCache();
  if (stale.length > 0) {
    console.warn('[/api/cards] Using stale cache as fallback.');
    return res.json(pickRandom(stale, count));
  }

  // --- Hardcoded fallback dataset ---
  return res.json(pickRandom(FALLBACK_CARDS, count));
});

/** Returns `n` randomly selected items from an array. */
function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/**
 * Fallback cards used when scraping fails and no cache exists.
 * These are real, common complaints that are clearly tech-solvable.
 */
const FALLBACK_CARDS = [
  {
    complaint: 'I always forget to follow up on emails I sent days ago.',
    source: 'fallback dataset',
    category: 'Communication',
    techAngle: 'Build a follow-up reminder tool that tracks sent messages.',
    projectTitle: 'FollowUp Nudge',
    summary: 'A lightweight app that lets you flag outgoing emails for follow-up and reminds you if no reply arrives within a set time.',
    mvpFeatures: [
      'Log a sent message with a recipient and expected reply deadline',
      'Show a dashboard of unanswered messages past their deadline',
      'Mark a thread as resolved once a reply is received'
    ],
    difficulty: 'Beginner (1–2 weeks)'
  },
  {
    complaint: 'I waste so much time tracking my monthly subscriptions — I have no idea what I\'m actually paying for.',
    source: 'fallback dataset',
    category: 'Finance / Shopping',
    techAngle: 'Build a subscription tracker that shows total monthly spend.',
    projectTitle: 'SubScan',
    summary: 'A simple app where users log their recurring subscriptions and see a clear monthly total with alerts for price changes.',
    mvpFeatures: [
      'Add a subscription with name, cost, and billing cycle',
      'Show a running monthly total at the top of the dashboard',
      'Flag subscriptions not used in the past 30 days'
    ],
    difficulty: 'Beginner (1–2 weeks)'
  },
  {
    complaint: 'I can never find the file I need — my downloads folder is a complete disaster.',
    source: 'fallback dataset',
    category: 'Organization',
    techAngle: 'Build a personal file tagging and search tool.',
    projectTitle: 'TagDrop',
    summary: 'A browser-based tool that lets users tag and annotate files they\'ve uploaded so they can find them instantly later.',
    mvpFeatures: [
      'Upload or link a file and add custom tags',
      'Search all files by tag, name, or date added',
      'Archive old files to reduce clutter on the main view'
    ],
    difficulty: 'Beginner–Intermediate (1–3 weeks)'
  },
  {
    complaint: 'I keep missing medication doses because I forget to take them at the right time.',
    source: 'fallback dataset',
    category: 'Health & Habits',
    techAngle: 'Build a daily medication reminder and dose log.',
    projectTitle: 'DoseCheck',
    summary: 'A habit tracker focused on medication — users set a daily dose schedule and log each time they take it.',
    mvpFeatures: [
      'Add a medication with name, dose, and daily reminder time',
      'One-tap logging when a dose is taken',
      'Show a weekly streak and any missed days highlighted in red'
    ],
    difficulty: 'Beginner (1–2 weeks)'
  },
  {
    complaint: 'Booking appointments at my dentist still requires a phone call — why is there no online option?',
    source: 'fallback dataset',
    category: 'Scheduling',
    techAngle: 'Build a simple appointment booking page for small service businesses.',
    projectTitle: 'SlotBook',
    summary: 'A minimal booking tool where a small business can list available time slots and customers can reserve one without calling.',
    mvpFeatures: [
      'Display a weekly grid of available time slots',
      'Let a user enter their name and reserve a slot',
      'Show the business owner a list of all upcoming reservations'
    ],
    difficulty: 'Intermediate (2–4 weeks)'
  }
];

module.exports = router;
