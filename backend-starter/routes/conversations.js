// routes/conversations.js
const express = require('express');
const router = express.Router();
const Conversation = require('../models/conversation');
const { simulateDelay } = require('../utils/helpers');

// Get all conversations with pagination and filtering
router.get('/', async (req, res, next) => {
  try {
    // Extract query parameters
    const { page = 1, limit = 10, status, alertLevel, agentId } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (alertLevel) filter.alertLevel = alertLevel;
    if (agentId) filter['agent.id'] = agentId;

    // Get conversations
    const conversations = await Conversation.find(filter)
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Conversation.countDocuments(filter);

    await simulateDelay(300); // Simulate network delay

    res.json({
      data: conversations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get a specific conversation by ID
router.get('/:id', async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({ id: req.params.id });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    await simulateDelay(200); // Simulate network delay
    
    res.json(conversation);
  } catch (error) {
    next(error);
  }
});


// Add a message to a conversation
router.post('/:id/messages', async (req, res, next) => {
  try {
    const { sender, text } = req.body;
    
    if (!sender || !text) {
      return res.status(400).json({ message: 'Sender and text are required' });
    }
    
    const conversation = await Conversation.findOne({ id: req.params.id });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    const newMessage = {
      sender,
      text,
      timestamp: new Date()
    };
    
    conversation.messages.push(newMessage);
    
    // Update metrics based on new message
    if (sender === 'customer') {
      // Simulate sentiment analysis
      conversation.metrics.sentiment = Math.max(0.1, Math.min(1.0, conversation.metrics.sentiment - 0.1 + Math.random() * 0.2));
    }
    
    await conversation.save();
    
    // This would normally trigger a WebSocket update
    
    res.status(201).json(newMessage);
  } catch (error) {
    next(error);
  }
});

// Update conversation status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const conversation = await Conversation.findOne({ id: req.params.id });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    conversation.status = status;
    
    // If resolved, set end time
    if (status === 'resolved') {
      conversation.endTime = new Date();
    }
    
    await conversation.save();
    
    res.json({ message: 'Status updated', status });
  } catch (error) {
    next(error);
  }
});

// Add tags to a conversation
router.post('/:id/tags', async (req, res, next) => {
  try {
    const { tags } = req.body;
    
    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({ message: 'Tags array is required' });
    }
    
    const conversation = await Conversation.findOne({ id: req.params.id });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Add new tags (avoid duplicates)
    const uniqueTags = [...new Set([...conversation.tags, ...tags])];
    conversation.tags = uniqueTags;
    
    await conversation.save();
    
    res.json({ message: 'Tags added', tags: conversation.tags });
  } catch (error) {
    next(error);
  }
});

// Save supervisor feedback notes
router.patch('/:id/notes', async (req, res, next) => {
  try {
    const { supervisorNotes } = req.body;

    if (supervisorNotes === undefined) {
      return res.status(400).json({ message: 'supervisorNotes is required' });
    }

    const conversation = await Conversation.findOne({ id: req.params.id });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    conversation.supervisorNotes = supervisorNotes;
    await conversation.save();

    res.json({ message: 'Notes saved', supervisorNotes });
  } catch (error) {
    next(error);
  }
});

module.exports = router;