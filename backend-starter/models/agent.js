// models/agent.js
const mongoose = require('mongoose');

const capabilitySchema = new mongoose.Schema({
  id: String,
  name: String,
  enabled: {
    type: Boolean,
    default: true
  }
});

const knowledgeBaseSchema = new mongoose.Schema({
  id: String,
  name: String,
  enabled: {
    type: Boolean,
    default: true
  }
});

const agentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  description: String,
  parameters: {
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 1
    },
    max_tokens: {
      type: Number,
      default: 150
    },
    top_p: {
      type: Number,
      default: 1.0
    }
  },
  capabilities: [capabilitySchema],
  knowledgeBases: [knowledgeBaseSchema],
  escalationThresholds: {
    lowConfidence: Number,
    negativeSentiment: Number,
    responseTime: Number
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  metrics: {
    conversations: Number,
    avgResponseTime: Number,
    satisfaction: Number,
    escalationRate: Number,
    topIssues: [{
      name: String,
      count: Number
    }]
  }
}, { timestamps: true });

module.exports = mongoose.model('Agent', agentSchema);
