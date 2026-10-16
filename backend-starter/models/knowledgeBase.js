// models/knowledgeBase.js
const mongoose = require('mongoose');

const knowledgeBaseSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  documentCount: Number,
  lastUpdated: Date
}, { timestamps: true });

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);


