# Problem Pulse 🔍

> Turn real-world frustrations from Reddit and Hacker News into your next coding project.

**Problem Pulse** scrapes complaints from online communities, filters them through AI-powered categorization, and transforms them into actionable project ideas complete with MVP features, difficulty estimates, and tech angles.

---

## 🎯 Features

- **Real-time Web Scraping**: Pulls fresh complaints from 6 sources (Reddit, Hacker News, Dev.to)
- **Smart Filtering**: Multi-tier keyword detection ensures only tech-solvable problems make it through
- **6 Project Categories**: Communication, Scheduling, Finance/Shopping, Account Management, Data & Tracking, Software UX
- **Dynamic Card Generation**: Each card includes:
  - Original complaint quote with source link
  - Suggested project title
  - Technical angle and summary
  - MVP feature list
  - Difficulty estimate (Beginner, Intermediate, or in-between)
- **Dark Mode UI**: Modern, hero-driven design with smooth animations
- **Intelligent Caching**: 30-minute TTL reduces API calls and improves performance
- **Rate Limiting**: 20 requests/minute per IP to prevent abuse
- **Fisher-Yates Shuffle**: Guarantees no duplicate cards in random selection

---

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express** - Server framework
- **Axios** - HTTP client for scraping Reddit, Hacker News, Dev.to
- **Cheerio** - HTML/XML parser for RSS feeds
- **express-rate-limit** - API protection
- **dotenv** - Environment variable management
- **CORS** - Cross-origin resource sharing

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **HTML5** + **CSS3** - Semantic markup and modern styling
- **Google Fonts** - Inter (body) + Syne (display)
- **CSS Custom Properties** - Dark mode design system

### Data Sources
- Reddit JSON API (r/webdev, r/sysadmin, r/devops, r/personalfinance)
- Hacker News Firebase API
- Dev.to RSS Feed (tag: discuss)

---

## 📦 Installation

### Prerequisites
- Node.js 16+ installed
- Internet connection (for web scraping)

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Problem-Pulse
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Create environment file**
   ```bash
   # In server/ directory
   echo "PORT=3000" > .env
   ```

4. **Start the server**
   ```bash
   npm start
   ```
   Server runs at `http://localhost:3000`

5. **Open the frontend**
   - Open `client/index.html` in your browser
   - Or use a local server like Live Server (VS Code extension)

---

## 🚀 Usage

1. Click **"Get Project Ideas"** button in the hero section
2. The app fetches 8 random project cards from the backend
3. Each card displays:
   - **Category badge** (e.g., Software UX, Communication)
   - **Project title** (e.g., "Email Reply Manager")
   - **Original complaint** in italics with purple left border
   - **Tech angle** with 💡 emoji
   - **Summary** describing the problem space
   - **MVP features** (3 actionable items)
   - **Source link** (clickable) and **difficulty estimate**
4. Click the source link to read the original discussion
5. Refresh cards anytime for new ideas!

---

## 📁 Project Structure

```
Problem-Pulse/
├── client/                    # Frontend files
│   ├── index.html            # Main HTML with hero section
│   ├── css/
│   │   └── style.css         # Dark mode design system
│   └── js/
│       └── app.js            # Fetch logic, card rendering, XSS protection
│
├── server/                    # Backend files
│   ├── server.js             # Express app entry point
│   ├── package.json          # Dependencies
│   ├── .env                  # Environment variables (PORT)
│   ├── .gitignore            # Ignore node_modules, cache, env files
│   │
│   ├── routes/
│   │   ├── cards.js          # Main API endpoint (GET /api/cards)
│   │   └── admin.js          # Admin endpoints (cache management)
│   │
│   ├── scrapers/
│   │   ├── scraper.js        # Web scraping logic (Reddit, HN, Dev.to)
│   │   └── filter.js         # Filtering, categorization, card shaping
│   │
│   └── data/
│       ├── cache.js          # File-based caching utilities
│       └── cache.json        # Runtime cache (git-ignored)
│
└── README.md                  # You are here!
```

---

## 🔌 API Endpoints

### Public Endpoints

#### `GET /api/cards`
Returns a random batch of project idea cards.

**Query Parameters:**
- `count` (optional): Number of cards to return (default: 6, max: 20)

**Example:**
```bash
curl http://localhost:3000/api/cards?count=8
```

**Response:**
```json
[
  {
    "complaint": "Why is there no tool to auto-reply to common support emails?",
    "source": "r/webdev",
    "url": "https://reddit.com/r/webdev/comments/...",
    "category": "Communication",
    "techAngle": "Build an email auto-responder that learns from past replies.",
    "projectTitle": "Email Reply Manager",
    "summary": "Support teams waste hours answering repetitive questions...",
    "mvpFeatures": [
      "Template library for common replies",
      "Email integration (Gmail/Outlook)",
      "Analytics dashboard for response times"
    ],
    "difficulty": "Beginner (1–2 weeks)"
  }
]
```

### Admin Endpoints

#### `POST /api/admin/clear-cache`
Manually clears the cache (useful for testing).

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared successfully.",
  "cacheAgeMs": null
}
```

#### `GET /api/admin/cache-status`
Returns cache metadata.

**Response:**
```json
{
  "exists": true,
  "ageMinutes": 12.5,
  "isStale": false
}
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `server/` directory:

```env
PORT=3000
```

### Caching

- **Cache TTL**: 30 minutes (configurable in `routes/cards.js`)
- **Cache Location**: `server/data/cache.json` (git-ignored)
- **Cache Strategy**: 
  1. Fresh cache (if < 30 min old)
  2. Live scraping (if cache expired)
  3. Stale cache fallback (if scraping fails)
  4. Hardcoded fallback dataset (if all else fails)

### Rate Limiting

- **Limit**: 20 requests per minute per IP
- **Applies to**: `/api/cards` endpoint only
- **Admin routes**: No rate limiting

---

## 🎨 Design System

### Colors
- **Background**: `#0d0d0f` (near-black)
- **Surface**: `#141417` (card background)
- **Accent**: `#7c6eff` (purple - buttons, badges, links)
- **Text**: `#e8e8f0` (light gray)
- **Muted**: `#8888a0` (complaints, descriptions)

### Typography
- **Display**: Syne (800 weight) - hero title, card titles
- **Body**: Inter (400-700) - all other text

### Components
- **Hero Section**: Full-width with Unsplash tech background + gradient overlay
- **Cards**: Dark surface with subtle border, hover lift animation
- **Button**: Purple with glow effect, spinner animation on load
- **Empty State**: Centered message when no cards match filters

---

## 🧠 How It Works

### 1. Web Scraping (`scraper.js`)
- Fetches from 6 sources in parallel using `Promise.all()`
- Reddit: JSON API (no auth required, 25-40 posts per subreddit)
- Hacker News: Firebase API (top 30 front-page stories)
- Dev.to: RSS feed (20 posts from #discuss tag)

### 2. Filtering (`filter.js`)
Three-stage filter:
1. **Frustration Check**: Must contain negative language (can't, broken, hate, etc.)
2. **Tech Keyword Check**: Must mention tech-related terms (app, software, sync, etc.)
3. **Exclude Check**: Filters out sensitive topics (grief, politics, illness, etc.)

### 3. Categorization
Pattern matching against 6 categories (checked in order):
1. Communication (email, message, notification)
2. Scheduling (calendar, appointment, booking)
3. Finance / Shopping (bill, subscription, payment)
4. Account Management (password, login, account)
5. **Software UX** (app, ui, crash, slow, broken) ← Checked before Data & Tracking
6. Data & Tracking (log, report, analytics)

### 4. Card Generation
For each valid complaint:
- Extract key noun → generate project title
- Map category → tech angle template
- Generate summary blending complaint + category context
- Create 3 MVP features based on category
- Estimate difficulty tier

### 5. Caching
- Write results to `cache.json` with timestamp
- Serve from cache for 30 minutes
- Fallback to stale cache if scraping fails

---

## 🚧 Known Limitations

- **No Authentication**: Reddit API has rate limits; heavy usage may trigger throttling
- **Static Filtering**: Category detection uses regex, not ML (some misclassifications possible)
- **No Persistence**: Cards regenerate every 30 minutes (no database)
- **English Only**: Scraping and filtering assume English text

---

## 🔮 Future Improvements (v2 Roadmap)

- [ ] Add more data sources (Stack Overflow, Twitter/X, Product Hunt)
- [ ] Implement sentiment analysis for better frustration detection
- [ ] Add user voting/favoriting system
- [ ] GitHub issue scraping for real bugs
- [ ] Export cards as Markdown or Notion templates
- [ ] Add difficulty filters and category filters in UI
- [ ] Real-time scraping dashboard (admin panel)
- [ ] OpenAI integration for better summaries

---

## 📄 License

ISC

---

## 🙏 Acknowledgments

- Reddit, Hacker News, and Dev.to communities for the complaints (and inspiration!)
- [Unsplash](https://unsplash.com) for the hero background image
- Google Fonts for Inter and Syne typography

---

**Built with ☕ and curiosity about what annoys people on the internet.**
