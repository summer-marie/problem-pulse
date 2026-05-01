/**
 * SERVER.JS - Main Entry Point for Problem Pulse Backend
 * 
 * This file sets up and starts the Express web server that:
 * 1. Serves the frontend HTML/CSS/JS files as static content
 * 2. Exposes an API endpoint (/api/cards) to fetch project idea cards
 * 3. Handles CORS so the frontend can make requests even if opened locally
 */

// Load environment variables from .env file
require('dotenv').config();

// Import required packages
const express = require('express');        // Web server framework
const cors = require('cors');              // Cross-Origin Resource Sharing middleware
const path = require('path');              // File path utilities
const rateLimit = require('express-rate-limit');  // Rate limiting middleware
const cardsRouter = require('./routes/cards');  // Router that handles /api/cards requests

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 3000;  // Use .env PORT or default to 3000

// MIDDLEWARE SETUP
// Allow the frontend (opened as a file or on another port) to call this API
// CORS prevents browser security errors when frontend and backend are on different origins
app.use(cors());

// Parse incoming JSON request bodies (e.g., if we add POST endpoints later)
app.use(express.json());

// Serve the frontend folder as static files
// This means visiting http://localhost:3000 will show index.html
// and the browser can load css/style.css, js/app.js, etc.
app.use(express.static(path.join(__dirname, '..', 'client')));

// RATE LIMITING
// Protects Reddit/HN from being hammered and prevents cache bypass abuse
// Limits each IP to 20 requests per minute on the /api/cards endpoint
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute window
  max: 20,              // max 20 requests per minute per IP
  standardHeaders: true,  // sends rate limit info in response headers
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment and try again.' }
});

// API ROUTES
// Route all requests starting with /api/cards to the cardsRouter
// Example: GET http://localhost:3000/api/cards?count=5
app.use('/api/cards', apiLimiter, cardsRouter);

// START THE SERVER
// Listen on PORT 3000 and log a success message when ready
app.listen(PORT, () => {
  console.log(`Problem Pulse server running at http://localhost:${PORT}`);
});
