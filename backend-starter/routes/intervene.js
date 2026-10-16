// routes/intervene.js
const express = require('express');
const router = express.Router();
const Conversation = require('../models/conversation');
const { simulateDelay } = require('../utils/helpers');

// Intervene in a conversation
router.post('/', async (req, res, next) => {
  try {
    const { conversationId, supervisorId, notes } = req.body;
    
    if (!conversationId || !supervisorId) {
      return res.status(400).json({ message: 'Conversation ID and supervisor ID are required' });
    }
    
    const conversation = await Conversation.findOne({ id: conversationId });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Record the intervention
    conversation.humanIntervention = {
      occurred: true,
      supervisorId,
      timestamp: new Date(),
      notes: notes || ''
    };
    
    // Change status to escalated
    conversation.status = 'escalated';
    
    await conversation.save();
    
    // This would normally trigger a WebSocket update
    
    await simulateDelay(300); // Simulate network delay
    
    res.json({ 
      message: 'Intervention recorded',
      intervention: conversation.humanIntervention
    });
  } catch (error) {
    next(error);
  }
});

// End intervention and return to agent
router.post('/release', async (req, res, next) => {
  try {
    const { conversationId, supervisorNotes } = req.body;
    
    if (!conversationId) {
      return res.status(400).json({ message: 'Conversation ID is required' });
    }
    
    const conversation = await Conversation.findOne({ id: conversationId });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Only allow release if there was an intervention
    if (!conversation.humanIntervention || !conversation.humanIntervention.occurred) {
      return res.status(400).json({ message: 'No active intervention to release' });
    }
    
    // Update status back to active
    conversation.status = 'active';
    
    // Add supervisor notes if provided
    if (supervisorNotes) {
      conversation.supervisorNotes = supervisorNotes;
    }
    
    await conversation.save();
    
    // This would normally trigger a WebSocket update
    
    await simulateDelay(300); // Simulate network delay
    
    res.json({ message: 'Intervention released, control returned to agent' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
