// src/pages/Dashboard.js — Agent Monitoring Dashboard
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Flex, Grid, Heading, Text, Button, Badge, Icon,
  Table, Thead, Tbody, Tr, Th, Td, Progress, useToast, Switch,
  Menu, MenuButton, MenuList, MenuItem, Skeleton,
} from '@chakra-ui/react';
import { FiArrowUpRight, FiChevronDown } from 'react-icons/fi';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { useWebSocket } from '../context/WebSocketContext';
import { getAnalytics, interveneInConversation as apiIntervene } from '../api';

// Demo rows exactly matching the design mock. Merged under live DB rows.
const DEMO_QUEUE = [
  { id: 'conv-84291', customer: 'Elena Vasquez', caseNo: '#84291', queue: 'Refund', owner: 'CSR-Returns', risk: 96, wait: '12:42', action: 'Take over', alertLevel: 'high', demo: true },
  { id: 'conv-84275', customer: 'Marcus Lee', caseNo: '#84275', queue: 'Account', owner: 'CSR-Identity', risk: 84, wait: '09:18', action: 'Approve override', alertLevel: 'high', demo: true },
  { id: 'conv-84263', customer: 'Noah Williams', caseNo: '#84263', queue: 'Delivery', owner: 'CSR-Logistics', risk: 72, wait: '08:09', action: 'Review evidence', alertLevel: 'medium', demo: true },
  { id: 'conv-84241', customer: 'Ava Thompson', caseNo: '#84241', queue: 'Product', owner: 'CSR-Tech', risk: 58, wait: '06:34', action: 'Monitor', alertLevel: 'medium', demo: true },
  { id: 'conv-84230', customer: 'Oliver Chen', caseNo: '#84230', queue: 'Billing', owner: 'CSR-Finance', risk: 47, wait: '04:51', action: 'Send template', alertLevel: 'low', demo: true },
];

const BASE_FEED = [
  { id: 'f1', time: '11:42:18', title: 'Takeover approved', detail: 'Elena V. • by Neha P.', tone: 'red' },
  { id: 'f2', time: '11:41:53', title: 'Knowledge fallback', detail: 'CSR-Returns • policy gap', tone: 'red' },
  { id: 'f3', time: '11:40:26', title: 'SLA alert raised', detail: 'Returns • 9 conversations', tone: 'purple' },
  { id: 'f4', time: '11:39:11', title: 'Template inserted', detail: 'Refund delay v3 • Marcus L.', tone: 'purple' },
  { id: 'f5', time: '11:37:45', title: 'Agent version routed', detail: 'CSR-Tech v4.3 • 20% traffic', tone: 'purple' },
  { id: 'f6', time: '11:35:09', title: 'QA sample flagged', detail: 'Low empathy score • #84211', tone: 'purple' },
];

function riskFromConversation(c) {
  const base = c.alertLevel === 'high' ? 88 : c.alertLevel === 'medium' ? 64 : 45;
  const sent = c.metrics?.sentiment ?? 0.7;
  return Math.max(5, Math.min(99, Math.round(base + (0.7 - sent) * 30)));
}
function waitFromStart(startTime) {
  const ms = Date.now() - new Date(startTime).getTime();
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
function actionForRisk(risk) {
  if (risk >= 90) return 'Take over';
  if (risk >= 80) return 'Approve override';
  if (risk >= 65) return 'Review evidence';
  if (risk >= 50) return 'Monitor';
  return 'Send template';
}
function queueFromConversation(c) {
  const tag = (c.tags && c.tags[0]) || '';
  const t = tag.toLowerCase();
  if (t.includes('ship') || t.includes('deliver')) return 'Delivery';
  if (t.includes('return') || t.includes('refund')) return 'Refund';
  if (t.includes('product') || t.includes('information')) return 'Product';
  if (t.includes('billing') || t.includes('payment')) return 'Billing';
  return tag ? tag.charAt(0).toUpperCase() + tag.slice(1) : 'General';
}

const cardStyle = {
  bg: 'white', borderRadius: '16px', boxShadow: 'card', p: 5,
};

function MetricCard({ label, value, delta, deltaTone }) {
  const good = deltaTone !== 'red';
  return (
    <Box {...cardStyle} py={4}>
      <Flex justify="space-between" align="center" mb={1}>
        <Text fontSize="11px" fontWeight="700" color="ink.400" letterSpacing="0.06em">{label}</Text>
        <Badge
          fontSize="11px" px={2} py={0.5} borderRadius="full" textTransform="none"
          bg={good ? 'green.100' : 'red.100'}
          color={good ? 'green.700' : 'red.600'}
        >
          {delta}
        </Badge>
      </Flex>
      <Text fontSize={{ base: '24px', md: '30px' }} fontWeight="800" letterSpacing="tight">{value}</Text>
    </Box>
  );
}

const Dashboard = () => {
  const { conversations, searchTerm } = useAppData();
  const { isConnected, lastMessage } = useWebSocket();
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [sseLive, setSseLive] = useState(false);
  const [timeRange, setTimeRange] = useState('Last 30 min');
  const [queueFilter, setQueueFilter] = useState('All queues');
  const [sortMode, setSortMode] = useState('risk');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [liveEvents, setLiveEvents] = useState([]);
  const [takenOver, setTakenOver] = useState({});
  const toast = useToast();
  const navigate = useNavigate();

  // Metrics stream: SSE pushes a fresh payload every 2s; if the stream
  // drops, fall back to 2s polling so cards never go stale.
  useEffect(() => {
    let mounted = true;
    let es = null;
    let poll = null;
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

    const apply = (d) => {
      if (!mounted) return;
      setAnalytics(d);
      setLoadingAnalytics(false);
      setSseLive(true);
    };
    const startPolling = () => {
      if (poll) return;
      poll = setInterval(() => {
        getAnalytics().then(apply).catch(() => {});
      }, 2000);
    };

    // Instant first paint via REST, then live updates via SSE
    getAnalytics().then(apply).catch(() => { if (mounted) setLoadingAnalytics(false); });

    try {
      es = new EventSource(`${API_URL}/api/analytics/stream`);
      es.onmessage = (e) => {
        try {
          apply(JSON.parse(e.data));
        } catch { /* malformed tick — next one in 2s */ }
      };
      es.onerror = () => {
        setSseLive(false);
        if (es) es.close();
        es = null;
        if (mounted) startPolling();
      };
    } catch {
      startPolling();
    }

    return () => {
      mounted = false;
      if (es) es.close();
      if (poll) clearInterval(poll);
    };
  }, []);

  // Real-time: turn WebSocket pushes into supervisor-feed entries
  useEffect(() => {
    if (!autoRefresh || !lastMessage) return;
    const now = new Date().toLocaleTimeString('en-GB');
    if (lastMessage.type === 'new_conversation' && lastMessage.data) {
      const d = lastMessage.data;
      setLiveEvents((p) => [
        { id: `live-${Date.now()}`, time: now, title: 'New conversation', detail: `${d.customer?.name || 'Customer'} • ${d.agent?.name || 'AI agent'}`, tone: 'purple' },
        ...p,
      ].slice(0, 20));
    } else if (lastMessage.type === 'message_update') {
      setLiveEvents((p) => [
        { id: `live-${Date.now()}`, time: now, title: 'Message update', detail: `${lastMessage.conversationId} • ${lastMessage.message?.sender}`, tone: 'purple' },
        ...p,
      ].slice(0, 20));
    } else if (lastMessage.type === 'metrics_update') {
      const s = lastMessage.metrics?.sentiment;
      if (s !== undefined && s < 0.35) {
        setLiveEvents((p) => [
          { id: `live-${Date.now()}`, time: now, title: 'Sentiment alert', detail: `${lastMessage.conversationId} • score ${s.toFixed(2)}`, tone: 'red' },
          ...p,
        ].slice(0, 20));
      }
    }
  }, [lastMessage, autoRefresh]);

  const m = analytics?.metrics;
  const metrics = [
    { label: 'ACTIVE LOAD', value: m ? m.activeLoad.toLocaleString() : '1,284', delta: m?.activeLoadChange || '+8.2%', tone: 'green' },
    { label: 'SLA AT RISK', value: m ? String(m.slaAtRisk) : '47', delta: m?.slaAtRiskChange || '+12', tone: 'red' },
    { label: 'AI CONTAINMENT', value: m ? `${m.aiContainment}%` : '73.4%', delta: m?.aiContainmentChange || '+4.1%', tone: 'green' },
    { label: 'AVG. HANDLE TIME', value: m ? m.avgHandleTime : '06:18', delta: m?.avgHandleTimeChange || '-0:42', tone: 'green' },
    { label: 'CSAT', value: m ? String(m.csat) : '8.7', delta: m?.csatChange || '+0.6', tone: 'green' },
  ];

  // Priority queue: live DB rows first, then design-mock demo rows
  const liveRows = useMemo(() => conversations.map((c) => {
    const risk = riskFromConversation(c);
    return {
      id: c.id, customer: c.customer?.name || 'Unknown', caseNo: c.id,
      queue: queueFromConversation(c), owner: c.agent?.name?.replace(' Agent', '') || 'CSR-General',
      risk, wait: waitFromStart(c.startTime), action: actionForRisk(risk),
      alertLevel: c.alertLevel, startTime: c.startTime, demo: false,
    };
  }), [conversations]);

  const allRows = useMemo(() => {
    const liveIds = new Set(liveRows.map((r) => r.id));
    return [...liveRows, ...DEMO_QUEUE.filter((d) => !liveIds.has(d.id))];
  }, [liveRows]);

  const queueOptions = useMemo(() => {
    const set = new Set(allRows.map((r) => r.queue));
    return ['All queues', ...Array.from(set)];
  }, [allRows]);

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const now = Date.now();
    const rangeMs = timeRange === 'Last 30 min' ? 30 * 60000 : timeRange === 'Last hour' ? 3600000 : 24 * 3600000;
    let rows = allRows.filter((r) => {
      if (queueFilter !== 'All queues' && r.queue !== queueFilter) return false;
      if (r.startTime && now - new Date(r.startTime).getTime() > rangeMs && rangeMs < 24 * 3600000) return false;
      if (!q) return true;
      return `${r.customer} ${r.caseNo} ${r.queue} ${r.owner}`.toLowerCase().includes(q);
    });
    rows = [...rows].sort((a, b) => {
      if (sortMode === 'wait') return b.wait.localeCompare(a.wait);
      if (sortMode === 'name') return a.customer.localeCompare(b.customer);
      return b.risk - a.risk;
    });
    return rows;
  }, [allRows, searchTerm, queueFilter, sortMode, timeRange]);

  const highRiskCount = filteredRows.filter((r) => r.risk >= 80).length;
  const queues = analytics?.queues || [
    { name: 'Returns & refunds', pct: 92, status: 'breach' },
    { name: 'Order tracking', pct: 76, status: 'watch' },
    { name: 'Product support', pct: 61, status: 'watch' },
    { name: 'Account access', pct: 34, status: 'healthy' },
  ];
  const signals = analytics?.signals || [
    { type: 'breach', title: 'SLA breach cluster', detail: 'Returns queue • 9 conversations' },
    { type: 'sentiment', title: 'Sentiment anomaly', detail: 'North America • -18% in 10 min' },
    { type: 'degradation', title: 'Agent degradation', detail: 'CSR Agent v4.2 • Fallback rate 24%' },
  ];
  const volume = analytics?.volume?.map((p) => ({ name: p.label || '', live: p.live, sla: p.sla }))
    || [
      { name: '-50m', live: 42, sla: 28 }, { name: '-45m', live: 55, sla: 33 },
      { name: '-40m', live: 52, sla: 42 }, { name: '-35m', live: 78, sla: 35 },
      { name: '-30m', live: 70, sla: 52 }, { name: '-25m', live: 92, sla: 57 },
      { name: '-20m', live: 86, sla: 50 }, { name: '-15m', live: 112, sla: 64 },
      { name: '-10m', live: 104, sla: 61 }, { name: '-5m', live: 124, sla: 76 },
      { name: 'now', live: 118, sla: 69 },
    ];
  const feed = [...liveEvents, ...BASE_FEED];

  const handleTakeOver = async (row) => {
    try {
      await apiIntervene(row.id, 'supervisor-neha', `Takeover from dashboard (risk ${row.risk})`);
      setTakenOver((p) => ({ ...p, [row.id]: true }));
      setLiveEvents((p) => [
        { id: `live-${Date.now()}`, time: new Date().toLocaleTimeString('en-GB'), title: 'Takeover approved', detail: `${row.customer} • by Neha P.`, tone: 'red' },
        ...p,
      ]);
      toast({ title: 'Takeover approved', description: `${row.customer} ${row.caseNo}`, status: 'success', duration: 3000, isClosable: true });
      navigate(`/conversation/${row.id}`);
    } catch {
      setTakenOver((p) => ({ ...p, [row.id]: true }));
      toast({ title: 'Takeover recorded locally', description: 'Backend unreachable — will sync on retry.', status: 'warning', duration: 3000, isClosable: true });
    }
  };

  const handleExport = () => {
    const csv = ['Customer,Case,Queue,AI Owner,Risk,Wait,Action',
      ...filteredRows.map((r) => `${r.customer},${r.caseNo},${r.queue},${r.owner},${r.risk},${r.wait},${takenOver[r.id] ? 'Taken over' : r.action}`),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'supervisor-report.csv';
    a.click();
    toast({ title: 'Report exported', description: `${filteredRows.length} rows downloaded as CSV.`, status: 'success', duration: 3000, isClosable: true });
  };

  return (
    <Box>
      {/* Title + filters */}
      <Flex justify="space-between" align={{ base: 'flex-start', lg: 'center' }} direction={{ base: 'column', lg: 'row' }} gap={3} mb={4}>
        <Box>
          <Heading size="lg" letterSpacing="tight">Dashboard</Heading>
          <Text color="ink.500" fontSize="sm">Live supervision across 24 queues, 8 regions, and 42 AI agents</Text>
        </Box>
        <Flex gap={2} align="center" flexWrap="wrap">
          <Menu>
            <MenuButton as={Button} size="sm" bg="white" borderRadius="full" fontWeight="600" rightIcon={<FiChevronDown />}>{timeRange}</MenuButton>
            <MenuList>{['Last 30 min', 'Last hour', 'Today'].map((t) => (
              <MenuItem key={t} onClick={() => setTimeRange(t)}>{t}</MenuItem>
            ))}</MenuList>
          </Menu>
          <Button size="sm" bg="white" borderRadius="full" fontWeight="600">All regions</Button>
          <Button size="sm" bg="brand.700" color="white" borderRadius="10px" px={5} _hover={{ bg: 'brand.800' }} onClick={handleExport}>
            Export report
          </Button>
        </Flex>
      </Flex>

      {/* Metric cards */}
      <Grid templateColumns={{ base: '1fr 1fr', md: 'repeat(3, 1fr)', xl: 'repeat(5, 1fr)' }} gap={3} mb={4}>
        {loadingAnalytics && !analytics
          ? metrics.map((_, i) => <Skeleton key={i} height="86px" borderRadius="16px" />)
          : metrics.map((k) => <MetricCard key={k.label} {...k} />)}
      </Grid>

      {/* Middle row */}
      <Grid templateColumns={{ base: '1fr', xl: '1.9fr 1fr 1fr' }} gap={4} mb={4}>
        <Box {...cardStyle}>
          <Heading size="sm">Conversation volume & SLA exposure</Heading>
          <Text fontSize="xs" color="ink.400" mb={2}>Live vs forecast • 5-minute resolution {sseLive || isConnected ? '• Live' : '• Reconnecting…'}</Text>
          <Box height="220px">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volume} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                <CartesianGrid stroke="#eceaf3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8f8fa3' }} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={{ fontSize: 10, fill: '#8f8fa3' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="live" name="Live" stroke="#4a2e9e" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="sla" name="SLA exposure" stroke="#d9a321" strokeWidth={2.5} strokeDasharray="6 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
          <Flex gap={2} mt={2}>
            <Badge bg="brand.50" color="brand.700" borderRadius="full" px={3} py={1} textTransform="none">● Live</Badge>
            <Badge bg="#fdf3d7" color="#8a6d1b" borderRadius="full" px={3} py={1} textTransform="none">● SLA exposure</Badge>
          </Flex>
        </Box>

        <Box {...cardStyle}>
          <Heading size="sm">Queue health</Heading>
          <Text fontSize="xs" color="ink.400" mb={4}>Prioritized by breach probability</Text>
          {queues.map((q) => {
            const color = q.pct >= 85 ? '#d9534f' : q.pct >= 55 ? '#d9a321' : q.status === 'healthy' ? '#3aa56b' : '#5b8fd4';
            const tag = q.pct >= 85 ? '' : q.status === 'healthy' ? '(Healthy)' : '(Watch)';
            const tagColor = q.status === 'healthy' ? 'green.600' : 'blue.600';
            return (
              <Box key={q.name} mb={5}>
                <Flex justify="space-between" fontSize="sm" mb={1}>
                  <Text fontWeight="500">{q.name}</Text>
                  <Text><Text as="span" color={tagColor} fontWeight="600">{tag} </Text><Text as="span" fontWeight="700">{q.pct}%</Text></Text>
                </Flex>
                <Progress value={q.pct} size="sm" borderRadius="full" sx={{ '& > div': { background: color } }} bg="#eceaf3" />
              </Box>
            );
          })}
        </Box>

        <Box {...cardStyle}>
          <Heading size="sm">Critical signals</Heading>
          <Text fontSize="xs" color="ink.400" mb={3}>Needs supervisor action {highRiskCount > 0 && `• ${highRiskCount} high-risk`}</Text>
          {signals.map((s, i) => (
            <Flex key={i} gap={3} bg={i === 0 ? '#fdeeee' : '#f6f5fb'} borderRadius="12px" p={3} mb={2} align="flex-start">
              <Box w={2.5} h={2.5} borderRadius="full" bg={i === 0 ? '#d9534f' : '#d9a321'} mt={1.5} flexShrink={0} />
              <Box>
                <Text fontSize="sm" fontWeight="700">{s.title}</Text>
                <Text fontSize="xs" color="ink.500">{s.detail}</Text>
              </Box>
            </Flex>
          ))}
        </Box>
      </Grid>

      {/* Bottom row */}
      <Grid templateColumns={{ base: '1fr', xl: '1.9fr 1fr' }} gap={4}>
        <Box {...cardStyle}>
          <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={2} mb={1}>
            <Box>
              <Heading size="sm">Priority conversation queue</Heading>
              <Text fontSize="xs" color="ink.400">AI-ranked by urgency, value, and breach risk</Text>
            </Box>
            <Flex gap={2} align="center">
              <Menu>
                <MenuButton as={Button} size="xs" bg="brand.50" color="brand.800" borderRadius="full" rightIcon={<FiChevronDown />}>{queueFilter}</MenuButton>
                <MenuList>{queueOptions.map((q) => (
                  <MenuItem key={q} onClick={() => setQueueFilter(q)}>{q}</MenuItem>
                ))}</MenuList>
              </Menu>
              <Menu>
                <MenuButton as={Button} size="xs" bg="brand.50" color="brand.800" borderRadius="full" rightIcon={<FiChevronDown />}>Sort: {sortMode}</MenuButton>
                <MenuList>
                  <MenuItem onClick={() => setSortMode('risk')}>Sort: risk</MenuItem>
                  <MenuItem onClick={() => setSortMode('wait')}>Sort: wait</MenuItem>
                  <MenuItem onClick={() => setSortMode('name')}>Sort: name</MenuItem>
                </MenuList>
              </Menu>
              <Button size="xs" borderRadius="full" bg="brand.50"><Icon as={FiArrowUpRight} /></Button>
            </Flex>
          </Flex>
          <Box overflowX="auto" mx={{ base: -1, md: 0 }} px={{ base: 1, md: 0 }}>
            <Table size="sm" variant="simple" minW={{ base: '560px', md: '100%' }}>
              <Thead>
                <Tr>
                  <Th color="ink.400" fontSize="10px">CUSTOMER / CASE</Th>
                  <Th color="ink.400" fontSize="10px">QUEUE</Th>
                  <Th color="ink.400" fontSize="10px">AI OWNER</Th>
                  <Th color="ink.400" fontSize="10px">RISK</Th>
                  <Th color="ink.400" fontSize="10px">WAIT</Th>
                  <Th color="ink.400" fontSize="10px">RECOMMENDED ACTION</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredRows.map((r) => (
                  <Tr key={r.id} _hover={{ bg: 'brand.50' }} cursor="pointer"
                    onClick={() => navigate(`/conversation/${r.id}`)}>
                    <Td fontWeight="600" whiteSpace="nowrap">{r.customer} · {r.caseNo}</Td>
                    <Td color="ink.600">{r.queue}</Td>
                    <Td color="ink.600">{r.owner}</Td>
                    <Td>
                      <Badge borderRadius="full" px={3} bg={r.risk >= 80 ? '#fde2e2' : r.risk >= 60 ? '#fdf0c8' : '#e3ecf9'} color={r.risk >= 80 ? '#c03636' : r.risk >= 60 ? '#8a6d1b' : '#2f5b9e'}>
                        {r.risk}
                      </Badge>
                    </Td>
                    <Td color="ink.600">{r.wait}</Td>
                    <Td>
                      <Button variant="link" size="sm" color="brand.700" fontWeight="700"
                        onClick={(e) => { e.stopPropagation(); handleTakeOver(r); }}>
                        {takenOver[r.id] ? 'Taken over ✓' : r.action}
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            {filteredRows.length === 0 && (
              <Text textAlign="center" color="ink.400" py={6} fontSize="sm">
                No conversations match {searchTerm ? `"${searchTerm}"` : 'these filters'}.
              </Text>
            )}
          </Box>
        </Box>

        <Box {...cardStyle}>
          <Flex justify="space-between" align="center" mb={1}>
            <Box>
              <Heading size="sm">Live supervisor feed</Heading>
              <Text fontSize="xs" color="ink.400">Decisions, handoffs, and model events</Text>
            </Box>
            <Flex align="center" gap={2} bg="green.50" borderRadius="full" px={3} py={1}>
              <Box w={2} h={2} borderRadius="full" bg={autoRefresh && isConnected ? 'green.500' : 'gray.400'} />
              <Text fontSize="xs" fontWeight="700" color="green.700">Auto-refresh</Text>
              <Switch size="sm" colorScheme="green" isChecked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            </Flex>
          </Flex>
          <Box maxH="420px" overflowY="auto" pl={1}>
            {feed.map((f) => (
              <Flex key={f.id} gap={3} position="relative" pb={5}>
                <Flex direction="column" align="center">
                  <Box w={2.5} h={2.5} borderRadius="full" bg={f.tone === 'red' ? '#d9534f' : '#5b3fb5'} mt={1} />
                  <Box w="1px" flex="1" bg="#e4e2ee" minH="14px" />
                </Flex>
                <Text fontSize="xs" color="ink.400" w="52px" flexShrink={0} pt={0.5}>{f.time}</Text>
                <Box>
                  <Text fontSize="sm" fontWeight="700">{f.title}</Text>
                  <Text fontSize="xs" color="ink.500">{f.detail}</Text>
                </Box>
              </Flex>
            ))}
          </Box>
        </Box>
      </Grid>
    </Box>
  );
};

export default Dashboard;
