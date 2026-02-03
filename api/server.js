const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    service: 'genii-erp'
  });
});

// API Routes
app.use('/api/v1/organizations', require('./routes/organizations'));
app.use('/api/v1/agents', require('./routes/agents'));
app.use('/api/v1/businesses', require('./routes/businesses'));
app.use('/api/v1/projects', require('./routes/projects'));
app.use('/api/v1/collaboration', require('./routes/collaboration'));

// Root endpoint with HATEOAS
app.get('/', (req, res) => {
  res.json({
    name: 'Genii ERP API',
    version: '0.1.0',
    description: 'AI-Native ERP with Federated Agent Collaboration',
    _links: {
      health: { href: '/health', method: 'GET' },
      organizations: { href: '/api/v1/organizations', method: 'GET' },
      agents: { href: '/api/v1/agents', method: 'GET' },
      businesses: { href: '/api/v1/businesses', method: 'GET' },
      projects: { href: '/api/v1/projects', method: 'GET' },
      collaboration: { href: '/api/v1/collaboration', method: 'GET' }
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Genii ERP API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
