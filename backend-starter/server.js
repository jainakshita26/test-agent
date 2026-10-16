// server.js - Main server file
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const dotenv = require('dotenv');

// Routes
const conversationsRoutes = require('./routes/conversations');
const agentsRoutes = require('./routes/agents');
const knowledgeBaseRoutes = require('./routes/knowledgeBase');
const analyticsRoutes = require('./routes/analytics');
const interveneRoutes = require('./routes/intervene');
const responseTemplatesRoutes = require('./routes/responseTemplates');

// Middleware
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

// WebSocket handlers
const socketHandler = require('./websocket/socketHandler');

// Config
dotenv.config();
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zangoh';

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(requestLogger);

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API routes
app.use('/api/conversations', conversationsRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/knowledge-base', knowledgeBaseRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/intervene', interveneRoutes);
app.use('/api/templates', responseTemplatesRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Error handling
app.use(errorHandler);

// WebSocket connection handling
wss.on('connection', socketHandler);

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start the server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});









