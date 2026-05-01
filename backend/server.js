const express = require('express');
const cors = require('cors');
const path = require('path');
const cardsRouter = require('./routes/cards');

const app = express();
const PORT = 3000;

// Allow the frontend (opened as a file or on another port) to call this API
app.use(cors());
app.use(express.json());

// Serve the frontend folder as static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API routes
app.use('/api/cards', cardsRouter);

app.listen(PORT, () => {
  console.log(`Problem Pulse server running at http://localhost:${PORT}`);
});
