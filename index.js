const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const app = express();
const __path = process.cwd();

// Configuration
const PORT = process.env.PORT || 4000;
const SESSION_DIR = process.env.SESSION_DIR || './session';

// Middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__path));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Routes
const pairRouter = require('./pair');
app.use('/code', pairRouter);

app.get('/pair', (req, res) => {
  res.sendFile(path.join(__path, 'pair.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__path, 'main.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };