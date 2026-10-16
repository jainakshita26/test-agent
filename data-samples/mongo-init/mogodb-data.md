Sample conversation data

// Sample conversation data for the challenge
// To be loaded into MongoDB during initialization

const conversations = [
  {
    id: "conv-2023-10",
    customer: {
      id: "cust-5672",
      name: "Alex Johnson"
    },
    agent: {
      id: "agent-cs-1",
      name: "Customer Service Agent"
    },
    status: "active",
    alertLevel: "high",
    startTime: new Date(Date.now() - 20 * 60000).toISOString(),
    metrics: {
      sentiment: 0.2,
      responseTime: 15.3,
      confidenceScore: 0.65
    },
    messages: [
      {
        sender: "customer",
        text: "I ordered a package 5 days ago and it still hasn't arrived. The tracking hasn't updated in 3 days.",
        timestamp: new Date(Date.now() - 20 * 60000).toISOString()
      },
      {
        sender: "agent",
        text: "I understand your concern about your package. Let me check the status for you. Could you please provide your order number?",
        timestamp: new Date(Date.now() - 19 * 60000).toISOString()
      },
      {
        sender: "customer",
        text: "Order #ORD-29384-KJH. I need this package by tomorrow for my daughter's birthday.",
        timestamp: new Date(Date.now() - 18 * 60000).toISOString()
      },
      {
        sender: "agent",
        text: "Thank you for providing your order number. I'm checking your order status now.",
        timestamp: new Date(Date.now() - 17 * 60000).toISOString()
      },
      {
        sender: "agent",
        text: "I can see that your package is currently in transit. Sometimes tracking information may take time to update.",
        timestamp: new Date(Date.now() - 16 * 60000).toISOString()
      },
      {
        sender: "customer",
        text: "That's not helpful at all. I need to know if it will arrive by tomorrow. This is a gift for my daughter!",
        timestamp: new Date(Date.now() - 15 * 60000).toISOString()
      },
      {
        sender: "agent",
        text: "I apologize for the inconvenience. Based on the current location of your package, standard delivery estimates suggest it should arrive within 1-2 business days.",
        timestamp: new Date(Date.now() - 14 * 60000).toISOString()
      },
      {
        sender: "customer",
        text: "That's not good enough. I paid for express shipping specifically to have it arrive by tomorrow. I want to speak to a human representative.",
        timestamp: new Date(Date.now() - 13 * 60000).toISOString()
      }
    ],
    tags: ["shipping", "delay", "urgent", "escalation-requested"]
  },
  
  {
    id: "conv-2023-45",
    customer: {
      id: "cust-3891",
      name: "Morgan Smith"
    },
    agent: {
      id: "agent-cs-2",
      name: "Product Specialist Agent"
    },
    status: "active",
    alertLevel: "low",
    startTime: new Date(Date.now() - 10 * 60000).toISOString(),
    metrics: {
      sentiment: 0.8,
      responseTime: 8.2,
      confidenceScore: 0.92
    },
    messages: [
      {
        sender: "customer",
        text: "Does the Eco-Friendly Blender come with a warranty?",
        timestamp: new Date(Date.now() - 10 * 60000).toISOString()
      },
      {
        sender: "agent",
        text: "Yes, the Eco-Friendly Blender comes with a 2-year manufacturer's warranty that covers parts and labor for defects in materials or workmanship.",
        timestamp: new Date(Date.now() - 9 * 60000).toISOString()
      },
      {
        sender: "customer",
        text: "Great! And what's the wattage on the motor?",
        timestamp: new Date(Date.now() - 8 * 60000).toISOString()
      },
      {
        sender: "agent",
        text: "The Eco-Friendly Blender features a powerful 1200-watt motor, which is excellent for blending tough ingredients like frozen fruits and vegetables.",
        timestamp: new Date(Date.now() - 7 * 60000).toISOString()
      },
      {
        sender: "customer",
        text: "Perfect. One last question - does it come in any colors besides white?",
        timestamp: new Date(Date.now() - 6 * 60000).toISOString()
      },
      {
        sender: "agent",
        text: "Yes, the Eco-Friendly Blender is available in white, black, red, and a limited edition green color. All colors are currently in stock and the same price.",
        timestamp: new Date(Date.now() - 5 * 60000).toISOString()
      },
      {
        sender: "customer",
        text: "Thanks so much for the information! I think I'll go with the red one.",
        timestamp: new Date(Date.now() - 4 * 60000).toISOString()
      }
    ],
    tags: ["product", "information", "positive"]
  },
  
  {
    id: "conv-2023-78",
    customer: {
      id: "cust-7294",
      name: "Jamie Lee"
    },
    agent: {
      id: "agent-cs-3",
      name: "Returns Specialist Agent"
    },
    status: "active",
    alertLevel: "medium",
    startTime: new Date(Date.now() - 15 * 60000).toISOString(),
    metrics: {
      sentiment: 0.5,
      responseTime: 12.7,
      confidenceScore: 0.75
    },
    messages: [
      {
        sender: "customer",
        text: "I bought a sweater last month but it's pilling badly after just two washes. I'd like to return it but I no longer have the receipt. Can I still get a refund? Also, if I exchange it for something else, will I need to pay for shipping?",
        timestamp: new Date(Date.now() - 15 * 60000).toISOString()
      },
      {
        sender: "agent",
        text: "I'm sorry to hear about the quality issue with your sweater. For returns without a receipt, we can offer store credit at the current selling price if we can verify the purchase through the credit card used, your loyalty account, or email address.",
        timestamp: new Date(Date.now() - 14 * 60000).toISOString()
      },
      {
        sender: "customer",
        text: "I used my loyalty account when purchasing. It's linked to my email jamie.lee@example.com.",
        timestamp: new Date(Date.now() - 13 * 60000).toISOString()
      },
      {
        sender: "agent",
        text: "Thank you for providing that information. Let me check your purchase history through your loyalty account.",
        timestamp: new Date(Date.now() - 12 * 60000).toISOString()
      },
      {
        sender: "agent",
        text: "I've found your purchase from April 15th for the Cozy Comfort Sweater in size M for $49.99. Since this is a quality issue, we'd be happy to process a full refund to your original payment method.",
        timestamp: new Date(Date.now() - 11 * 60000).toISOString()
      },
      {
        sender: "customer",
        text: "That's great, thanks! What about my second question regarding exchange shipping?",
        timestamp: new Date(Date.now() - 10 * 60000).toISOString()
      },
      {
        sender: "agent",
        text: "For exchanges due to quality issues, we cover the return shipping costs. If you'd like to exchange for a different item, we also provide free shipping for the new item as a courtesy.",
        timestamp: new Date(Date.now() - 9 * 60000).toISOString()
      },
      {
        sender: "customer",
        text: "Perfect! I think I'll go ahead with the refund for now and order something else later. How do I start the return process?",
        timestamp: new Date(Date.now() - 8 * 60000).toISOString()
      },
      {
        sender: "agent",
        text: "I'll email you a prepaid return shipping label that you can print out. Pack the sweater in any box or envelope, attach the label, and drop it off at any postal service location or scheduled pickup. Once we receive it, we'll process your refund within 3-5 business days.",
        timestamp: new Date(Date.now() - 7 * 60000).toISOString()
      }
    ],
    tags: ["returns", "quality-issue", "multi-part-question"]
  }
];

// Agent configuration data
const agentConfigurations = [
  {
    id: "agent-cs-1",
    name: "Customer Service Agent",
    model: "gpt-3.5-turbo",
    parameters: {
      temperature: 0.7,
      max_tokens: 150,
      top_p: 1.0
    },
    capabilities: [
      { id: "order_lookup", enabled: true },
      { id: "return_processing", enabled: true },
      { id: "product_info", enabled: true },
      { id: "shipping_calculator", enabled: false },
      { id: "discount_manager", enabled: false }
    ],
    knowledgeBases: [
      { id: "kb-cs-general", name: "Customer Service Guidelines", enabled: true },
      { id: "kb-product-catalog", name: "Product Catalog", enabled: true },
      { id: "kb-shipping-policy", name: "Shipping Policy", enabled: true },
      { id: "kb-return-policy", name: "Return Policy", enabled: true }
    ],
    escalationThresholds: {
      lowConfidence: 0.4,
      negativeSentiment: 0.3,
      responseTime: 20
    }
  },
  {
    id: "agent-cs-2",
    name: "Product Specialist Agent",
    model: "gpt-4o",
    parameters: {
      temperature: 0.5,
      max_tokens: 200,
      top_p: 0.9
    },
    capabilities: [
      { id: "order_lookup", enabled: false },
      { id: "return_processing", enabled: false },
      { id: "product_info", enabled: true },
      { id: "product_comparison", enabled: true },
      { id: "technical_support", enabled: true }
    ],
    knowledgeBases: [
      { id: "kb-product-catalog", name: "Product Catalog", enabled: true },
      { id: "kb-product-specs", name: "Technical Specifications", enabled: true },
      { id: "kb-product-faq", name: "Product FAQs", enabled: true }
    ],
    escalationThresholds: {
      lowConfidence: 0.6,
      negativeSentiment: 0.4,
      responseTime: 15
    }
  },
  {
    id: "agent-cs-3",
    name: "Returns Specialist Agent",
    model: "claude-3-haiku",
    parameters: {
      temperature: 0.3,
      max_tokens: 150,
      top_p: 0.95
    },
    capabilities: [
      { id: "order_lookup", enabled: true },
      { id: "return_processing", enabled: true },
      { id: "refund_calculator", enabled: true },
      { id: "shipping_calculator", enabled: true },
      { id: "discount_manager", enabled: false }
    ],
    knowledgeBases: [
      { id: "kb-return-policy", name: "Return Policy", enabled: true },
      { id: "kb-shipping-policy", name: "Shipping Policy", enabled: true },
      { id: "kb-warranty-info", name: "Warranty Information", enabled: true }
    ],
    escalationThresholds: {
      lowConfidence: 0.5,
      negativeSentiment: 0.3,
      responseTime: 18
    }
  }
];

// Knowledge base data
const knowledgeBases = [
  {
    id: "kb-cs-general",
    name: "Customer Service Guidelines",
    description: "General customer service policies and procedures",
    documentCount: 45,
    lastUpdated: "2023-09-15T14:30:00Z"
  },
  {
    id: "kb-product-catalog",
    name: "Product Catalog",
    description: "Complete product listings with details and pricing",
    documentCount: 1243,
    lastUpdated: "2023-10-01T09:15:00Z"
  },
  {
    id: "kb-shipping-policy",
    name: "Shipping Policy",
    description: "Shipping options, timelines, and costs",
    documentCount: 12,
    lastUpdated: "2023-08-22T11:45:00Z"
  },
  {
    id: "kb-return-policy",
    name: "Return Policy",
    description: "Return and exchange procedures and limitations",
    documentCount: 18,
    lastUpdated: "2023-09-05T16:20:00Z"
  },
  {
    id: "kb-product-specs",
    name: "Technical Specifications",
    description: "Detailed technical information for all products",
    documentCount: 842,
    lastUpdated: "2023-09-28T13:10:00Z"
  },
  {
    id: "kb-product-faq",
    name: "Product FAQs",
    description: "Frequently asked questions about products",
    documentCount: 367,
    lastUpdated: "2023-09-18T10:30:00Z"
  },
  {
    id: "kb-warranty-info",
    name: "Warranty Information",
    description: "Warranty terms and claim procedures",
    documentCount: 29,
    lastUpdated: "2023-08-15T15:45:00Z"
  }
];

// Performance metrics
const performanceMetrics = {
  daily: [
    { date: "2023-10-01", conversations: 1245, avgResponseTime: 12.3, satisfaction: 0.87, escalationRate: 0.15 },
    { date: "2023-10-02", conversations: 1187, avgResponseTime: 11.9, satisfaction: 0.89, escalationRate: 0.12 },
    { date: "2023-10-03", conversations: 1302, avgResponseTime: 13.1, satisfaction: 0.86, escalationRate: 0.16 },
    { date: "2023-10-04", conversations: 1275, avgResponseTime: 12.8, satisfaction: 0.88, escalationRate: 0.14 },
    { date: "2023-10-05", conversations: 1345, avgResponseTime: 13.5, satisfaction: 0.85, escalationRate: 0.17 },
    { date: "2023-10-06", conversations: 982, avgResponseTime: 10.9, satisfaction: 0.90, escalationRate: 0.11 },
    { date: "2023-10-07", conversations: 876, avgResponseTime: 10.2, satisfaction: 0.92, escalationRate: 0.09 }
  ],
  
  agents: [
    { 
      id: "agent-cs-1", 
      name: "Customer Service Agent",
      metrics: {
        conversations: 2456,
        avgResponseTime: 12.7,
        satisfaction: 0.86,
        escalationRate: 0.16,
        topIssues: [
          { name: "Shipping Delays", count: 587 },
          { name: "Order Status", count: 423 },
          { name: "Payment Issues", count: 312 }
        ]
      }
    },
    { 
      id: "agent-cs-2", 
      name: "Product Specialist Agent",
      metrics: {
        conversations: 1879,
        avgResponseTime: 14.2,
        satisfaction: 0.91,
        escalationRate: 0.08,
        topIssues: [
          { name: "Product Features", count: 542 },
          { name: "Compatibility", count: 389 },
          { name: "Technical Specs", count: 298 }
        ]
      }
    },
    { 
      id: "agent-cs-3", 
      name: "Returns Specialist Agent",
      metrics: {
        conversations: 1456,
        avgResponseTime: 11.5,
        satisfaction: 0.84,
        escalationRate: 0.19,
        topIssues: [
          { name: "Return Eligibility", count: 412 },
          { name: "Refund Status", count: 376 },
          { name: "Exchange Process", count: 289 }
        ]
      }
    }
  ]
};

// Export the data
module.exports = {
  conversations,
  agentConfigurations,
  knowledgeBases,
  performanceMetrics
};
