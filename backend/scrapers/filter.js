/**
 * Keywords that strongly suggest a complaint is tech-solvable.
 * A complaint only needs to match one of these to pass the filter.
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
 * Keywords that indicate a complaint is purely personal/emotional
 * and unlikely to be addressed with a software tool.
 */
const EXCLUDE_KEYWORDS = [
  'grief', 'mourning', 'funeral', 'death', 'abuse', 'assault', 'violence',
  'cancer', 'hospital', 'surgery', 'divorce', 'breakup', 'suicide',
  'racist', 'sexist', 'harassment', 'war', 'politics', 'election',
  'religion', 'god', 'pray'
];

/**
 * Very rough category guesser based on keyword presence.
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
 * Generates a rough "build difficulty" rating based on category.
 */
function estimateDifficulty(category) {
  const easy = ['Communication', 'Scheduling', 'Health & Habits'];
  const medium = ['Finance / Shopping', 'Organization', 'Data & Tracking'];
  if (easy.includes(category)) return 'Beginner (1–2 weeks)';
  if (medium.includes(category)) return 'Intermediate (2–4 weeks)';
  return 'Beginner–Intermediate (1–3 weeks)';
}

/**
 * Generates a suggested project title from the complaint text.
 * Very simple heuristic — good enough for v1.
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
 * Generates 3 realistic MVP features for the project idea.
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
 * Converts a raw complaint object into a shaped "card" object.
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
 * Filters raw complaints down to only tech-solvable ones, then shapes each into a card.
 */
function filterAndShape(rawComplaints) {
  return rawComplaints
    .filter((c) => {
      const t = c.text.toLowerCase();
      const hasTechKeyword = TECH_KEYWORDS.some((kw) => t.includes(kw));
      const isExcluded = EXCLUDE_KEYWORDS.some((kw) => t.includes(kw));
      return hasTechKeyword && !isExcluded;
    })
    .map(shapeCard);
}

module.exports = { filterAndShape };
