// backend-starter/data/conversations.js

const conversations = [
  {
    id: "conv001",
    customer: { id: "cust001", name: "John Doe" },
    agent: { id: "agentA1", name: "Agent A1" },
    startTime: new Date("2025-04-22T10:15:00Z"),
    messages: [
      {
        sender: "customer",
        text: "Hi, I received a damaged product. What should I do?",
        time: new Date("2025-04-22T10:15:05Z")
      },
      {
        sender: "agent",
        text: "I'm sorry to hear that! Can you please send a picture of the damage?",
        time: new Date("2025-04-22T10:15:30Z")
      },
      {
        sender: "customer",
        text: "Sure, here it is.",
        time: new Date("2025-04-22T10:16:00Z")
      },
      {
        sender: "agent",
        text: "Thanks! We’ll process a replacement immediately.",
        time: new Date("2025-04-22T10:16:20Z")
      }
    ],
    status: "resolved",
    alertLevel: "low",
    tags: ["damaged_item", "replacement"],
    metrics: {
      sentiment: 0.85,
      responseTime: 6,
      confidenceScore: 0.92
    }
  },
  {
    id: "conv002",
    customer: { id: "cust002", name: "Jane Smith" },
    agent: { id: "agentB2", name: "Agent B2" },
    startTime: new Date("2025-04-21T13:00:00Z"),
    messages: [
      {
        sender: "customer",
        text: "I want to return my order, it doesn't fit.",
        time: new Date("2025-04-21T13:00:10Z")
      },
      {
        sender: "agent",
        text: "Understood. I’ll guide you through the return process.",
        time: new Date("2025-04-21T13:00:45Z")
      }
    ],
    status: "in_progress",
    alertLevel: "medium",
    tags: ["return_request"],
    metrics: {
      sentiment: 0.7,
      responseTime: 8,
      confidenceScore: 0.88
    }
  }
];

module.exports = { conversations };
