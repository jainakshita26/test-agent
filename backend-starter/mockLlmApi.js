// mockLlmApi.js
// This file provides a simulated LLM API for the challenge

const express = require('express');
const router = express.Router();
const { simulateDelay } = require('../utils/helpers');

// Sample personas for different agent types
const agentPersonas = {
  'agent-cs-1': {
    name: 'Customer Service Agent',
    style: 'helpful, empathetic, solution-oriented',
    knowledge: ['general customer service', 'order processing', 'shipping'],
  },
  'agent-cs-2': {
    name: 'Product Specialist Agent',
    style: 'informative, technical, detailed',
    knowledge: ['product specifications', 'compatibility', 'features'],
  },
  'agent-cs-3': {
    name: 'Returns Specialist Agent',
    style: 'methodical, process-oriented, clear',
    knowledge: ['return policy', 'refund processing', 'exchanges'],
  },
};

// Sample responses for different message types
const responseTemplates = {
  shipping: [
    "I've checked your order status and can see that your package is currently {{status}}. The estimated delivery date is {{date}}.",
    "According to our tracking information, your order is {{status}}. It should be delivered by {{date}}.",
    "Your package is currently {{status}}. Based on the carrier's information, you can expect delivery by {{date}}.",
  ],
  returns: [
    "I can help you process that return. Please {{instruction}} and we'll issue a refund within {{timeframe}} once we receive the item.",
    "To return that item, you'll need to {{instruction}}. Your refund will be processed within {{timeframe}} after we receive it.",
    "I've started the return process for you. The next step is to {{instruction}}, and you should see your refund within {{timeframe}}.",
  ],
  product: [
    "The {{product}} features {{feature1}}, {{feature2}}, and {{feature3}}. It's compatible with {{compatibility}}.",
    "Our {{product}} comes with {{feature1}} and {{feature2}}. Many customers especially like the {{feature3}}.",
    "The {{product}} is designed for {{purpose}} with features like {{feature1}} and {{feature2}}.",
  ],
  general: [
    "I understand your concern about {{issue}}. Let me help you resolve this by {{solution}}.",
    "Thank you for bringing this {{issue}} to our attention. We can address this by {{solution}}.",
    "I apologize for the inconvenience regarding {{issue}}. Here's what I can do to help: {{solution}}.",
  ],
};

// Response generation endpoint
router.post('/generate', async (req, res) => {
  try {
    const { conversationId, messages, parameters, capabilities, knowledgeBases } = req.body;
    
    // Simulate processing delay based on complexity
    const delayTime = Math.floor(300 + Math.random() * 700);
    await simulateDelay(delayTime);
    
    // Get the last customer message
    const lastCustomerMessage = [...messages].reverse().find(m => m.role === 'customer');
    
    // Determine message type/intent
    const messageIntent = determineIntent(lastCustomerMessage?.content || '');
    
    // Generate appropriate response
    const response = generateResponse(messageIntent, lastCustomerMessage?.content || '', parameters, knowledgeBases);
    
    // Calculate mock metrics
    const metrics = {
      responseTime: delayTime / 1000,
      confidenceScore: parameters?.temperature 
        ? Math.max(0.4, 1 - parameters.temperature) 
        : Math.random() * 0.3 + 0.6,
      sentiment: null  // Sentiment is calculated on customer messages, not agent responses
    };
    
    res.json({
      response,
      metrics
    });
  } catch (error) {
    console.error('Error generating LLM response:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Sentiment analysis endpoint
router.post('/sentiment', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    // Simulate processing delay
    await simulateDelay(200);
    
    // Calculate mock sentiment
    const sentiment = calculateSentiment(text);
    
    res.json({
      sentiment: sentiment.score,
      analysis: {
        emotion: sentiment.emotion,
        intensity: sentiment.intensity,
        keywords: sentiment.keywords
      }
    });
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

// Knowledge retrieval endpoint
router.post('/knowledge', async (req, res) => {
  try {
    const { query, knowledgeBases, limit = 3 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Simulate processing delay
    await simulateDelay(300);
    
    // Retrieve mock knowledge
    const results = retrieveKnowledge(query, knowledgeBases, limit);
    
    res.json({ results });
  } catch (error) {
    console.error('Error retrieving knowledge:', error);
    res.status(500).json({ error: 'Failed to retrieve knowledge' });
  }
});

// Helper functions

// Determine the intent of a message
function determineIntent(message) {
  message = message.toLowerCase();
  
  if (message.includes('ship') || message.includes('deliver') || message.includes('track') || message.includes('arrive')) {
    return 'shipping';
  }
  
  if (message.includes('return') || message.includes('refund') || message.includes('money back') || message.includes('exchange')) {
    return 'returns';
  }
  
  if (message.includes('feature') || message.includes('work') || message.includes('spec') || message.includes('compatible')) {
    return 'product';
  }
  
  return 'general';
}

// Generate a response based on intent and content
function generateResponse(intent, content, parameters, knowledgeBases) {
  // Select a template
  const templates = responseTemplates[intent] || responseTemplates.general;
  const templateIndex = Math.floor(Math.random() * templates.length);
  let response = templates[templateIndex];
  
  // Fill in placeholders based on intent
  switch (intent) {
    case 'shipping':
      const statuses = ['in transit', 'at the local distribution center', 'out for delivery', 'being processed'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 5) + 1);
      const date = futureDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      
      response = response.replace('{{status}}', status).replace('{{date}}', date);
      break;
      
    case 'returns':
      const instructions = [
        'print the return label from your account page',
        'respond with your order number and reason for return',
        'take the package to any postal service location'
      ];
      const instruction = instructions[Math.floor(Math.random() * instructions.length)];
      
      const timeframes = ['3-5 business days', '7-10 business days', '24-48 hours'];
      const timeframe = timeframes[Math.floor(Math.random() * timeframes.length)];
      
      response = response.replace('{{instruction}}', instruction).replace('{{timeframe}}', timeframe);
      break;
      
    case 'product':
      // Extract product name from content if possible
      let product = 'product';
      const productMatch = content.match(/about the ([a-zA-Z0-9\s]+)/) || content.match(/([a-zA-Z0-9\s]+) features/);
      if (productMatch) {
        product = productMatch[1];
      }
      
      const features = [
        'adjustable settings',
        'eco-friendly materials',
        'extended battery life',
        'compact design',
        'wireless connectivity',
        'water resistance',
        'one-touch operation'
      ];
      
      const feature1 = features[Math.floor(Math.random() * features.length)];
      let feature2 = features[Math.floor(Math.random() * features.length)];
      while (feature2 === feature1) {
        feature2 = features[Math.floor(Math.random() * features.length)];
      }
      let feature3 = features[Math.floor(Math.random() * features.length)];
      while (feature3 === feature1 || feature3 === feature2) {
        feature3 = features[Math.floor(Math.random() * features.length)];
      }
      
      const compatibilities = [
        'all major devices',
        'both iOS and Android',
        'standard USB connections',
        'most home appliances'
      ];
      const compatibility = compatibilities[Math.floor(Math.random() * compatibilities.length)];
      
      response = response
        .replace('{{product}}', product)
        .replace('{{feature1}}', feature1)
        .replace('{{feature2}}', feature2)
        .replace('{{feature3}}', feature3)
        .replace('{{compatibility}}', compatibility)
        .replace('{{purpose}}', 'everyday use');
      break;
      
    case 'general':
      // Extract issue from content if possible
      let issue = 'your issue';
      const issueMatch = content.match(/about ([a-zA-Z0-9\s]+)/) || content.match(/([a-zA-Z0-9\s]+) problem/);
      if (issueMatch) {
        issue = issueMatch[1];
      }
      
      const solutions = [
        'checking your account details',
        'reaching out to our specialist team',
        'reviewing your recent transactions',
        'providing a step-by-step guide',
        'offering a one-time courtesy credit'
      ];
      const solution = solutions[Math.floor(Math.random() * solutions.length)];
      
      response = response.replace('{{issue}}', issue).replace('{{solution}}', solution);
      break;
  }
  
  // If low temperature is set, make response more direct and concise
  if (parameters && parameters.temperature && parameters.temperature < 0.3) {
    response = response.replace(/I've|I can|I'll/, '').trim();
    response = response.split('.')[0] + '.';
  }
  
  // If high temperature is set, add some variability
  if (parameters && parameters.temperature && parameters.temperature > 0.7) {
    const extras = [
      " Is there anything else I can help you with today?",
      " Please let me know if you need any clarification.",
      " I'm here to help if you have more questions.",
      " Your satisfaction is our priority."
    ];
    response += extras[Math.floor(Math.random() * extras.length)];
  }
  
  return response;
}

// Calculate sentiment based on text content
function calculateSentiment(text) {
  text = text.toLowerCase();
  
  // Define positive and negative keywords
  const positiveWords = [
    'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'helpful',
    'thank', 'thanks', 'appreciate', 'happy', 'pleased', 'love', 'like'
  ];
  
  const negativeWords = [
    'bad', 'terrible', 'awful', 'horrible', 'poor', 'disappointed', 'frustrating',
    'angry', 'upset', 'annoyed', 'unhappy', 'hate', 'dislike', 'problem', 'issue',
    'wrong', 'mistake', 'error', 'delay', 'broken', 'failure', 'fail'
  ];
  
  const intensifiers = [
    'very', 'extremely', 'incredibly', 'really', 'so', 'too', 'absolutely',
    '!', 'never', 'always'
  ];
  
  // Count occurrences
  let positiveCount = 0;
  let negativeCount = 0;
  let intensifierCount = 0;
  
  const words = text.split(/\s+/);
  
  // Find matching keywords
  const foundKeywords = [];
  
  words.forEach(word => {
    const cleanWord = word.replace(/[.,!?;:]/g, '');
    
    if (positiveWords.includes(cleanWord)) {
      positiveCount++;
      foundKeywords.push(cleanWord);
    }
    
    if (negativeWords.includes(cleanWord)) {
      negativeCount++;
      foundKeywords.push(cleanWord);
    }
    
    if (intensifiers.includes(cleanWord)) {
      intensifierCount++;
      // Only add intensifiers to keywords if they seem significant
      if (text.length < 50) {
        foundKeywords.push(cleanWord);
      }
    }
  });
  
  // Check for negation
  if (text.includes("not ") || text.includes("n't ") || text.includes(" no ")) {
    // Flip some positive to negative if negation exists
    const negationImpact = Math.min(positiveCount, 2);
    positiveCount -= negationImpact;
    negativeCount += negationImpact;
  }
  
  // Calculate base sentiment score (0-1 scale, 0.5 is neutral)
  const total = positiveCount + negativeCount;
  let score;
  
  if (total === 0) {
    score = 0.5; // Neutral
  } else {
    score = 0.5 + (0.5 * (positiveCount - negativeCount) / total);
  }
  
  // Apply intensifiers
  if (score < 0.5 && intensifierCount > 0) {
    // More negative with intensifiers
    score = Math.max(0.1, score - (intensifierCount * 0.05));
  } else if (score > 0.5 && intensifierCount > 0) {
    // More positive with intensifiers
    score = Math.min(0.9, score + (intensifierCount * 0.05));
  }
  
  // Determine emotion
  let emotion;
  if (score < 0.3) {
    emotion = 'angry';
  } else if (score < 0.4) {
    emotion = 'frustrated';
  } else if (score < 0.45) {
    emotion = 'disappointed';
  } else if (score > 0.8) {
    emotion = 'delighted';
  } else if (score > 0.7) {
    emotion = 'satisfied';
  } else if (score > 0.6) {
    emotion = 'pleased';
  } else {
    emotion = 'neutral';
  }
  
  // Determine intensity
  let intensity;
  if (intensifierCount === 0) {
    intensity = 'low';
  } else if (intensifierCount === 1) {
    intensity = 'medium';
  } else {
    intensity = 'high';
  }
  
  return {
    score,
    emotion,
    intensity,
    keywords: foundKeywords.slice(0, 3) // Return up to 3 most relevant keywords
  };
}

// Mock knowledge retrieval
function retrieveKnowledge(query, knowledgeBases = [], limit = 3) {
  query = query.toLowerCase();
  
  // Sample knowledge entries
  const knowledgeEntries = [
    {
      text: "For delays exceeding 3 business days beyond the original estimate: Offer 10% refund on shipping costs and provide expedited shipping on next order.",
      source: "Customer Service Guidelines",
      section: "Issue Handling Protocols > Shipping and Delivery Issues > Delayed Shipments",
      knowledgeBase: "kb-cs-general"
    },
    {
      text: "Lost packages investigation takes 3-5 business days. If confirmed lost, offer immediate replacement with expedited shipping or process full refund including shipping costs.",
      source: "Customer Service Guidelines",
      section: "Issue Handling Protocols > Shipping and Delivery Issues > Lost Packages",
      knowledgeBase: "kb-cs-general"
    },
    {
      text: "Standard Return Window: Non-Electronics: 30 days from delivery date, Electronics: 15 days from delivery date, Seasonal Items: 14 days from delivery date, Luxury Items: 10 days from delivery date.",
      source: "Return Policy",
      section: "General Return Policy > Standard Return Window",
      knowledgeBase: "kb-return-policy"
    },
    {
      text: "Return Methods: In-Store Returns at any RetailPlus location, Mail-In Returns using our prepaid return label, Third-Party Drop-Off at partner locations (fees may apply), Scheduled Pickup for large items (fees may apply).",
      source: "Return Policy",
      section: "General Return Policy > Return Methods",
      knowledgeBase: "kb-return-policy"
    },
    {
      text: "Refund Methods: Original Payment Method (3-5 business days), Store Credit (instantly available), Gift Returns (store credit only).",
      source: "Return Policy",
      section: "General Return Policy > Refund Methods",
      knowledgeBase: "kb-return-policy"
    },
    {
      text: "Eco-Friendly Blender features: 1200-watt motor, 5 variable speeds, pulse function, 64oz BPA-free container, stainless steel blades, dishwasher-safe components, 2-year warranty.",
      source: "Product Catalog",
      section: "Kitchen Appliances > Blenders > Eco-Friendly Blender",
      knowledgeBase: "kb-product-catalog"
    },
    {
      text: "Smart Home Security System includes: 1 base station, 2 motion sensors, 3 contact sensors, 1 keypad, 1 range extender. Compatible with Alexa, Google Assistant, and Apple HomeKit. Requires 2.4GHz WiFi connection.",
      source: "Product Catalog",
      section: "Smart Home > Security > Smart Home Security System",
      knowledgeBase: "kb-product-catalog"
    },
    {
      text: "Double charges must be verified in the payment system. If confirmed, process immediate refund, provide transaction reference number, send email confirmation, and add $10 store credit as goodwill gesture.",
      source: "Customer Service Guidelines",
      section: "Issue Handling Protocols > Payment and Billing Issues > Double Charges",
      knowledgeBase: "kb-cs-general"
    },
    {
      text: "For shipping delays affecting deliveries during holiday season (November 15 - January 15): Extended return windows (60 days instead of 30), prioritize gift-related inquiries, allow additional compensation flexibility for holiday gifts arriving after December 25.",
      source: "Customer Service Guidelines",
      section: "Special Circumstances > Seasonal Adjustments",
      knowledgeBase: "kb-cs-general"
    },
    {
      text: "VIP Customers (Loyalty Tier Platinum and Above): Expedited handling of all inquiries, direct access to senior agents, additional compensation authorization (up to 20% above standard limits), personal follow-up from account manager for significant issues.",
      source: "Customer Service Guidelines",
      section: "Special Circumstances > VIP Customers",
      knowledgeBase: "kb-cs-general"
    }
  ];
  
  // Filter by knowledge base if specified
  let filteredEntries = knowledgeEntries;
  if (knowledgeBases && knowledgeBases.length > 0) {
    filteredEntries = knowledgeEntries.filter(entry => 
      knowledgeBases.includes(entry.knowledgeBase)
    );
  }
  
  // Score entries based on relevance to query
  const scoredEntries = filteredEntries.map(entry => {
    // Simple scoring based on word overlap
    const queryWords = query.split(/\s+/);
    const entryText = entry.text.toLowerCase();
    
    let relevanceScore = 0;
    queryWords.forEach(word => {
      if (word.length > 3 && entryText.includes(word)) {
        relevanceScore += 0.2;
      }
    });
    
    // Boost score for entries that contain phrases from the query
    for (let i = 0; i < queryWords.length - 1; i++) {
      const phrase = queryWords[i] + ' ' + queryWords[i + 1];
      if (entryText.includes(phrase)) {
        relevanceScore += 0.3;
      }
    }
    
    // Add some randomness to make it more realistic
    relevanceScore += Math.random() * 0.3;
    
    // Cap at 0.95 to avoid perfect scores
    relevanceScore = Math.min(0.95, relevanceScore);
    
    return {
      ...entry,
      relevance: Number(relevanceScore.toFixed(2))
    };
  });
  
  // Sort by relevance and limit results
  const results = scoredEntries
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
  
  return results;
}

module.exports = router;
