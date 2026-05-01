/**
 * FILTER.JS - Complaint Filtering and Card Shaping Module
 * 
 * This file takes raw complaints from the scraper and:
 * 1. Filters out complaints that aren't tech-solvable
 * 2. Transforms remaining complaints into structured "card" objects
 * 3. Adds metadata like category, difficulty, MVP features, etc.
 */

/**
 * TECH_KEYWORDS - Allowlist Filter
 * 
 * Keywords that strongly suggest a complaint is tech-solvable.
 * If a complaint contains ANY of these keywords, it passes the first filter.
 * 
 * Organized by theme:
 * - Automation/reminders
 * - Time waste/friction
 * - Organization/search
 * - Communication
 * - Scheduling
 * - Money/shopping
 * - Health/habits
 * - Data/analytics
 * - Security/accounts
 * - Software/tools
 */
const TECH_KEYWORDS = [
  // Automation / reminders
  'forgot', 'forget', 'remind', 'reminder', 'notification', 'alert',
  'track', 'tracking', 'keep track',
  // Friction / wasted time
  'waste', 'takes forever', 'too long', 'slow', 'hours', 'manual',
  'tedious', 'repetitive', 'copy paste', 'copy-paste',
  // Organization / finding things
  'lost', 'find', 'search', 'organize', 'messy', 'scattered', 'clutter',
  'where is', "can't find", 'hard to find',
  // Communication
  'email', 'message', 'text', 'respond', 'response', 'reply',
  // Scheduling
  'schedule', 'appointment', 'calendar', 'booking', 'reschedule',
  // Money / shopping
  'price', 'overcharged', 'billing', 'bill', 'subscription', 'cancel',
  'refund', 'shipping', 'delivery', 'order',
  // Health / habits
  'habit', 'routine', 'sleep', 'exercise', 'medication', 'dose',
  // Data / info
  'data', 'report', 'log', 'record', 'dashboard', 'stats', 'analytics',
  // Passwords / accounts
  'password', 'login', 'account', 'sign in', 'forgot password',
  // General frustration with software/process
  'app', 'website', 'platform', 'software', 'tool', 'form', 'upload',
  'download', 'sync', 'update', 'install'
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
 * 
 * Categories:
 * - Communication (emails, messages, notifications)
 * - Scheduling (calendars, appointments, meetings)
 * - Finance / Shopping (bills, subscriptions, payments)
 * - Health & Habits (medication, exercise, routines)
 * - Account Management (passwords, logins)
 * - Data & Tracking (logs, reports, analytics)
 * - Organization (files, search, clutter)
 * - Software UX (apps, tools, websites)
 * - General Productivity (default fallback)
 */
function detectCategory(text) {
  const t = text.toLowerCase();
  if (/email|message|reply|respond|notification|text/.test(t)) return 'Communication';
  if (/schedule|calendar|appointment|booking|meeting/.test(t)) return 'Scheduling';
  if (/price|bill|charge|subscription|refund|payment|shipping/.test(t)) return 'Finance / Shopping';
  if (/habit|routine|sleep|exercise|medication|dose/.test(t)) return 'Health & Habits';
  if (/password|login|account|sign in/.test(t)) return 'Account Management';
  if (/track|log|record|data|report|analytics|dashboard/.test(t)) return 'Data & Tracking';
  if (/organize|find|search|lost|clutter|messy|scattered/.test(t)) return 'Organization';
  if (/app|website|platform|software|tool|upload|download|sync/.test(t)) return 'Software UX';
  return 'General Productivity';
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
  const easy = ['Communication', 'Scheduling', 'Health & Habits'];
  const medium = ['Finance / Shopping', 'Organization', 'Data & Tracking'];
  if (easy.includes(category)) return 'Beginner (1–2 weeks)';
  if (medium.includes(category)) return 'Intermediate (2–4 weeks)';
  return 'Beginner–Intermediate (1–3 weeks)';
}

/**
 * FUNCTION: suggestTitle
 * 
 * Generates a catchy project name based on the category.
 * Currently uses a simple lookup map - could be enhanced to parse
 * the actual complaint text for more custom names.
 */
function suggestTitle(text, category) {
  const map = {
    'Communication': 'SmartReply Tracker',
    'Scheduling': 'EasyBook Scheduler',
    'Finance / Shopping': 'SpendSense',
    'Health & Habits': 'HabitLoop',
    'Account Management': 'KeyVault Manager',
    'Data & Tracking': 'DataLog Dashboard',
    'Organization': 'ClearSpace Organizer',
    'Software UX': 'FlowFix Tool',
    'General Productivity': 'FocusFlow'
  };
  return map[category] || 'ProblemSolver App';
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
    'Health & Habits': [
      'Log a daily habit with a checkbox',
      'Show a weekly streak count',
      'Send a reminder at a set time each day'
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
    'Organization': [
      'Add items to a categorized list',
      'Search and filter items by tag',
      'Archive completed or resolved items'
    ],
    'Software UX': [
      'Surface the most common user complaints from a source',
      'Display complaints as filterable cards',
      'Allow users to upvote the most frustrating issues'
    ],
    'General Productivity': [
      'Create a task with a title and priority level',
      'Mark tasks as done and move them to a completed list',
      'Filter tasks by due date or category'
    ]
  };

  return features[category] || features['General Productivity'];
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

  return {
    complaint: complaint.text,
    source: complaint.source,
    category,
    techAngle: `Build a tool that removes or reduces the friction described in this complaint.`,
    projectTitle: title,
    summary: `A lightweight web app that helps users address the frustration of "${complaint.text.slice(0, 60)}..." — turned into a practical software solution.`,
    mvpFeatures: mvp,
    difficulty
  };
}

/**
 * FUNCTION: filterAndShape (MAIN ENTRY POINT)
 * 
 * Takes an array of raw complaints and:
 * 1. Filters to only tech-solvable ones (has TECH_KEYWORD, no EXCLUDE_KEYWORD)
 * 2. Transforms each passing complaint into a full card object
 * 
 * This is the main export used by routes/cards.js
 */
function filterAndShape(rawComplaints) {
  return rawComplaints
    .filter((c) => {
      const t = c.text.toLowerCase();
      
      // Must have at least one tech keyword
      const hasTechKeyword = TECH_KEYWORDS.some((kw) => t.includes(kw));
      
      // Must NOT have any exclude keywords
      const isExcluded = EXCLUDE_KEYWORDS.some((kw) => t.includes(kw));
      
      // Pass filter only if tech-related AND not excluded
      return hasTechKeyword && !isExcluded;
    })
    .map(shapeCard);  // Transform each passing complaint into a card
}

module.exports = { filterAndShape };
