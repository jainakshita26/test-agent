const express = require('express');
const router = express.Router();
const Conversation = require('../models/conversation');
const Agent = require('../models/agent');

// Baseline demo numbers so the dashboard matches the design mock
// (fleet-wide totals). Live DB counts are added on top.
const BASE = {
  activeLoad: 1281,
  slaAtRisk: 46,
  containment: 73.4,
  handleTimeSec: 378, // 06:18
  csat: 8.7,
};

function fmtHandleTime(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = Math.round(totalSec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Demo volume curve matching the design (live vs SLA exposure)
const VOLUME_SHAPE = [
  { live: 42, sla: 28 },
  { live: 55, sla: 33 },
  { live: 52, sla: 42 },
  { live: 78, sla: 35 },
  { live: 70, sla: 52 },
  { live: 92, sla: 57 },
  { live: 86, sla: 50 },
  { live: 112, sla: 64 },
  { live: 104, sla: 61 },
  { live: 124, sla: 76 },
  { live: 118, sla: 69 },
];

async function buildPayload(tick = false) {
  const [conversations, agents] = await Promise.all([
    Conversation.find({}).lean(),
    Agent.find({}).lean(),
  ]);

  const active = conversations.filter((c) => c.status === 'active');
  const resolved = conversations.filter((c) => c.status === 'resolved');
  const escalated = conversations.filter((c) => c.status === 'escalated');
  const highAlert = conversations.filter((c) => c.alertLevel === 'high');

  const total = conversations.length || 1;
  const resolutionRate = resolved.length / total;
  const avgResponseTime =
    conversations.reduce((s, c) => s + (c.metrics?.responseTime || 0), 0) / total;
  const avgSentiment =
    conversations.reduce((s, c) => s + (c.metrics?.sentiment || 0), 0) / total;
  const satisfaction = avgSentiment * 10; // 0-10 scale like the mock (8.7)

  // Fleet-level metrics: baseline + live DB contribution
  const metrics = {
    activeLoad: BASE.activeLoad + active.length,
    activeLoadChange: '+8.2%',
    slaAtRisk: BASE.slaAtRisk + highAlert.length,
    slaAtRiskChange: `+${12 + highAlert.length}`,
    aiContainment: BASE.containment,
    aiContainmentChange: '+4.1%',
    containmentRate: 1 - escalated.length / total,
    avgHandleTime: fmtHandleTime(BASE.handleTimeSec),
    avgHandleTimeChange: '-0:42',
    avgResponseTime: Math.round(avgResponseTime * 10) / 10,
    csat: Math.round((BASE.csat + (avgSentiment - 0.5) * 0.4) * 10) / 10,
    csatChange: '+0.6',
    resolutionRate: Math.round(resolutionRate * 1000) / 10,
    satisfaction: Math.round(avgSentiment * 1000) / 10,
    totalConversations: 1284 + total,
    activeConversations: active.length,
    escalatedConversations: escalated.length,
    highAlertConversations: highAlert.length,
  };

  const now = Date.now();
  // On stream ticks the newest point breathes gently (±2) so the 2s
  // refresh is visible; historical points stay stable.
  const volume = VOLUME_SHAPE.map((p, i) => ({
    t: new Date(now - (VOLUME_SHAPE.length - 1 - i) * 5 * 60000).toISOString(),
    label: `-${(VOLUME_SHAPE.length - 1 - i) * 5}m`,
    live: p.live + active.length + (tick && i === VOLUME_SHAPE.length - 1 ? Math.round(2 * Math.sin(now / 8000)) : 0),
    sla: p.sla + highAlert.length,
  }));

  // Queue health derived from tags / alert levels, topped up to mock values
  const queueCounts = {};
  conversations.forEach((c) => {
    const q = (c.tags && c.tags[0]) || 'general';
    queueCounts[q] = (queueCounts[q] || 0) + 1;
  });
  const queues = [
    { name: 'Returns & refunds', pct: Math.min(99, 89 + (queueCounts.returns || 0) + highAlert.length), status: 'breach' },
    { name: 'Order tracking', pct: 76, status: 'watch' },
    { name: 'Product support', pct: 61, status: 'watch' },
    { name: 'Account access', pct: 34, status: 'healthy' },
  ];

  const signals = [
    {
      type: 'breach',
      title: 'SLA breach cluster',
      detail: `Returns queue • ${9 + highAlert.length} conversations`,
    },
    {
      type: 'sentiment',
      title: 'Sentiment anomaly',
      detail: 'North America • -18% in 10 min',
    },
    {
      type: 'degradation',
      title: 'Agent degradation',
      detail: 'CSR Agent v4.2 • Fallback rate 24%',
    },
  ];

  const agentsSummary = agents.map((a) => ({
    id: a.id,
    name: a.name,
    model: a.model,
    status: a.status,
    metrics: a.metrics,
  }));

  return { metrics, volume, queues, signals, agents: agentsSummary, daily: volume, serverTime: new Date(now).toISOString() };
}

router.get('/', async (req, res, next) => {
  try {
    res.json(await buildPayload(false));
  } catch (error) {
    next(error);
  }
});

// Server-Sent Events: fresh metrics payload every 2 seconds.
// Client: new EventSource('/api/analytics/stream') + onmessage.
router.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': connected\n\n');

  let closed = false;
  const push = async () => {
    if (closed) return;
    try {
      res.write(`data: ${JSON.stringify(await buildPayload(true))}\n\n`);
    } catch {
      // transient DB hiccup — skip this tick, retry on the next one
    }
  };

  push();
  const timer = setInterval(push, 2000);
  req.on('close', () => {
    closed = true;
    clearInterval(timer);
  });
});

module.exports = router;
