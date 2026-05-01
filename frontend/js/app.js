/**
 * APP.JS - Frontend JavaScript for Problem Pulse
 * 
 * This file handles:
 * 1. Fetching project cards from the backend API
 * 2. Rendering cards as HTML elements
 * 3. Managing loading states and error messages
 * 4. XSS protection via HTML escaping
 */

// API endpoint - requests 6 cards per load
const API_URL = 'http://localhost:3000/api/cards?count=6';

// DOM element references (cached for performance)
const loadBtn = document.getElementById('load-btn');              // The "Get Project Ideas" button
const cardsContainer = document.getElementById('cards-container'); // Container where cards are rendered
const statusMsg = document.getElementById('status-msg');          // Status/error message area

// Event listener - fetch new cards when button is clicked
loadBtn.addEventListener('click', fetchCards);

/**
 * FUNCTION: fetchCards
 * 
 * Main function that:
 * 1. Calls the backend API to get project idea cards
 * 2. Handles loading states and errors
 * 3. Renders the cards to the page
 * 
 * Called when user clicks the "Get Project Ideas" button
 */
async function fetchCards() {
  // STEP 1: Reset UI to loading state
  loadBtn.disabled = true;                      // Prevent double-clicks
  loadBtn.textContent = 'Loading...';           // Update button text
  cardsContainer.innerHTML = '';                // Clear any previous cards
  showStatus('Fetching real-world complaints...'); // Show loading message

  // STEP 2: Make API request
  try {
    const response = await fetch(API_URL);

    // Check if request was successful (status 200-299)
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    // Parse JSON response
    const cards = await response.json();

    // Handle edge case: API returned empty array
    if (!cards.length) {
      showStatus('No cards returned. Try again in a moment.');
      return;
    }

    // STEP 3: Success - render cards
    hideStatus();  // Hide loading message
    cards.forEach((card) => cardsContainer.appendChild(buildCard(card)));
    
  } catch (err) {
    // STEP 4: Handle errors (network failure, server down, etc.)
    showStatus(`Could not load cards — is the server running? (${err.message})`);
    console.error(err);  // Log full error for debugging
    
  } finally {
    // STEP 5: Reset button state (runs whether success or error)
    loadBtn.disabled = false;
    loadBtn.textContent = 'Get Project Ideas';
  }
}

/**
 * FUNCTION: buildCard
 * 
 * Creates a DOM element (HTML) for a single project idea card.
 * 
 * Takes a card object and returns an <article> element with:
 * - Category badge
 * - Project title
 * - Original complaint (quoted)
 * - Summary description
 * - MVP features list
 * - Footer with source and difficulty
 * 
 * All text is HTML-escaped to prevent XSS attacks from scraped content.
 */
function buildCard(card) {
  // Create an <article> element to hold the card
  const el = document.createElement('article');
  el.className = 'card';  // CSS class for styling

  // Build the card's HTML structure
  // escHtml() prevents XSS by escaping special characters like <, >, &, etc.
  el.innerHTML = `
    <span class="card-category">${escHtml(card.category)}</span>
    <h2 class="card-title">${escHtml(card.projectTitle)}</h2>
    <p class="card-complaint">"${escHtml(card.complaint)}"</p>
    <p class="card-summary">${escHtml(card.summary)}</p>
    <p class="card-mvp-title">MVP Features</p>
    <ul class="card-mvp-list">
      ${card.mvpFeatures.map((f) => `<li>${escHtml(f)}</li>`).join('')}
    </ul>
    <div class="card-footer">
      <span>via ${escHtml(card.source)}</span>
      <span class="card-difficulty">${escHtml(card.difficulty)}</span>
    </div>
  `;

  return el;  // Return the built element
}

/**
 * FUNCTION: showStatus
 * Shows a status/error message to the user
 */
function showStatus(msg) {
  statusMsg.textContent = msg;
  statusMsg.hidden = false;
}

/**
 * FUNCTION: hideStatus
 * Hides the status message area
 */
function hideStatus() {
  statusMsg.hidden = true;
}

/**
 * FUNCTION: escHtml (SECURITY)
 * 
 * Escapes HTML special characters to prevent XSS (Cross-Site Scripting) attacks.
 * 
 * Why this matters:
 * - We're displaying text scraped from Reddit and Hacker News
 * - If that text contains HTML like <script>alert('hacked')</script>
 * - Without escaping, it would execute as JavaScript
 * - This function converts dangerous characters to safe HTML entities
 * 
 * Conversions:
 * & → &amp;
 * < → &lt;
 * > → &gt;
 * " → &quot;
 * ' → &#39;
 */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')   // Must be first to avoid double-escaping
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
