// src/pages/ConversationView.js — Intervention Interface
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Flex, Grid, Heading, Text, Button, Badge, Input, InputGroup,
  Textarea, useToast, Skeleton, Progress, IconButton, Tooltip,
  Menu, MenuButton, MenuList, MenuItem,
} from '@chakra-ui/react';
import { FiMic, FiMicOff, FiChevronDown } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { useWebSocket } from '../context/WebSocketContext';
import TemplateLibraryModal from '../components/TemplateLibraryModal';
import {
  getConversation, addMessage, updateConversationStatus,
  interveneInConversation, releaseIntervention, saveConversationNotes,
} from '../api';

const AVATAR_BG = '#e3c39c';

function riskOf(c) {
  const base = c.alertLevel === 'high' ? 88 : c.alertLevel === 'medium' ? 64 : 45;
  const sent = c.metrics?.sentiment ?? 0.7;
  return Math.max(5, Math.min(99, Math.round(base + (0.7 - sent) * 30)));
}
function severityOf(risk) {
  if (risk >= 90) return { label: 'Critical', bg: '#fde2e2', color: '#c03636' };
  if (risk >= 70) return { label: 'High', bg: '#fdf0c8', color: '#8a6d1b' };
  return { label: 'Watch', bg: '#e3ecf9', color: '#2f5b9e' };
}
function waitOf(startTime) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
function issueOf(c) {
  const t = `${c.queue || ''} ${(c.tags || []).join(' ')}`.toLowerCase();
  if (/refund|return/.test(t)) return 'Refund blocked';
  if (/account|lock|identity/.test(t)) return 'Account locked';
  if (/deliver|ship|logistic/.test(t)) return 'Delivery exception';
  if (/bill|payment|invoice/.test(t)) return 'Billing issue';
  if (/product|defect/.test(t)) return 'Product defect';
  return (c.tags && c.tags[0]) || 'General inquiry';
}
function queueOf(c) {
  const t = `${(c.tags || []).join(' ')} ${c.agent?.name || ''}`.toLowerCase();
  if (/refund|return/.test(t)) return 'Returns';
  if (/account|identity/.test(t)) return 'Account';
  if (/deliver|logistic|ship/.test(t)) return 'Delivery';
  if (/bill|payment|finance/.test(t)) return 'Billing';
  if (/product|tech/.test(t)) return 'Product';
  return 'General';
}
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const card = { bg: 'white', borderRadius: '16px', boxShadow: 'card' };

const ConversationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { conversations } = useAppData();
  const { lastMessage } = useWebSocket();

  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listSearch, setListSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [feedback, setFeedback] = useState('');
  const [sending, setSending] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);
  const [tick, setTick] = useState(0);
  // Voice dictation (Web Speech API)
  const [listening, setListening] = useState(false);
  const [speechLang, setSpeechLang] = useState('en-US');
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const voiceBaseRef = useRef('');
  const msgEndRef = useRef(null);
  const draftRef = useRef(null);

  const load = async () => {
    try {
      const data = await getConversation(id);
      setConversation(data);
      setFeedback(data.supervisorNotes || '');
    } catch {
      setConversation(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ---- Voice dictation (Web Speech API) ----
  const SpeechRecognition =
    typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const speechSupported = !!SpeechRecognition;

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch { /* already stopped */ }
    recognitionRef.current = null;
    listeningRef.current = false;
    setListening(false);
    setDraft(voiceBaseRef.current);
  };

  const startListening = () => {
    if (!SpeechRecognition) {
      toast({
        title: 'Voice input not supported',
        description: 'Dictation needs Chrome or Edge. Typed replies still work.',
        status: 'warning', duration: 3500, isClosable: true,
      });
      return;
    }
    voiceBaseRef.current = draft;
    const rec = new SpeechRecognition();
    rec.lang = speechLang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let interim = '';
      let finals = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finals += t;
        else interim += t;
      }
      if (finals) voiceBaseRef.current = `${voiceBaseRef.current} ${finals}`.trim();
      setDraft(`${voiceBaseRef.current} ${interim}`.trim());
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        toast({
          title: 'Microphone blocked',
          description: 'Allow microphone access in the browser to dictate replies.',
          status: 'error', duration: 4000, isClosable: true,
        });
      }
    };
    rec.onend = () => {
      listeningRef.current = false;
      setListening(false);
      recognitionRef.current = null;
      setDraft(voiceBaseRef.current);
    };
    try {
      rec.start();
      recognitionRef.current = rec;
      listeningRef.current = true;
      setListening(true);
    } catch {
      toast({ title: 'Could not start dictation', status: 'error', duration: 2500, isClosable: true });
    }
  };

  const toggleListening = () => (listening ? stopListening() : startListening());

  // Stop dictation when leaving the conversation / unmounting
  useEffect(() => () => {
    try {
      recognitionRef.current?.stop();
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Live wait-time ticker
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Real-time incoming messages for the open conversation
  useEffect(() => {
    if (!lastMessage || lastMessage.type !== 'message_update') return;
    if (lastMessage.conversationId !== id) return;
    setConversation((prev) => {
      if (!prev) return prev;
      if (prev.messages?.some((m) => m.text === lastMessage.message?.text)) return prev;
      return { ...prev, messages: [...(prev.messages || []), { ...lastMessage.message, timestamp: new Date() }] };
    });
  }, [lastMessage, id]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages?.length]);

  const listRows = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    return conversations
      .map((c) => ({ c, risk: riskOf(c) }))
      .filter(({ c }) => !q || `${c.customer?.name} ${c.id}`.toLowerCase().includes(q))
      .sort((a, b) => b.risk - a.risk);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, listSearch, tick]);

  if (loading) {
    return (
      <Grid templateColumns="280px 1fr 300px" gap={4}>
        <Skeleton height="500px" borderRadius="16px" />
        <Skeleton height="500px" borderRadius="16px" />
        <Skeleton height="500px" borderRadius="16px" />
      </Grid>
    );
  }

  if (!conversation) {
    return (
      <Box {...card} p={8} textAlign="center">
        <Text fontWeight="700" mb={2}>Conversation not found</Text>
        <Text fontSize="sm" color="gray.500" mb={4}>It may have been deleted or the link is wrong.</Text>
        <Button bg="brand.700" color="white" onClick={() => navigate('/')}>Back to Dashboard</Button>
      </Box>
    );
  }

  const risk = riskOf(conversation);
  const sev = severityOf(risk);
  const queue = queueOf(conversation);
  const intervened = conversation.status === 'escalated' && conversation.humanIntervention?.occurred;
  const caseNo = `#${conversation.id.replace(/\D/g, '').slice(-5) || '00000'}`;
  const shortName = conversation.customer?.name?.split(' ')[0] || 'Customer';
  const tier = risk >= 80 ? 'VIP tier' : 'Standard';
  const sentiment = conversation.metrics?.sentiment ?? 0.5;
  const confidence = Math.round((conversation.metrics?.confidenceScore ?? 0.6) * 100);

  const doTakeOver = async () => {
    try {
      await interveneInConversation(id, 'supervisor-neha', `Takeover from intervention view (risk ${risk})`);
      await load();
      toast({ title: 'Takeover approved', description: `You now control ${conversation.customer?.name}'s conversation.`, status: 'success', duration: 3000, isClosable: true });
    } catch {
      toast({ title: 'Takeover failed', description: 'Backend unreachable.', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const doRelease = async () => {
    if (!releaseNotes.trim()) {
      toast({ title: 'Add handover notes', description: 'Notes help the agent continue smoothly.', status: 'warning', duration: 2500, isClosable: true });
      return;
    }
    try {
      await releaseIntervention(id, releaseNotes.trim());
      setReleaseNotes('');
      await load();
      toast({ title: 'Control returned to AI', description: 'Handover notes saved for the agent.', status: 'success', duration: 3000, isClosable: true });
    } catch (e) {
      toast({ title: 'Release failed', description: e.response?.data?.message || 'Backend unreachable.', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const doSend = async () => {
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      const msg = await addMessage(id, { sender: 'supervisor', text });
      setConversation((prev) => ({ ...prev, messages: [...(prev.messages || []), msg] }));
      setDraft('');
    } catch {
      toast({ title: 'Send failed', description: 'Message could not be delivered.', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setSending(false);
    }
  };

  const doResolve = async () => {
    try {
      await updateConversationStatus(id, 'resolved');
      await load();
      toast({ title: 'Marked as Resolved', description: 'Conversation closed.', status: 'success', duration: 3000, isClosable: true });
    } catch {
      toast({ title: 'Resolve failed', description: 'Backend unreachable.', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const doSaveFeedback = async () => {
    try {
      await saveConversationNotes(id, feedback);
      toast({ title: 'Feedback saved', description: 'Notes attached to this case.', status: 'success', duration: 2500, isClosable: true });
    } catch {
      toast({ title: 'Save failed', description: 'Backend unreachable.', status: 'error', duration: 2500, isClosable: true });
    }
  };

  const h = hashStr(conversation.id);
  const intel = {
    ltv: `₹${(1 + (h % 90) / 100).toFixed(2)}L`,
    orders: 20 + (h % 40),
    returnRate: `${(3 + (h % 50) / 10).toFixed(1)}%`,
    sentimentVal: `-${(0.4 + (h % 40) / 100).toFixed(2)}`,
  };

  const copilotText = /refund|return/i.test(`${queue} ${(conversation.tags || []).join(' ')}`)
    ? `Approve expedited refund of ₹8,420 and waive the standard review period.`
    : `Send a proactive status update with the next concrete step and a 24-hour follow-up.`;

  return (
    <Box>
      <Grid templateColumns={{ base: '1fr', lg: '270px 1fr', xl: '270px 1fr 300px' }} gap={4} align="start">
        {/* Left: conversation list */}
        <Box>
          <Heading size="sm" mb={3}>Customer Conversations</Heading>
          <InputGroup size="sm" mb={3}>
            <Input placeholder="Search customer or case..." bg="white" borderRadius="10px" border="none"
              value={listSearch} onChange={(e) => setListSearch(e.target.value)} />
          </InputGroup>
          <Box maxH="70vh" overflowY="auto" pr={1}>
            {listRows.map(({ c, risk: r }) => {
              const s = severityOf(r);
              const active = c.id === id;
              return (
                <Box key={c.id} {...card} p={3} mb={2} cursor="pointer"
                  border="1.5px" borderColor={active ? 'brand.400' : 'transparent'}
                  onClick={() => navigate(`/conversation/${c.id}`)}
                  _hover={{ borderColor: 'brand.200' }}>
                  <Flex gap={2} align="center" mb={2}>
                    <Box w={8} h={8} borderRadius="full" bg={AVATAR_BG} display="flex" alignItems="center" justifyContent="center" fontWeight="800" fontSize="sm">
                      {(c.customer?.name || '?')[0]}
                    </Box>
                    <Box minW={0}>
                      <Text fontWeight="700" fontSize="sm" noOfLines={1}>{c.customer?.name}</Text>
                      <Text fontSize="xs" color="gray.500" noOfLines={1}>{issueOf({ ...c, queue: queueOf(c) })}</Text>
                    </Box>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <Badge bg={s.bg} color={s.color} borderRadius="full" px={3} textTransform="none" fontSize="11px">{s.label}</Badge>
                    <Text fontSize="xs" color="gray.500">{waitOf(c.startTime)}</Text>
                  </Flex>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Center: thread */}
        <Box {...card} p={4}>
          <Flex bg="#f6f5fb" borderRadius="12px" p={3} mb={3} align="center" gap={3} flexWrap="wrap">
            <Box w={9} h={9} borderRadius="full" bg={AVATAR_BG} display="flex" alignItems="center" justifyContent="center" fontWeight="800">
              {(conversation.customer?.name || '?')[0]}
            </Box>
            <Box flex="1" minW="180px">
              <Text fontWeight="800" fontSize="md">{conversation.customer?.name} · Case {caseNo}</Text>
              <Text fontSize="xs" color="gray.500">{queue}s • Web chat • EN-US • {tier}</Text>
            </Box>
            <Badge bg={sev.bg} color={sev.color} borderRadius="full" px={3} py={1} textTransform="none">● {sev.label}</Badge>
            {intervened ? (
              <Badge bg="green.100" color="green.700" borderRadius="full" px={3} py={1} textTransform="none">● Supervisor in control</Badge>
            ) : (
              <Button size="sm" bg="brand.700" color="white" borderRadius="10px" _hover={{ bg: 'brand.800' }} onClick={doTakeOver}>
                Take over
              </Button>
            )}
          </Flex>

          {risk >= 70 && (
            <Flex bg="#fdf3d7" borderRadius="12px" p={3} mb={4} gap={2} align="flex-start">
              <Box w={2.5} h={2.5} borderRadius="full" bg="#d9a321" mt={1.5} flexShrink={0} />
              <Box>
                <Text fontSize="sm" fontWeight="800">SLA breach likely in 03:18</Text>
                <Text fontSize="xs" color="gray.600">AI confidence fell after policy exception request</Text>
              </Box>
            </Flex>
          )}

          <Box data-testid="message-list" className="message-list conversation-messages" maxH="46vh" overflowY="auto" mb={3} px={1}>
            {(conversation.messages || []).map((m, i) => {
              const mine = m.sender !== 'customer';
              return (
                <Box key={i} display="flex" justifyContent={mine ? 'flex-end' : 'flex-start'} mb={2}>
                  <Box maxW="80%" bg={m.sender === 'customer' ? '#f1f0f5' : m.sender === 'supervisor' ? 'brand.700' : '#e9e4f7'}
                    color={m.sender === 'supervisor' ? 'white' : 'inherit'}
                    borderRadius="14px" px={3.5} py={2.5}>
                    <Text fontSize="10px" fontWeight="700" color={m.sender === 'supervisor' ? 'whiteAlpha.800' : 'gray.400'} mb={1}>
                      {m.sender === 'customer' ? `CUSTOMER • ${fmtTime(m.timestamp)}` : m.sender === 'supervisor' ? `SUPERVISOR • ${fmtTime(m.timestamp)}` : `AI AGENT • ${fmtTime(m.timestamp)}`}
                    </Text>
                    <Text fontSize="sm">{m.text}</Text>
                  </Box>
                </Box>
              );
            })}
            <Box ref={msgEndRef} />
          </Box>

          <Box bg="#f6f5fb" borderRadius="14px" p={4} mb={3}>
            <Text fontWeight="800">Co-pilot recommendation</Text>
            <Text fontSize="xs" color="gray.500" mb={2}>Generated from policy, customer tier, and conversation sentiment</Text>
            <Flex justify="space-between" gap={3} flexWrap="wrap" mb={1}>
              <Text fontSize="sm" flex="1" minW="200px">{copilotText}</Text>
              <Badge bg="green.100" color="green.700" borderRadius="full" px={3} py={1} textTransform="none" h="fit-content">● Confidence {confidence}%</Badge>
            </Flex>
            <Text fontSize="xs" color="gray.500" mb={3}>Evidence: return scan received • item category eligible • customer lifetime value: high</Text>
            <Flex gap={2} flexWrap="wrap">
              <Button size="sm" bg="brand.700" color="white" borderRadius="10px" onClick={() => { setDraft(`Hi ${shortName} — I've reviewed the evidence and approved ${copilotText.charAt(0).toLowerCase() + copilotText.slice(1)}`); draftRef.current?.focus(); }}>
                Approve action
              </Button>
              <Button size="sm" variant="outline" borderRadius="10px" onClick={() => draftRef.current?.focus()}>Edit response</Button>
              <Button size="sm" variant="outline" borderRadius="10px" onClick={() => toast({ title: 'Escalated to policy team', status: 'info', duration: 2500, isClosable: true })}>Escalate policy</Button>
            </Flex>
          </Box>

          {intervened && (
            <Box bg="green.50" borderRadius="14px" p={4} mb={3}>
              <Text fontWeight="800" fontSize="sm" mb={1}>Return control to AI</Text>
              <Text fontSize="xs" color="gray.600" mb={2}>Handover notes guide the agent when it resumes.</Text>
              <Flex gap={2}>
                <Input bg="white" borderRadius="10px" placeholder="Handover notes for the agent..." value={releaseNotes} onChange={(e) => setReleaseNotes(e.target.value)} />
                <Button bg="brand.700" color="white" borderRadius="10px" onClick={doRelease} whiteSpace="nowrap">Return to AI</Button>
              </Flex>
            </Box>
          )}

          <Box border="1px" borderColor="gray.200" borderRadius="14px" p={3}>
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontSize="sm" fontWeight="700" color="gray.600">Supervisor response</Text>
              <Button size="xs" variant="outline" borderRadius="full" onClick={() => setTplOpen(true)}>▦ Template ▾</Button>
            </Flex>
            <Flex gap={2} align="flex-end">
              <Textarea ref={draftRef} bg="#f6f5fb" border="none" borderRadius="10px" rows={2} resize="none"
                placeholder={listening ? 'Listening… speak now' : `Hi ${shortName} — I've reviewed the return evidence and approved an expedited refund...`}
                value={draft} onChange={(e) => {
                  setDraft(e.target.value);
                  if (listeningRef.current) voiceBaseRef.current = e.target.value;
                }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (listening) stopListening(); doSend(); } }} />
              <Tooltip label={speechSupported ? (listening ? 'Stop dictation' : 'Dictate reply by voice') : 'Voice input needs Chrome or Edge'}>
                <IconButton aria-label="Dictate reply by voice" icon={listening ? <FiMicOff /> : <FiMic />}
                  borderRadius="12px" colorScheme={listening ? 'red' : 'gray'}
                  variant={listening ? 'solid' : 'outline'}
                  onClick={toggleListening} isDisabled={!speechSupported && !listening} />
              </Tooltip>
              <Menu>
                <Tooltip label="Dictation language">
                  <MenuButton as={Button} size="sm" variant="ghost" borderRadius="10px" px={1} rightIcon={<FiChevronDown />}>
                    {speechLang.split('-')[0].toUpperCase()}
                  </MenuButton>
                </Tooltip>
                <MenuList minW="140px">
                  {['en-US', 'en-IN', 'hi-IN'].map((l) => (
                    <MenuItem key={l} onClick={() => setSpeechLang(l)}>{l}</MenuItem>
                  ))}
                </MenuList>
              </Menu>
              <Button bg="brand.700" color="white" borderRadius="12px" px={6} isLoading={sending} onClick={() => { if (listening) stopListening(); doSend(); }}>Send reply</Button>
            </Flex>
            {listening && (
              <Text fontSize="xs" color="red.500" fontWeight="600" mt={2}>● Listening… tap the mic to stop, then Send reply</Text>
            )}
          </Box>
        </Box>

        {/* Right: intelligence */}
        <Box {...card} p={4} display={{ base: 'none', xl: 'block' }}>
          <Heading size="sm" mb={3}>Customer intelligence</Heading>
          <Flex gap={2} align="center" mb={1}>
            <Box w={8} h={8} borderRadius="full" bg={AVATAR_BG} display="flex" alignItems="center" justifyContent="center" fontWeight="800" fontSize="sm">
              {(conversation.customer?.name || '?')[0]}
            </Box>
            <Box>
              <Text fontWeight="800" fontSize="sm">{conversation.customer?.name} · Case {caseNo}</Text>
              <Text fontSize="xs" color="gray.500">{risk >= 80 ? 'VIP' : 'Standard'} • 3.8 years • Madrid</Text>
            </Box>
          </Flex>
          <Grid templateColumns="1fr 1fr" gap={3} my={4}>
            <Box><Text fontSize="10px" color="gray.400" fontWeight="700">LIFETIME VALUE</Text><Text fontWeight="800" fontSize="lg">{intel.ltv}</Text></Box>
            <Box><Text fontSize="10px" color="gray.400" fontWeight="700">ORDERS</Text><Text fontWeight="800" fontSize="lg">{intel.orders}</Text></Box>
            <Box><Text fontSize="10px" color="gray.400" fontWeight="700">RETURN RATE</Text><Text fontWeight="800" fontSize="lg">{intel.returnRate}</Text></Box>
            <Box><Text fontSize="10px" color="gray.400" fontWeight="700">SENTIMENT</Text><Text fontWeight="800" fontSize="lg" color="red.500">{intel.sentimentVal}</Text></Box>
          </Grid>
          <Heading size="sm">Case diagnostics</Heading>
          <Text fontSize="xs" color="gray.400" mb={2}>Signals contributing to risk</Text>
          {[
            { label: 'Repeat contact', pct: 92, color: '#d9534f' },
            { label: 'Negative sentiment', pct: Math.round((1 - sentiment) * 100), color: '#d9a321' },
            { label: 'Policy exception', pct: 66, color: '#5b8fd4' },
            { label: 'Churn propensity', pct: 58, color: '#6a5acd' },
          ].map((d) => (
            <Box key={d.label} mb={3}>
              <Flex justify="space-between" fontSize="xs" mb={1}>
                <Text color="gray.600">{d.label}</Text>
                <Text fontWeight="700">{d.pct}%</Text>
              </Flex>
              <Progress value={d.pct} size="sm" borderRadius="full" bg="#eceaf3" sx={{ '& > div': { background: d.color } }} />
            </Box>
          ))}
          <Text fontSize="xs" color="gray.400" mt={4} mb={1}>Feedback Notes</Text>
          <Textarea bg="#fdf0b8" border="none" borderRadius="14px" rows={6} placeholder="Write here..."
            value={feedback} onChange={(e) => setFeedback(e.target.value)} mb={2} />
          <Flex gap={2} mb={2}>
            <Button size="sm" variant="outline" borderRadius="10px" onClick={doSaveFeedback}>Save notes</Button>
          </Flex>
          <Button w="100%" bg="brand.800" color="white" borderRadius="12px" py={6} _hover={{ bg: 'brand.900' }} onClick={doResolve}>
            Mark as Resolved
          </Button>
        </Box>
      </Grid>

      <TemplateLibraryModal
        isOpen={tplOpen}
        onClose={() => setTplOpen(false)}
        customerName={conversation.customer?.name || shortName}
        contextVars={{
          customer_name: conversation.customer?.name || '',
          visitor_name: shortName,
          order_id: caseNo,
          case_id: caseNo,
        }}
        onInsert={(text) => { setDraft(text); draftRef.current?.focus(); }}
      />
    </Box>
  );
};

export default ConversationView;
