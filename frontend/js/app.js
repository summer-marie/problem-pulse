const API_URL = 'http://localhost:3000/api/cards?count=6';

const loadBtn = document.getElementById('load-btn');
const cardsContainer = document.getElementById('cards-container');
const statusMsg = document.getElementById('status-msg');

loadBtn.addEventListener('click', fetchCards);

async function fetchCards() {
  // Reset UI state
  loadBtn.disabled = true;
  loadBtn.textContent = 'Loading...';
  cardsContainer.innerHTML = '';
  showStatus('Fetching real-world complaints...');

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const cards = await response.json();

    if (!cards.length) {
      showStatus('No cards returned. Try again in a moment.');
      return;
    }

    hideStatus();
    cards.forEach((card) => cardsContainer.appendChild(buildCard(card)));
  } catch (err) {
    showStatus(`Could not load cards — is the server running? (${err.message})`);
    console.error(err);
  } finally {
    loadBtn.disabled = false;
    loadBtn.textContent = 'Get Project Ideas';
  }
}

/**
 * Builds a single card DOM element from a card data object.
 */
function buildCard(card) {
  const el = document.createElement('article');
  el.className = 'card';

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

  return el;
}

function showStatus(msg) {
  statusMsg.textContent = msg;
  statusMsg.hidden = false;
}

function hideStatus() {
  statusMsg.hidden = true;
}

/** Simple HTML escaping to prevent XSS from scraped text. */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
