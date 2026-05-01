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
    complaint: 'I have so many passwords saved across different browsers and I can never remember which account uses which email.',
    source: 'fallback dataset',
    category: 'Account Management',
    techAngle: 'Build a simple credential organizer that tracks which email is used for each service.',
    projectTitle: 'Account Access Manager',
    summary: 'A tool that stores account hints (service name, username/email used) so users can quickly look up login details without storing passwords.',
    mvpFeatures: [
      'Store site names and the associated email/username',
      'Search accounts by service name or email',
      'Flag accounts that haven\'t been updated in 6+ months'
    ],
    difficulty: 'Beginner–Intermediate (1–3 weeks)'
  },
  {
    complaint: 'I manually log my expenses in a spreadsheet every month and it takes forever to spot spending trends.',
    source: 'fallback dataset',
    category: 'Data & Tracking',
    techAngle: 'Build a lightweight expense dashboard that visualizes spending patterns.',
    projectTitle: 'Expense Log Dashboard',
    summary: 'An app where users add expense entries and see a monthly breakdown with category totals and trend graphs.',
    mvpFeatures: [
      'Add a new expense with amount, category, and date',
      'Display a sortable table of all entries',
      'Export entries as a CSV file for further analysis'
    ],
    difficulty: 'Intermediate (2–4 weeks)'
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
  },
  {
    complaint: 'The file upload progress bar in this app freezes at 99% and I have no idea if it actually worked or not.',
    source: 'fallback dataset',
    category: 'Software UX',
    techAngle: 'Build a tool that surfaces and documents common UX failures in web apps.',
    projectTitle: 'Upload Fix Tool',
    summary: 'A feedback collector that lets users report confusing or broken UX patterns they encounter, helping developers prioritize fixes.',
    mvpFeatures: [
      'Submit a UX complaint with a screenshot and brief description',
      'Display all complaints as filterable cards by category',
      'Allow users to upvote the most frustrating issues'
    ],
    difficulty: 'Beginner–Intermediate (1–3 weeks)'
  }
];

module.exports = router;
