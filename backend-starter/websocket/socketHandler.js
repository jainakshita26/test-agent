// websocket/socketHandler.js
// WebSocket handler for real-time updates.
// IMPORTANT: only ever emits IDs that exist in MongoDB. Emitting fake IDs
// corrupts client state (list replacement / cards that 404 on click).
const Conversation = require('../models/conversation');

/**
 * Handles WebSocket connections
 * @param {WebSocket} ws - WebSocket connection
 * @param {http.IncomingMessage} req - HTTP request
 */
module.exports = (ws, req) => {
  console.log('WebSocket client connected');

  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to Agent Supervisor WebSocket server',
    timestamp: new Date(),
  }));

  const pingInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'ping', timestamp: new Date() }));
    }
  }, 30000);

  // Push the REAL conversation list once (never a dummy — the client
  // replaces its list with this payload, so fakes would wipe real data).
  Conversation.find({}).lean().then((convos) => {
    if (ws.readyState !== ws.OPEN) return;
    ws.send(JSON.stringify({
      type: 'conversations_update',
      data: convos.map((c) => ({
        id: c.id,
        customer: c.customer,
        agent: c.agent,
        status: c.status,
        alertLevel: c.alertLevel,
        startTime: c.startTime,
        metrics: c.metrics,
        messages: c.messages,
        tags: c.tags,
      })),
      timestamp: new Date(),
    }));
  }).catch((err) => console.error('WS initial sync failed:', err.message));

  startLiveSimulation(ws);

  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);

      switch (parsedMessage.type) {
        case 'subscribe':
          handleSubscription(ws, parsedMessage);
          break;
        case 'pong':
          break;
        default:
          console.log('Received message:', parsedMessage);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clearInterval(pingInterval);
  });
};

function handleSubscription(ws, message) {
  const { channel } = message;

  ws.send(JSON.stringify({
    type: 'subscription_confirmation',
    channel,
    message: `Subscribed to ${channel}`,
    timestamp: new Date(),
  }));
}

// Live simulation acts ONLY on conversations that exist in the DB,
// so every emitted ID is clickable and resolvable via the REST API.
async function getLiveConversationIds() {
  try {
    const convos = await Conversation.find({ status: { $in: ['active', 'escalated'] } })
      .select('id metrics')
      .lean();
    return convos;
  } catch {
    return [];
  }
}

function startLiveSimulation(ws) {
  // Message activity on a real conversation every 5s
  const msgTimer = setInterval(async () => {
    if (ws.readyState !== ws.OPEN) return;
    const convos = await getLiveConversationIds();
    if (convos.length === 0) return;

    const conversation = convos[Math.floor(Math.random() * convos.length)];

    ws.send(JSON.stringify({
      type: 'message_update',
      conversationId: conversation.id,
      message: {
        sender: Math.random() > 0.5 ? 'customer' : 'agent',
        text: getRandomMessage(),
        timestamp: new Date(),
      },
      timestamp: new Date(),
    }));

    if (Math.random() > 0.7 && conversation.metrics) {
      ws.send(JSON.stringify({
        type: 'metrics_update',
        conversationId: conversation.id,
        metrics: {
          sentiment: Math.max(0.1, Math.min(1.0, conversation.metrics.sentiment - 0.1 + Math.random() * 0.2)),
          responseTime: Math.max(1, conversation.metrics.responseTime - 1 + Math.random() * 2),
          confidenceScore: Math.max(0.2, Math.min(1.0, conversation.metrics.confidenceScore - 0.05 + Math.random() * 0.1)),
        },
        timestamp: new Date(),
      }));
    }
  }, 5000);

  ws.on('close', () => clearInterval(msgTimer));
}

function getRandomMessage() {
  const customerMessages = [
    'Can you tell me more about my order status?',
    "I'm still waiting for a response about my return.",
    'Thank you for your help!',
    "This isn't what I was expecting.",
    'How long will the shipping take?',
    'I need to change my delivery address.',
    'Is there a way to expedite this process?',
  ];

  const agentMessages = [
    "I'm checking your order status now.",
    'Let me look into that for you.',
    'Is there anything else I can help you with?',
    "I've updated your information in our system.",
    'Your order will arrive in 2-3 business days.',
    'I apologize for the inconvenience.',
    'Thank you for your patience.',
  ];

  return Math.random() > 0.5
    ? customerMessages[Math.floor(Math.random() * customerMessages.length)]
    : agentMessages[Math.floor(Math.random() * agentMessages.length)];
}
