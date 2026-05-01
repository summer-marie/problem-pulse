/**
 * SCRAPER.JS - Web Scraping Module
 * 
 * This file fetches real-world complaints from:
 * 1. Reddit (r/mildlyinfuriating, r/CasualConversation)
 * 2. Hacker News (Ask HN posts)
 * 
 * All functions gracefully handle errors and return empty arrays on failure
 * so the app never crashes even if scraping breaks.
 */

const axios = require('axios');    // HTTP client for making web requests
const cheerio = require('cheerio'); // HTML parser (not used currently but available for future scraping)

/**
 * FUNCTION: scrapeReddit
 * 
 * Scrapes Reddit posts from a given subreddit using Reddit's public JSON API.
 * No API key required - just append .json to any Reddit URL to get JSON data.
 * 
 * How it works:
 * 1. Construct the JSON API URL for top posts from the past week
 * 2. Make HTTP request with custom User-Agent (Reddit blocks default axios UA)
 * 3. Extract post titles, permalinks, and upvote counts
 * 4. Filter out very short posts (< 20 chars) as they're usually not useful
 * 
 * Returns: Array of complaint objects with { text, source, url, upvotes }
 */
async function scrapeReddit(subreddit = 'mildlyinfuriating', limit = 50) {
  // Build the Reddit JSON API URL - gets top posts from the past week
  const url = `https://www.reddit.com/r/${subreddit}/top.json?limit=${limit}&t=week`;

  try {
    const response = await axios.get(url, {
      headers: {
        // Reddit blocks the default axios User-Agent; provide a custom one
        'User-Agent': 'ProblemPulse/1.0 (student project)'
      },
      timeout: 8000  // Abort request if it takes longer than 8 seconds
    });

    // Extract the array of posts from Reddit's JSON structure
    // Using optional chaining (?.) and nullish coalescing (??) for safety
    const posts = response.data?.data?.children ?? [];

    // Transform each Reddit post into our standard complaint format
    return posts
      .map((post) => ({
        text: post.data.title,                           // The post title (the complaint)
        source: `reddit.com/r/${subreddit}`,            // Where it came from
        url: `https://reddit.com${post.data.permalink}`, // Full URL to the post
        upvotes: post.data.ups                           // Popularity metric
      }))
      .filter((p) => p.text && p.text.length > 40);  // Filter out very short posts
  } catch (err) {
    // If anything goes wrong (network error, API change, timeout), log it and return empty array
    // This prevents one broken scraper from crashing the whole app
    console.error(`[scraper] Reddit fetch failed: ${err.message}`);
    return [];
  }
}

/**
 * FUNCTION: scrapeHackerNews
 * 
 * Scrapes "Ask HN" posts from Hacker News using their official Firebase API.
 * Ask HN posts are questions/problems from the developer community - perfect for project ideas.
 * 
 * How it works:
 * 1. Get the list of Ask HN story IDs (returns array of ~200 IDs)
 * 2. Take only the first `limit` IDs to avoid rate limits
 * 3. Fetch each story's details in parallel using Promise.allSettled
 *    (allSettled continues even if some requests fail)
 * 4. Extract titles and scores from successful responses
 * 
 * Returns: Array of complaint objects with { text, source, url, upvotes }
 */
async function scrapeHackerNews(limit = 30) {
  const url = 'https://hacker-news.firebaseio.com/v0/askstories.json';

  try {
    // Step 1: Get list of Ask HN story IDs
    const idResponse = await axios.get(url, { timeout: 8000 });
    const ids = idResponse.data.slice(0, limit);  // Take only first `limit` IDs

    // Step 2: Fetch each story's details in parallel
    // Promise.allSettled waits for all to finish, even if some fail
    const stories = await Promise.allSettled(
      ids.map((id) =>
        axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
          timeout: 5000  // Individual timeout per story
        })
      )
    );

    // Step 3: Transform successful responses into our standard format
    return stories
      .filter((r) => r.status === 'fulfilled' && r.value.data?.title)  // Only keep successful fetches with titles
      .map((r) => ({
        text: r.value.data.title,                                       // The Ask HN question/complaint
        source: 'news.ycombinator.com',                                 // Source identifier
        url: `https://news.ycombinator.com/item?id=${r.value.data.id}`, // Full URL to HN post
        upvotes: r.value.data.score ?? 0                                // HN score (points)
      }))
      .filter((p) => p.text.length > 40);  // Filter out very short questions
  } catch (err) {
    // If anything goes wrong, log and return empty array (graceful degradation)
    console.error(`[scraper] HN fetch failed: ${err.message}`);
    return [];
  }
}

/**
 * FUNCTION: scrapeAll (MAIN ENTRY POINT)
 * 
 * Runs all scrapers in parallel and combines results into one array.
 * 
 * Scrapes from:
 * - r/productivity (40 posts) - workflow inefficiencies, tool complaints, time-wasting tasks
 * - r/sysadmin (30 posts) - IT professionals complaining about tools, software, and automation needs
 * - Hacker News Ask HN (30 posts) - tech-focused problems from developers
 * 
 * Total: ~100 raw complaints focused on tech-solvable problems
 */
async function scrapeAll() {
  // Run all 3 scrapers in parallel for speed
  const [reddit1, reddit2, hn] = await Promise.all([
    scrapeReddit('productivity', 40),      // Workflow and productivity tool complaints
    scrapeReddit('sysadmin', 30),          // IT pro complaints about software and workflows
    scrapeHackerNews(30)
  ]);

  // Combine all results into one array
  return [...reddit1, ...reddit2, ...hn];
}

module.exports = { scrapeAll };
