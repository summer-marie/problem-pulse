/**
 * FILTER.JS - Complaint Filtering and Card Shaping Module
 * 
 * This file takes raw complaints from the scraper and:
 * 1. Filters out complaints that aren't tech-solvable
 * 2. Transforms remaining complaints into structured "card" objects
 * 3. Adds metadata like category, difficulty, MVP features, etc.
 */

// FRUSTRATION_SIGNALS - Sentiment Filter
// A complaint must contain at least one of these to pass.
// This prevents positive posts ("Finally fixed it!", "Loving this tool!")
// from slipping through just because they mention a tech keyword.
const FRUSTRATION_SIGNALS = [
  // Negations
  "can't", "cannot", "won't", "doesn't", "don't", "didn't", "isn't",
  "wasn't", "aren't", "weren't", "never", "no way",
  // Frustration words
  'broken', 'annoying', 'hate', 'horrible', 'terrible', 'awful',
  'frustrating', 'useless', 'pointless', 'ridiculous', 'impossible',
  'stuck', 'failed', 'failing', 'keeps', 'always', 'again',
  // Problem language
  'problem', 'issue', 'bug', 'error', 'wrong', 'breaks', 'crash',
  'wish', 'why', 'how is', 'how does', 'tired of', 'sick of',
  'still not', 'yet another', 'every time', 'once again'
];

// STRONG_TECH_KEYWORDS - High-Priority Filter
// If a complaint contains any of these, it is always kept (even if batch cap is reached).
const STRONG_TECH_KEYWORDS = [
  'app', 'website', 'platform', 'software', 'api', 'ui', 'ux',
  'dashboard', 'tool', 'extension', 'integration', 'sync', 'login',
  'upload', 'download', 'bug', 'crash', 'feature', 'update'
];

/**
 * TECH_KEYWORDS - Allowlist Filter
 * 
 * Keywords that strongly suggest a complaint is tech-solvable.
 * If a complaint contains ANY of these keywords, it passes the first filter.
 * 
 * Organized by the 6 valid categories:
 * - Communication (messages, emails, replies)
 * - Scheduling (appointments, calendars, booking)
 * - Finance/Shopping (billing, subscriptions, orders)
 * - Account Management (passwords, logins)
 * - Data & Tracking (logs, analytics, reports)
 * - Software UX (tools, apps, software friction)
 * 
 * Plus general friction keywords that may apply across categories
 */
const TECH_KEYWORDS = [
  // Communication
  'email', 'message', 'text', 'respond', 'response', 'reply', 'notification',
  // Scheduling
  'schedule', 'appointment', 'calendar', 'booking', 'reschedule',
  // Finance / Shopping
  'price', 'overcharged', 'billing', 'bill', 'subscription', 'cancel',
  'refund', 'shipping', 'delivery', 'order',
  // Account Management
  'password', 'account', 'sign in', 'forgot password', 'login',
  // Data & Tracking
  'data', 'report', 'log', 'record', 'stats', 'analytics', 'track', 'tracking',
  // Software UX
  'app', 'software', 'tool', 'upload', 'download', 'sync', 'platform', 'website',
  'form', 'install', 'slow', 'clunky',
  // General friction (applies across categories)
  'waste', 'takes forever', 'too long', 'hours', 'manual', 'tedious',
  'repetitive', 'copy paste', 'copy-paste', 'forgot', 'forget', 'remind', 'reminder',
  'alert', 'lost', 'find', 'search'
];

/**
 * EXCLUDE_KEYWORDS - Blocklist Filter
 * 
 * Keywords that indicate a complaint is:
 * - Too sensitive or personal
 * - Related to serious trauma/illness
 * - Political or controversial
 * - Not addressable with software
 * 
 * Even if a complaint has a TECH_KEYWORD, if it also has an EXCLUDE_KEYWORD,
 * it gets filtered out to keep results appropriate and actionable.
 */
const EXCLUDE_KEYWORDS = [
  'grief', 'mourning', 'funeral', 'death', 'abuse', 'assault', 'violence',
  'cancer', 'hospital', 'surgery', 'divorce', 'breakup', 'suicide',
  'racist', 'sexist', 'harassment', 'war', 'politics', 'election',
  'religion', 'god', 'pray'
];

/**
 * FUNCTION: detectCategory
 * 
 * Analyzes the complaint text and assigns it to a category.
 * Uses regex pattern matching against common keywords.
 * Returns null if no category matches (complaint will be filtered out).
 * 
 * Valid Categories (6 total):
 * - Communication (emails, messages, notifications)
 * - Scheduling (calendars, appointments, meetings)
 * - Finance / Shopping (bills, subscriptions, payments)
 * - Account Management (passwords, logins)
 * - Data & Tracking (logs, reports, analytics)
 * - Software UX (apps, tools, websites)
 */
function detectCategory(text) {
  const t = text.toLowerCase();
  if (/email|message|reply|respond|notification|text/.test(t)) return 'Communication';
  if (/schedule|calendar|appointment|booking|meeting/.test(t)) return 'Scheduling';
  if (/price|bill|charge|subscription|refund|payment|shipping/.test(t)) return 'Finance / Shopping';
  if (/password|login|account|sign in/.test(t)) return 'Account Management';
  if (/track|log|record|data|report|analytics|dashboard/.test(t)) return 'Data & Tracking';
  if (/app|website|platform|software|tool|upload|download|sync/.test(t)) return 'Software UX';
  return null;
}

/**
 * FUNCTION: estimateDifficulty
 * 
 * Estimates how long it would take to build an MVP for this category.
 * 
 * Difficulty Tiers:
 * - Beginner (1-2 weeks): Simple CRUD apps, basic tracking
 * - Intermediate (2-4 weeks): More complex logic, external APIs, scheduling
 * - Beginner-Intermediate (1-3 weeks): Falls in between
 */
function estimateDifficulty(category) {
  const easy = ['Communication', 'Scheduling'];
  const medium = ['Finance / Shopping', 'Data & Tracking'];
  if (easy.includes(category)) return 'Beginner (1–2 weeks)';
  if (medium.includes(category)) return 'Intermediate (2–4 weeks)';
  return 'Beginner–Intermediate (1–3 weeks)';
}

/**
 * FUNCTION: suggestTitle
 * 
 * Generates dynamic project names by extracting a key word from the complaint text.
 * Looks for STRONG_TECH_KEYWORDS first, then non-stopword nouns, then falls back to category.
 * Combines the extracted word with a category-specific suffix.
 */
function suggestTitle(text, category) {
  const stopwords = new Set(['the','a','an','is','it','my','i','we','you','they','to','of','for','and','or','but','with','in','on','at','this','that','was','be','are','have','has','been','can','cant','why','how','when','what','just','so','do','doesnt','dont','its','if']);
  const suffixMap = {
    'Communication': 'Reply Manager',
    'Scheduling': 'Booking Tool',
    'Finance / Shopping': 'Spend Tracker',
    'Account Management': 'Access Manager',
    'Data & Tracking': 'Log Dashboard',
    'Software UX': 'Fix Tool'
  };
  const words = text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/);
  let key = words.find(w => STRONG_TECH_KEYWORDS.includes(w));
  if (!key) key = words.find(w => w && !stopwords.has(w));
  if (!key) key = category && category.split(' ')[0].toLowerCase();
  key = key ? key.charAt(0).toUpperCase() + key.slice(1) : '';
  const suffix = suffixMap[category] || 'Fix Tool';
  return `${key} ${suffix}`;
}

/**
 * FUNCTION: generateMVPFeatures
 * 
 * Returns an array of 3 concrete MVP features for the given category.
 * These are realistic, implementable features for a beginner/intermediate developer.
 * 
 * Each feature is:
 * - Specific and actionable
 * - Core to solving the problem
 * - Achievable in a 1-4 week timeframe
 */
function generateMVPFeatures(category) {
  const features = {
    'Communication': [
      'Log incoming messages with timestamps',
      'Set follow-up reminders for unanswered messages',
      'Mark threads as resolved'
    ],
    'Scheduling': [
      'View available time slots in a simple calendar',
      'Send a booking confirmation message',
      'Set a reminder notification before the event'
    ],
    'Finance / Shopping': [
      'Log a purchase with category and amount',
      'Show a monthly spending summary',
      'Flag any charges above a custom threshold'
    ],
    'Account Management': [
      'Store site names and masked password hints',
      'Copy password hint to clipboard with one click',
      'Flag accounts that haven\'t been updated in 6+ months'
    ],
    'Data & Tracking': [
      'Add a new data entry with a form',
      'Display a sortable table of entries',
      'Export entries as a CSV file'
    ],
    'Software UX': [
      'Surface the most common user complaints from a source',
      'Display complaints as filterable cards',
      'Allow users to upvote the most frustrating issues'
    ]
  };

  return features[category] || features['Software UX'];
}

/**
 * FUNCTION: generateSummary
 * 
 * Generates a concise 1-2 sentence project description based on category and title.
 * First sentence describes what the app does, second names a concrete benefit.
 */
function generateSummary(text, category, title) {
  const summaryMap = {
    'Communication': `${title} helps you track messages and flag ones that need a reply before they fall through the cracks.`,
    'Scheduling': `${title} lets you book or manage time slots without back-and-forth emails or phone calls.`,
    'Finance / Shopping': `${title} logs your recurring costs so you always know what you're paying and what to cancel.`,
    'Account Management': `${title} stores your account hints and flags outdated credentials before they lock you out.`,
    'Data & Tracking': `${title} turns your manual logs into a clean dashboard so trends are visible at a glance.`,
    'Software UX': `${title} surfaces and documents UX problems so they can be prioritized and fixed.`
  };
  return summaryMap[category] || `${title} surfaces and documents UX problems so they can be prioritized and fixed.`;
}

/**
 * FUNCTION: shapeCard
 * 
 * Transforms a raw complaint into a structured card object.
 * 
 * Input: { text, source, url, upvotes }
 * Output: {
 *   complaint: original text
 *   source: where it came from
 *   category: auto-detected category
 *   techAngle: brief explanation of how tech can help
 *   projectTitle: suggested app name
 *   summary: 1-2 sentence project description
 *   mvpFeatures: array of 3 core features
 *   difficulty: time estimate
 * }
 */
function shapeCard(complaint) {
  const category = detectCategory(complaint.text);
  const title = suggestTitle(complaint.text, category);
  const difficulty = estimateDifficulty(category);
  const mvp = generateMVPFeatures(category);

  const techAngleMap = {
    'Communication': 'Build a message tracking or follow-up tool that reduces inbox friction.',
    'Scheduling': 'Build a scheduling or booking tool that eliminates manual coordination.',
    'Finance / Shopping': 'Build a spending tracker or subscription manager that surfaces hidden costs.',
    'Account Management': 'Build a credential organizer that reduces login friction.',
    'Data & Tracking': 'Build a lightweight dashboard that turns manual logging into visible trends.',
    'Software UX': 'Build a tool that surfaces, documents, or fixes a recurring UX failure.'
  };

  return {
    complaint: complaint.text,
    source: complaint.source,
    url: complaint.url,
    category,
    techAngle: techAngleMap[category] || 'Build a tool that surfaces, documents, or fixes a recurring UX failure.',
    projectTitle: title,
    summary: generateSummary(complaint.text, category, title),
    mvpFeatures: mvp,
    difficulty
  };
}

/**
 * FUNCTION: filterAndShape (MAIN ENTRY POINT)
 * 
 * Takes an array of raw complaints and:
 * 1. Rejects complaints with EXCLUDE_KEYWORDS (always filtered out)
 * 2. Prioritizes complaints with STRONG_TECH_KEYWORDS (no limit)
 * 3. Accepts up to 10 complaints with regular TECH_KEYWORDS (capped)
 * 4. Transforms each passing complaint into a full card object
 * 
 * This is the main export used by routes/cards.js
 */
function filterAndShape(rawComplaints) {
  let techOnlyCount = 0;
  const strong = [];
  const tech = [];
  for (const c of rawComplaints) {
    const t = c.text.toLowerCase();
    // Must NOT have any exclude keywords
    const isExcluded = EXCLUDE_KEYWORDS.some((kw) => t.includes(kw));
    if (isExcluded) continue;
    // Must have at least one frustration signal (prevents positive posts)
    const hasFrustration = FRUSTRATION_SIGNALS.some((kw) => t.includes(kw));
    if (!hasFrustration) continue;
    // Must have a valid category (not null)
    const category = detectCategory(c.text);
    if (!category) continue;
    // Check tech keyword tier and add to appropriate array
    if (STRONG_TECH_KEYWORDS.some((kw) => t.includes(kw))) {
      strong.push(c);
    } else if (TECH_KEYWORDS.some((kw) => t.includes(kw))) {
      if (techOnlyCount < 10) {
        tech.push(c);
        techOnlyCount++;
      }
    }
  }
  return [...strong, ...tech].map(shapeCard);
}

module.exports = { filterAndShape };
