const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrapes Reddit "mildlyinfuriating" posts as a source of real-world complaints.
 * Uses the Reddit JSON API — no API key needed for public subreddits.
 * Falls back to an empty array if the request fails so the app never crashes.
 */
async function scrapeReddit(subreddit = 'mildlyinfuriating', limit = 50) {
  const url = `https://www.reddit.com/r/${subreddit}/top.json?limit=${limit}&t=week`;

  try {
    const response = await axios.get(url, {
      headers: {
        // Reddit blocks the default axios UA; a browser-like one works fine
        'User-Agent': 'ProblemPulse/1.0 (student project)'
      },
      timeout: 8000
    });

    const posts = response.data?.data?.children ?? [];

    return posts
      .map((post) => ({
        text: post.data.title,
        source: `reddit.com/r/${subreddit}`,
        url: `https://reddit.com${post.data.permalink}`,
        upvotes: post.data.ups
      }))
      .filter((p) => p.text && p.text.length > 20);
  } catch (err) {
    console.error(`[scraper] Reddit fetch failed: ${err.message}`);
    return [];
  }
}

/**
 * Scrapes the Hacker News "Ask HN" posts, which often contain real pain points
 * from developers and tech-savvy users — great project inspiration.
 */
async function scrapeHackerNews(limit = 30) {
  const url = 'https://hacker-news.firebaseio.com/v0/askstories.json';

  try {
    const idResponse = await axios.get(url, { timeout: 8000 });
    const ids = idResponse.data.slice(0, limit);

    // Fetch each story in parallel
    const stories = await Promise.allSettled(
      ids.map((id) =>
        axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
          timeout: 5000
        })
      )
    );

    return stories
      .filter((r) => r.status === 'fulfilled' && r.value.data?.title)
      .map((r) => ({
        text: r.value.data.title,
        source: 'news.ycombinator.com',
        url: `https://news.ycombinator.com/item?id=${r.value.data.id}`,
        upvotes: r.value.data.score ?? 0
      }))
      .filter((p) => p.text.length > 20);
  } catch (err) {
    console.error(`[scraper] HN fetch failed: ${err.message}`);
    return [];
  }
}

/**
 * Master scrape function — runs all sources and returns one combined array.
 */
async function scrapeAll() {
  const [reddit1, reddit2, hn] = await Promise.all([
    scrapeReddit('mildlyinfuriating', 40),
    scrapeReddit('CasualConversation', 30),
    scrapeHackerNews(30)
  ]);

  return [...reddit1, ...reddit2, ...hn];
}

module.exports = { scrapeAll };
