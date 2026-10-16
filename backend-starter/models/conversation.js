// models/conversation.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['customer', 'agent', 'supervisor'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const conversationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    id: String,
    name: String
  },
  agent: {
    id: String,
    name: String
  },
  status: {
    type: String,
    enum: ['active', 'waiting', 'resolved', 'escalated'],
    default: 'active'
  },
  alertLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  metrics: {
    sentiment: Number,
    responseTime: Number,
    confidenceScore: Number
  },
  messages: [messageSchema],
  tags: [String],
  supervisorNotes: String,
  humanIntervention: {
    occurred: {
      type: Boolean,
      default: false
    },
    supervisorId: String,
    timestamp: Date,
    notes: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);

