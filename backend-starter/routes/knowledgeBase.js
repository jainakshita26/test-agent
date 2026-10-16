const express = require('express');
const router  = express.Router();
const KnowledgeBase = require('../models/knowledgeBase');

// GET /api/knowledge-base
router.get('/', async (_req, res, next) => {
  try {
    const list = await KnowledgeBase.find();
    res.json(list);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
