/**
 * CARDS.JS - API Route Handler for /api/cards
 * 
 * This file contains the main logic for fetching project idea cards.
 * It uses a 3-tier fallback strategy:
 * 1. Fresh cache (if < 30 minutes old)
 * 2. Live scraping from Reddit + Hacker News
 * 3. Stale cache (if scraping fails but old cache exists)
 * 4. Hardcoded fallback dataset (if all else fails)
 */

const express = require('express');
const router = express.Router();  // Express router to handle routes
const { scrapeAll } = require('../scrapers/scraper');      // Fetches complaints from Reddit/HN
const { filterAndShape } = require('../scrapers/filter');  // Filters and transforms raw complaints into cards
const { readCache, writeCache, cacheAge } = require('../data/cache');  // Cache utilities

// CACHE CONFIGURATION
// How long to reuse the cache before re-scraping (30 minutes = 1800000 milliseconds)
const CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * GET /api/cards - Main API endpoint
 * 
 * Returns a random batch of project idea cards based on real-world complaints.
 * 
 * Query Parameters:
 *   - count: Number of cards to return (default: 5, max: 20)
 *   - Example: GET /api/cards?count=10
 * 
 * Response Flow (3-tier fallback strategy):
 *  1. FRESH CACHE: If cache exists and is < 30 min old, return random cards from it
 *  2. LIVE SCRAPE: Otherwise, scrape Reddit + HN, filter/shape the data, cache it, and return
 *  3. STALE CACHE FALLBACK: If scraping fails but old cache exists, use it anyway
 *  4. HARDCODED FALLBACK: If all else fails, return the built-in dataset below
 */
router.get('/', async (req, res) => {
  // Parse the 'count' query parameter, default to 5, max out at 20
  const count = Math.min(parseInt(req.query.count) || 5, 20);

  // STEP 1: Try serving from fresh cache first (fastest option)
  if (cacheAge() < CACHE_TTL_MS) {
    const cached = readCache();
    if (cached.length > 0) {
      // Cache is fresh and has data - return random selection immediately
      return res.json(pickRandom(cached, count));
    }
  }

  // STEP 2: Cache is stale or missing - attempt live scraping
  try {
    // Scrape Reddit and Hacker News in parallel
    const raw = await scrapeAll();
    
    // Filter out non-tech complaints and shape into card format
    const cards = filterAndShape(raw);

    if (cards.length > 0) {
      // Scraping succeeded - save to cache and return random selection
      writeCache(cards);
      return res.json(pickRandom(cards, count));
    }
  } catch (err) {
    // Scraping failed (network error, timeout, API changes, etc.)
    console.error('[/api/cards] Scrape error:', err.message);
  }

  // STEP 3: Scraping failed - try using stale cache as emergency fallback
  const stale = readCache();
  if (stale.length > 0) {
    console.warn('[/api/cards] Using stale cache as fallback.');
    return res.json(pickRandom(stale, count));
  }

  // STEP 4: Everything failed - return hardcoded fallback dataset
  // This ensures the app always works, even with no internet
  return res.json(pickRandom(FALLBACK_CARDS, count));
});

/**
 * HELPER FUNCTION: pickRandom
 * Returns `n` randomly selected items from an array.
 * 
 * How it works:
 * 1. Create a copy of the array using spread operator [...arr]
 * 2. Shuffle it using a random comparison function (not perfect but good enough)
 * 3. Take the first `n` items from the shuffled array
 */
function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/**
 * FALLBACK_CARDS - Emergency Dataset
 * 
 * Hardcoded array of project idea cards used when:
 * - Live scraping fails (network down, API changes, rate limits)
 * - No cache exists yet (first run)
 * - Cache exists but is corrupted
 * 
 * These are hand-curated examples of real, tech-solvable complaints
 * that make good beginner-to-intermediate projects.
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
