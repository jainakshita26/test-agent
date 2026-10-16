// routes/agents.js
const express = require('express');
const router = express.Router();
const Agent = require('../models/agent');
const { simulateDelay } = require('../utils/helpers');

// Get all agents
router.get('/', async (req, res, next) => {
  try {
    const agents = await Agent.find();
    
    await simulateDelay(200); // Simulate network delay
    
    res.json(agents);
  } catch (error) {
    next(error);
  }
});

// Get a specific agent
router.get('/:id', async (req, res, next) => {
  try {
    const agent = await Agent.findOne({ id: req.params.id });
    
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    
    await simulateDelay(200); // Simulate network delay
    
    res.json(agent);
  } catch (error) {
    next(error);
  }
});

// Update agent configuration
router.patch('/:id/config', async (req, res, next) => {
  try {
    const { parameters, capabilities, knowledgeBases, escalationThresholds } = req.body;
    
    const agent = await Agent.findOne({ id: req.params.id });
    
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    
    // Update only provided fields
    if (parameters) agent.parameters = { ...agent.parameters, ...parameters };
    
    if (capabilities) {
      capabilities.forEach(cap => {
        const existing = agent.capabilities.find(c => c.id === cap.id);
        if (existing) {
          existing.enabled = cap.enabled;
        }
      });
    }
    
    if (knowledgeBases) {
      knowledgeBases.forEach(kb => {
        const existing = agent.knowledgeBases.find(k => k.id === kb.id);
        if (existing) {
          existing.enabled = kb.enabled;
        } else {
          // Allow enabling knowledge bases not yet attached to this agent
          agent.knowledgeBases.push({ id: kb.id, name: kb.name || kb.id, enabled: kb.enabled !== false });
        }
      });
    }
    
    if (escalationThresholds) {
      agent.escalationThresholds = { ...agent.escalationThresholds, ...escalationThresholds };
    }
    
    await agent.save();
    
    await simulateDelay(300); // Simulate network delay
    
    res.json({ message: 'Agent configuration updated', agent });
  } catch (error) {
    next(error);
  }
});

// Get agent performance metrics
router.get('/:id/metrics', async (req, res, next) => {
  try {
    const agent = await Agent.findOne({ id: req.params.id });
    
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    
    // This would normally fetch metrics from analytics service
    const metrics = agent.metrics || {
      conversations: 0,
      avgResponseTime: 0,
      satisfaction: 0,
      escalationRate: 0,
      topIssues: []
    };
    
    await simulateDelay(300); // Simulate network delay
    
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

module.exports = router;