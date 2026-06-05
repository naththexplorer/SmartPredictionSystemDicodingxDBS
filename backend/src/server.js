import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import reportRouter from './routes/report.routes.js';
import predictionRouter from './routes/prediction.routes.js';
import disasterRouter from './routes/disaster.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/reports', reportRouter);
app.use('/api/predictions', predictionRouter);
app.use('/api/disasters', disasterRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Disaster API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});