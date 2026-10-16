// One-off seed: demo intervention conversations + response templates (upsert, no wipe)
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zangoh';

const Conversation = require('../models/conversation');
const ResponseTemplate = require('../models/responseTemplate');

const now = Date.now();
const min = 60000;

const demoConversations = [
  {
    id: 'conv-84291',
    customer: { id: 'cust-84291', name: 'Elena Vasquez' },
    agent: { id: 'agent-cs-3', name: 'CSR-Returns' },
    status: 'active',
    alertLevel: 'high',
    startTime: new Date(now - 12.7 * min),
    metrics: { sentiment: 0.22, responseTime: 18.4, confidenceScore: 0.41 },
    messages: [
      { sender: 'customer', text: 'I returned the item last week, but the refund is still blocked.', timestamp: new Date(now - 11 * min) },
      { sender: 'agent', text: "I found the return receipt and carrier confirmation. I'm checking the refund policy now.", timestamp: new Date(now - 10 * min) },
      { sender: 'customer', text: "I need the refund today. This is the second time I'm contacting support.", timestamp: new Date(now - 8 * min) },
      { sender: 'agent', text: "The amount exceeds my approval limit. I've prepared the evidence for supervisor review.", timestamp: new Date(now - 7 * min) },
    ],
    tags: ['refund', 'vip', 'sla-risk'],
    humanIntervention: { occurred: false },
  },
  {
    id: 'conv-84275',
    customer: { id: 'cust-84275', name: 'Marcus Lee' },
    agent: { id: 'agent-cs-1', name: 'CSR-Identity' },
    status: 'active',
    alertLevel: 'high',
    startTime: new Date(now - 9.3 * min),
    metrics: { sentiment: 0.35, responseTime: 14.1, confidenceScore: 0.58 },
    messages: [
      { sender: 'customer', text: 'I am locked out of my account and the reset link never arrives.', timestamp: new Date(now - 9 * min) },
      { sender: 'agent', text: 'I can see the lock was triggered after multiple sign-in attempts. Let me verify your identity.', timestamp: new Date(now - 8 * min) },
      { sender: 'customer', text: 'This is urgent, I have a payment due in an hour.', timestamp: new Date(now - 6 * min) },
    ],
    tags: ['account', 'locked', 'urgent'],
    humanIntervention: { occurred: false },
  },
  {
    id: 'conv-84263',
    customer: { id: 'cust-84263', name: 'Noah Williams' },
    agent: { id: 'agent-cs-1', name: 'CSR-Logistics' },
    status: 'active',
    alertLevel: 'medium',
    startTime: new Date(now - 8.2 * min),
    metrics: { sentiment: 0.45, responseTime: 11.8, confidenceScore: 0.66 },
    messages: [
      { sender: 'customer', text: 'My delivery shows an exception and no new delivery date.', timestamp: new Date(now - 8 * min) },
      { sender: 'agent', text: 'The carrier flagged an address issue. I can rebook the delivery once you confirm the address.', timestamp: new Date(now - 7 * min) },
      { sender: 'customer', text: 'The address on file is correct. Please check again.', timestamp: new Date(now - 5 * min) },
    ],
    tags: ['delivery', 'exception'],
    humanIntervention: { occurred: false },
  },
  {
    id: 'conv-84241',
    customer: { id: 'cust-84241', name: 'Ava Thompson' },
    agent: { id: 'agent-cs-2', name: 'CSR-Tech' },
    status: 'active',
    alertLevel: 'low',
    startTime: new Date(now - 6.6 * min),
    metrics: { sentiment: 0.62, responseTime: 9.4, confidenceScore: 0.81 },
    messages: [
      { sender: 'customer', text: 'The blender I bought makes a strange noise on the lowest setting.', timestamp: new Date(now - 6 * min) },
      { sender: 'agent', text: 'That can happen during the first few uses. Run it with water for 30 seconds and let me know if it persists.', timestamp: new Date(now - 5 * min) },
    ],
    tags: ['product', 'defect-watch'],
    humanIntervention: { occurred: false },
  },
];

const demoTemplates = [
  {
    id: 'tmpl-welcome-visitor',
    name: 'Welcome new visitor',
    category: 'Onboarding',
    content: 'Welcome, {{visitor_name}}! Thanks for visiting {{workspace}}. I can help you get started or point you to the right product guide.',
    variables: [{ name: 'visitor_name', description: 'Visitor first name' }, { name: 'workspace', description: 'Workspace name' }],
    createdBy: 'team', isShared: true, channel: 'Website', journey: 'Onboarding', team: 'All templates', uses: 128, starred: true,
  },
  {
    id: 'tmpl-tour-invite',
    name: 'Product tour invite',
    category: 'Onboarding',
    content: 'Hi {{visitor_name}}, want a quick tour of {{workspace}}? It takes 2 minutes and covers the key features.',
    variables: [{ name: 'visitor_name', description: 'Visitor first name' }, { name: 'workspace', description: 'Workspace name' }],
    createdBy: 'team', isShared: true, channel: 'Messenger', journey: 'Onboarding', team: 'All templates', uses: 84, starred: false,
  },
  {
    id: 'tmpl-getting-started',
    name: 'Getting started checklist',
    category: 'Onboarding',
    content: 'Here is your first-session checklist for {{workspace}}: 1) Verify your email 2) Complete your profile 3) Invite a teammate.',
    variables: [{ name: 'workspace', description: 'Workspace name' }],
    createdBy: 'team', isShared: true, channel: 'Email', journey: 'Onboarding', team: 'My team', uses: 61, starred: false,
  },
  {
    id: 'tmpl-trial-followup',
    name: 'Trial follow-up',
    category: 'Onboarding',
    content: 'Hi {{visitor_name}}, your trial of {{workspace}} is active. Reply here if you hit any blockers and I will guide you.',
    variables: [{ name: 'visitor_name', description: 'Visitor first name' }, { name: 'workspace', description: 'Workspace name' }],
    createdBy: 'team', isShared: true, channel: 'Mobile', journey: 'Onboarding', team: 'Recently used', uses: 61, starred: false,
  },
  {
    id: 'tmpl-expedited-refund',
    name: 'Expedited refund approval',
    category: 'Transaction',
    content: "Hi {{customer_name}} — I've reviewed the return evidence and approved an expedited refund of {{amount}}. It should reflect within 24 hours.",
    variables: [{ name: 'customer_name', description: 'Customer name' }, { name: 'amount', description: 'Refund amount' }],
    createdBy: 'supervisor-neha', isShared: true, channel: 'Website', journey: 'Transaction', team: 'My team', uses: 96, starred: true,
  },
  {
    id: 'tmpl-refund-status',
    name: 'Refund status update',
    category: 'Transaction',
    content: 'Hi {{customer_name}}, your refund for order {{order_id}} is now {{status}}. Expected timeline: 3-5 business days.',
    variables: [{ name: 'customer_name', description: 'Customer name' }, { name: 'order_id', description: 'Order ID' }, { name: 'status', description: 'Refund status' }],
    createdBy: 'team', isShared: true, channel: 'Email', journey: 'Transaction', team: 'All templates', uses: 74, starred: false,
  },
  {
    id: 'tmpl-account-unlock',
    name: 'Account unlock help',
    category: 'Engagement',
    content: 'Hi {{customer_name}}, I have unlocked your account. Please reset your password using the fresh link valid for 30 minutes.',
    variables: [{ name: 'customer_name', description: 'Customer name' }],
    createdBy: 'team', isShared: true, channel: 'Mobile', journey: 'Engagement', team: 'All templates', uses: 52, starred: false,
  },
  {
    id: 'tmpl-delivery-apology',
    name: 'Delivery delay apology',
    category: 'Engagement',
    content: 'Hi {{customer_name}}, sorry about the delay on order {{order_id}}. A new delivery is booked for {{date}} with priority handling.',
    variables: [{ name: 'customer_name', description: 'Customer name' }, { name: 'order_id', description: 'Order ID' }, { name: 'date', description: 'New delivery date' }],
    createdBy: 'team', isShared: false, channel: 'Email', journey: 'Engagement', team: 'Recently used', uses: 18, starred: false,
  },
];

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  for (const c of demoConversations) {
    await Conversation.updateOne({ id: c.id }, { $set: c }, { upsert: true });
  }
  console.log(`Upserted ${demoConversations.length} demo conversations`);

  for (const t of demoTemplates) {
    await ResponseTemplate.updateOne({ id: t.id }, { $set: t }, { upsert: true });
  }
  console.log(`Upserted ${demoTemplates.length} templates`);

  await mongoose.connection.close();
  console.log('Done');
}

run().catch((e) => { console.error(e); process.exit(1); });
