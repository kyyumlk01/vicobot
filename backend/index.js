require('dotenv').config();
const express = require('express');
const cors = require('cors');

const searchRouter = require('./routes/search');
const savedRouter = require('./routes/saved');
const profileRouter = require('./routes/profile');
const trendingRouter = require('./routes/trending');
const proRouter = require('./routes/pro');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/search', searchRouter);
app.use('/api/saved', savedRouter);
app.use('/api/profile', profileRouter);
app.use('/api/trending', trendingRouter);
app.use('/api/pro', proRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('[server]', err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});