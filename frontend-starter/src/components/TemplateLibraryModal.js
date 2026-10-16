// src/components/TemplateLibraryModal.js — Response Templates picker (design mock)
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Flex, Text, Input, InputGroup, InputLeftElement, Icon, Button, Badge,
  Tabs, TabList, Tab, Menu, MenuButton, MenuList, MenuItem, useToast,
} from '@chakra-ui/react';
import { FiSearch, FiStar, FiChevronDown, FiCheckCircle } from 'react-icons/fi';
import { getTemplates, updateTemplate } from '../api';

const SAMPLE_VALUES = {
  visitor_name: 'Avery',
  workspace: 'Acme',
  customer_name: 'Elena',
  amount: '₹8,420',
  order_id: '#ORD-29384',
  status: 'approved',
  date: 'tomorrow',
};

function detectVars(content) {
  return [...new Set([...content.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]))];
}

function resolveContent(content, values = {}) {
  const clean = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== ''));
  const merged = { ...SAMPLE_VALUES, ...clean };
  const resolved = content.replace(/\{\{(\w+)\}\}/g, (_, v) => merged[v] || `[${v}]`);
  return { resolved, vars: detectVars(content) };
}

const FALLBACK = [
  { id: 'tmpl-welcome-visitor', name: 'Welcome new visitor', category: 'Onboarding', content: 'Welcome, {{visitor_name}}! Thanks for visiting {{workspace}}. I can help you get started or point you to the right product guide.', channel: 'Website', journey: 'Onboarding', team: 'All templates', uses: 128, starred: true },
  { id: 'tmpl-tour-invite', name: 'Product tour invite', category: 'Onboarding', content: 'Hi {{visitor_name}}, want a quick tour of {{workspace}}? It takes 2 minutes and covers the key features.', channel: 'Messenger', journey: 'Onboarding', team: 'All templates', uses: 84, starred: false },
  { id: 'tmpl-getting-started', name: 'Getting started checklist', category: 'Onboarding', content: 'Here is your first-session checklist for {{workspace}}: 1) Verify your email 2) Complete your profile 3) Invite a teammate.', channel: 'Email', journey: 'Onboarding', team: 'My team', uses: 61, starred: false },
  { id: 'tmpl-trial-followup', name: 'Trial follow-up', category: 'Onboarding', content: 'Hi {{visitor_name}}, your trial of {{workspace}} is active. Reply here if you hit any blockers and I will guide you.', channel: 'Mobile', journey: 'Onboarding', team: 'Recently used', uses: 61, starred: false },
];

const DESCRIPTIONS = {
  'Welcome new visitor': 'Friendly greeting with clear next steps.',
  'Product tour invite': 'Invite visitors to explore key features.',
  'Getting started checklist': 'Share a short first-session checklist.',
  'Trial follow-up': 'Guide visitors after trial activation.',
};

const JOURNEYS = ['Onboarding', 'Billing', 'Engagement', 'Transaction'];
const CHANNELS = [
  { name: 'Email', dot: '#e8a13c' },
  { name: 'Website', dot: '#6b7280' },
  { name: 'Mobile', dot: '#2f9fe0' },
  { name: 'Messenger', dot: '#7c4dff' },
];
const CHANNEL_TINT = { Website: '#eef4fb', Messenger: '#e9f7ef', Email: '#fdf3e3', Mobile: '#e8f4fd' };

const TemplateLibraryModal = ({ isOpen, onClose, onInsert, customerName, contextVars = {} }) => {
  const [templates, setTemplates] = useState(FALLBACK);
  const [search, setSearch] = useState('');
  const [catSearch, setCatSearch] = useState('');
  const [journey, setJourney] = useState('Onboarding');
  const [channel, setChannel] = useState('All channels');
  const [sort, setSort] = useState('Most used');
  const [tab, setTab] = useState('All templates');
  const [selectedId, setSelectedId] = useState('tmpl-welcome-visitor');
  const [previewAs, setPreviewAs] = useState('New visitor');
  // Supervisor-typed variable values, remembered per template
  const [typedValues, setTypedValues] = useState({});
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) return;
    getTemplates()
      .then((d) => { if (Array.isArray(d) && d.length > 0) setTemplates(d); })
      .catch(() => {});
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = templates.filter((t) => {
      if (tab === 'My team' && t.team !== 'My team' && t.team !== 'All templates') return false;
      if (tab === 'Recently used' && t.team !== 'Recently used' && (t.uses || 0) < 50) return false;
      if (journey !== 'All' && (t.journey || t.category) !== journey) return false;
      if (channel !== 'All channels' && t.channel !== channel) return false;
      if (!q) return true;
      return `${t.name} ${t.content} ${t.category} ${t.channel}`.toLowerCase().includes(q);
    });
    rows = [...rows].sort((a, b) => {
      if (sort === 'Name A-Z') return a.name.localeCompare(b.name);
      return (b.uses || 0) - (a.uses || 0);
    });
    return rows;
  }, [templates, search, journey, channel, sort, tab]);

  const selected = filtered.find((t) => t.id === selectedId) || filtered[0] || templates[0];
  const contextDefaults = useMemo(() => ({
    customer_name: customerName || contextVars.customer_name,
    ...contextVars,
  }), [customerName, contextVars]);
  const values = useMemo(() => ({
    ...contextDefaults,
    ...(selected ? typedValues[selected.id] || {} : {}),
  }), [contextDefaults, typedValues, selected]);
  const preview = selected ? resolveContent(selected.content, values) : { resolved: '', vars: [] };
  const filledCount = selected
    ? preview.vars.filter((v) => (values[v] || SAMPLE_VALUES[v] || '') !== '').length
    : 0;

  const setVarValue = (v, val) => {
    if (!selected) return;
    setTypedValues((p) => ({ ...p, [selected.id]: { ...(p[selected.id] || {}), [v]: val } }));
  };

  const toggleStar = async (t) => {
    setTemplates((p) => p.map((x) => (x.id === t.id ? { ...x, starred: !x.starred } : x)));
    try {
      await updateTemplate(t.id, { starred: !t.starred });
    } catch {
      toast({ title: 'Star saved locally', status: 'warning', duration: 1500 });
    }
  };

  const handleInsert = () => {
    if (!selected) return;
    onInsert(preview.resolved, selected);
    onClose();
  };

  if (!isOpen) return null;

  const journeyList = JOURNEYS.filter((j) => j.toLowerCase().includes(catSearch.toLowerCase()));
  const channelList = CHANNELS.filter((c) => c.name.toLowerCase().includes(catSearch.toLowerCase()));

  return (
    <Box position="fixed" inset={0} zIndex={50} bg="blackAlpha.500" display="flex" alignItems="center" justifyContent="center" p={4} onClick={onClose}>
      <Flex bg="white" borderRadius="20px" maxW="1120px" w="100%" maxH="90vh" overflow="hidden" onClick={(e) => e.stopPropagation()}>
        {/* Library sidebar */}
        <Box w="220px" minW="220px" borderRight="1px" borderColor="gray.100" p={4} overflowY="auto">
          <Text fontSize="11px" fontWeight="800" letterSpacing="0.06em" mb={2}>TEMPLATE LIBRARY</Text>
          <InputGroup size="sm" mb={3}>
            <InputLeftElement pointerEvents="none"><Icon as={FiSearch} color="gray.400" /></InputLeftElement>
            <Input placeholder="Search categories" borderRadius="full" value={catSearch} onChange={(e) => setCatSearch(e.target.value)} />
          </InputGroup>
          <Button w="100%" justifyContent="flex-start" size="sm" borderRadius="10px" bg="brand.50" color="brand.700" fontWeight="700" mb={1} onClick={() => { setJourney('All'); setTab('All templates'); }}>
            <Box w={2} h={2} borderRadius="full" bg="brand.500" mr={2} /> All templates
            <Badge ml="auto" bg="brand.100" color="brand.700" borderRadius="full">{templates.length}</Badge>
          </Button>
          <Button w="100%" justifyContent="flex-start" size="sm" variant="ghost" fontWeight="500" onClick={() => setSort('Most used')}>
            <Box w={2} h={2} borderRadius="full" bg="#e8a13c" mr={2} /> Popular
          </Button>
          <Button w="100%" justifyContent="flex-start" size="sm" variant="ghost" fontWeight="500" onClick={() => setSort('Most used')}>
            <Box w={2} h={2} borderRadius="full" bg="gray.400" mr={2} /> Low use
          </Button>
          <Text fontSize="10px" fontWeight="700" color="gray.400" mt={4} mb={1}>BY JOURNEY</Text>
          {journeyList.map((j) => (
            <Button key={j} w="100%" justifyContent="flex-start" size="sm" borderRadius="10px"
              bg={journey === j ? 'gray.100' : 'transparent'} fontWeight={journey === j ? '700' : '500'}
              onClick={() => setJourney(j)}>
              <Box w={2} h={2} borderRadius="full" bg={j === 'Onboarding' ? 'brand.500' : j === 'Billing' ? '#2f9fe0' : j === 'Engagement' ? '#3aa56b' : '#e05252'} mr={2} /> {j}
            </Button>
          ))}
          <Text fontSize="10px" fontWeight="700" color="gray.400" mt={4} mb={1}>BY CHANNEL</Text>
          {channelList.map((c) => (
            <Button key={c.name} w="100%" justifyContent="flex-start" size="sm" variant="ghost" fontWeight="500" onClick={() => { setChannel(c.name); setJourney('All'); }}>
              <Box w={2} h={2} borderRadius="full" bg={c.dot} mr={2} /> {c.name}
            </Button>
          ))}
        </Box>

        {/* Cards */}
        <Box flex="1" p={5} overflowY="auto" minW={0}>
          <Text fontSize="xl" fontWeight="800">Response Templates</Text>
          <Text fontSize="sm" color="gray.500" mb={3}>Choose a reply and customize it before inserting.</Text>
          <Flex gap={2} mb={3} flexWrap="wrap">
            <InputGroup maxW="280px" size="sm">
              <InputLeftElement pointerEvents="none"><Icon as={FiSearch} color="gray.400" /></InputLeftElement>
              <Input placeholder="Search title, message, or tag" borderRadius="full" value={search} onChange={(e) => setSearch(e.target.value)} />
            </InputGroup>
            <Menu>
              <MenuButton as={Button} size="sm" variant="outline" borderRadius="full" rightIcon={<FiChevronDown />}>{channel}</MenuButton>
              <MenuList>
                {['All channels', ...CHANNELS.map((c) => c.name)].map((c) => (
                  <MenuItem key={c} onClick={() => setChannel(c)}>{c}</MenuItem>
                ))}
              </MenuList>
            </Menu>
            <Menu>
              <MenuButton as={Button} size="sm" variant="outline" borderRadius="full" rightIcon={<FiChevronDown />}>{sort}</MenuButton>
              <MenuList>
                {['Most used', 'Name A-Z'].map((s) => (
                  <MenuItem key={s} onClick={() => setSort(s)}>{s}</MenuItem>
                ))}
              </MenuList>
            </Menu>
          </Flex>
          <Flex gap={2} mb={1} align="center">
            <Tabs size="sm" variant="soft-rounded" colorScheme="purple" index={['All templates', 'My team', 'Recently used'].indexOf(tab)} onChange={(i) => setTab(['All templates', 'My team', 'Recently used'][i])}>
              <TabList>
                <Tab>All templates</Tab>
                <Tab>My team</Tab>
                <Tab>Recently used</Tab>
              </TabList>
            </Tabs>
            <Text ml="auto" fontSize="xs" color="gray.400">{filtered.length} results</Text>
          </Flex>
          <Flex gap={3} mt={3} flexWrap="wrap">
            {filtered.map((t) => (
              <Box key={t.id} flex="1 1 44%" minW="220px" border="1px" borderColor={selected?.id === t.id ? 'brand.400' : 'gray.200'}
                borderRadius="14px" p={3} cursor="pointer" onClick={() => setSelectedId(t.id)}
                _hover={{ borderColor: 'brand.300' }}>
                <Flex bg={CHANNEL_TINT[t.channel] || '#f4f3f9'} borderRadius="10px" p={3} mb={2} align="flex-start" justify="space-between">
                  <Box flex="1">
                    <Box h={2} borderRadius="full" bg="gray.300" w="60%" mb={1.5} />
                    <Box h={2} borderRadius="full" bg="gray.200" w="85%" mb={1.5} />
                    <Box h={2} borderRadius="full" bg="white" w="70%" />
                  </Box>
                  <Icon as={FiStar} cursor="pointer" color={t.starred ? 'brand.500' : 'gray.400'}
                    fill={t.starred ? 'currentColor' : 'none'}
                    onClick={(e) => { e.stopPropagation(); toggleStar(t); }} />
                </Flex>
                <Text fontWeight="700" fontSize="sm">{t.name}</Text>
                <Text fontSize="xs" color="gray.500" mb={2}>{DESCRIPTIONS[t.name] || t.category}</Text>
                <Flex gap={1} align="center">
                  <Badge bg="brand.50" color="brand.700" borderRadius="full" textTransform="none" fontSize="10px">{t.journey || t.category}</Badge>
                  <Badge bg={CHANNEL_TINT[t.channel] || 'gray.100'} color="gray.600" borderRadius="full" textTransform="none" fontSize="10px">{t.channel}</Badge>
                  {t.isShared && <Badge bg="green.100" color="green.700" borderRadius="full" textTransform="none" fontSize="10px">Shared</Badge>}
                  <Text ml="auto" fontSize="10px" color="gray.400">{t.uses || 0} uses</Text>
                </Flex>
              </Box>
            ))}
          </Flex>
          {filtered.length === 0 && <Text textAlign="center" color="gray.400" py={8} fontSize="sm">No templates match these filters.</Text>}
        </Box>

        {/* Preview */}
        <Box w="300px" minW="300px" borderLeft="1px" borderColor="gray.100" p={5} overflowY="auto" bg="white">
          <Text fontSize="lg" fontWeight="800">Preview</Text>
          <Text fontSize="xs" color="gray.500" mb={3}>Review the selected reply before inserting.</Text>
          <Text fontSize="10px" fontWeight="800" letterSpacing="0.06em" mb={1}>PREVIEW AS</Text>
          <Menu>
            <MenuButton as={Button} w="100%" size="sm" variant="outline" borderRadius="10px" rightIcon={<FiChevronDown />} mb={3}>● {previewAs}</MenuButton>
            <MenuList>
              {['New visitor', 'Returning customer', 'VIP member'].map((p) => (
                <MenuItem key={p} onClick={() => setPreviewAs(p)}>{p}</MenuItem>
              ))}
            </MenuList>
          </Menu>
          <Box bg="#f6f5fb" borderRadius="14px" p={3} mb={3}>
            <Text fontSize="10px" color="gray.400" mb={2}>Live preview — completed message</Text>
            <Box bg="white" borderRadius="12px" p={3} boxShadow="sm">
              <Text fontWeight="800" fontSize="sm" mb={1}>{selected?.name === 'Welcome new visitor' ? 'Welcome, Avery 👋' : selected?.name || ''}</Text>
              <Text fontSize="xs" color="gray.600">{preview.resolved}</Text>
            </Box>
            <Button mt={3} w="100%" size="sm" bg="brand.800" color="white" borderRadius="10px">View getting started</Button>
          </Box>
          {preview.vars.length > 0 && (
            <Box mb={3}>
              <Text fontSize="10px" fontWeight="800" letterSpacing="0.06em" mb={1.5}>FILL VARIABLES</Text>
              {preview.vars.map((v) => (
                <Flex key={v} gap={2} align="center" mb={1.5}>
                  <Text fontSize="10px" fontWeight="700" bg="brand.50" color="brand.700" borderRadius="6px" px={2} py={1.5} whiteSpace="nowrap" minW="86px">
                    {v}
                  </Text>
                  <Input size="xs" borderRadius="8px" bg="white" placeholder={SAMPLE_VALUES[v] || `Enter ${v}…`}
                    value={values[v] || ''} onChange={(e) => setVarValue(v, e.target.value)} />
                </Flex>
              ))}
            </Box>
          )}
          <Flex gap={2} bg="green.50" borderRadius="10px" p={2.5} mb={3} align="center">
            <Icon as={FiCheckCircle} color={filledCount === preview.vars.length ? 'green.500' : 'orange.400'} />
            <Box>
              <Text fontSize="xs" fontWeight="800" color="green.700">{filledCount} of {preview.vars.length} variables filled</Text>
              <Text fontSize="10px" color="green.600">{preview.vars.join(', ') || 'No variables'}</Text>
            </Box>
          </Flex>
          <Text fontSize="10px" color="gray.400" mb={3}>You can edit the message after inserting.</Text>
          <Flex gap={2}>
            <Button flex="1" variant="outline" borderRadius="10px" onClick={onClose}>Cancel</Button>
            <Button flex="1" bg="brand.700" color="white" borderRadius="10px" _hover={{ bg: 'brand.800' }} onClick={handleInsert}>Insert</Button>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
};

export default TemplateLibraryModal;
