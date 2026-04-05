require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');

const path     = require('path');

const complaintRoutes = require('./routes/complaints');
const adminRoutes     = require('./routes/admin');
const chatRoutes      = require('./routes/chat');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin     : process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/complaints', complaintRoutes);
app.use('/api/categories', complaintRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/chat',       chatRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Static frontend serving in production
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientPath));

  app.get('*', (req, res) => {
    if (!req.url.startsWith('/api')) {
      res.sendFile(path.join(clientPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'API route not found' });
    }
  });
} else {
  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.warn('⚠️  Starting server without database connection. Some features may not work.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();
