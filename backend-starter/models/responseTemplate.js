// models/responseTemplate.js
const mongoose = require('mongoose');

const responseTemplateSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  variables: [{
    name: String,
    description: String
  }],
  createdBy: String,
  isShared: {
    type: Boolean,
    default: false
  },
  channel: {
    type: String,
    default: 'Website'
  },
  journey: {
    type: String,
    default: 'Onboarding'
  },
  team: {
    type: String,
    default: 'All templates'
  },
  uses: {
    type: Number,
    default: 0
  },
  starred: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('ResponseTemplate', responseTemplateSchema);
