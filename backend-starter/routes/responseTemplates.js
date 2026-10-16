// routes/responseTemplates.js — CRUD for supervisor response templates
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const ResponseTemplate = require('../models/responseTemplate');

// List all templates
router.get('/', async (_req, res, next) => {
  try {
    const templates = await ResponseTemplate.find({}).sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    next(error);
  }
});

// Get one template
router.get('/:id', async (req, res, next) => {
  try {
    const template = await ResponseTemplate.findOne({ id: req.params.id });
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json(template);
  } catch (error) {
    next(error);
  }
});

// Create a template
router.post('/', async (req, res, next) => {
  try {
    const { name, title, category, content, variables, createdBy, isShared, channel, journey, team } = req.body;
    if (!name || !category || !content) {
      return res.status(400).json({ message: 'Name, category and content are required' });
    }
    const template = await ResponseTemplate.create({
      id: `tmpl-${uuidv4().slice(0, 8)}`,
      name,
      title: title || '',
      category,
      content,
      variables: variables || [],
      createdBy: createdBy || 'supervisor',
      isShared: isShared || false,
      channel: channel || 'Website',
      journey: journey || category,
      team: team || 'All templates',
    });
    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
});

// Update a template
router.patch('/:id', async (req, res, next) => {
  try {
    const template = await ResponseTemplate.findOne({ id: req.params.id });
    if (!template) return res.status(404).json({ message: 'Template not found' });
    const updatable = ['name', 'title', 'category', 'content', 'variables', 'isShared', 'channel', 'journey', 'team', 'uses', 'starred'];
    updatable.forEach((k) => {
      if (req.body[k] !== undefined) template[k] = req.body[k];
    });
    await template.save();
    res.json(template);
  } catch (error) {
    next(error);
  }
});

// Delete a template
router.delete('/:id', async (req, res, next) => {
  try {
    const template = await ResponseTemplate.findOne({ id: req.params.id });
    if (!template) return res.status(404).json({ message: 'Template not found' });
    await template.deleteOne();
    res.json({ message: 'Template deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
