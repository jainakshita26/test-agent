// src/pages/Analysis.js — Template Governance Workspace (design mock)
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Flex, Grid, Heading, Text, Input, InputGroup, InputLeftElement, Icon,
  Button, Badge, Tabs, TabList, Tab, Menu, MenuButton, MenuList, MenuItem,
  useToast, Skeleton, Spinner,
} from '@chakra-ui/react';
import { FiSearch, FiStar, FiChevronDown, FiCheckCircle, FiTrash2, FiEdit2, FiArrowRight } from 'react-icons/fi';
import TemplateEditorModal from '../components/TemplateEditorModal';
import { getTemplates, deleteTemplate, updateTemplate } from '../api';

const JOURNEYS = ['Onboarding', 'Billing', 'Engagement', 'Transaction'];
const CHANNELS = [
  { name: 'Email', dot: '#e8a13c' },
  { name: 'Website', dot: '#6b7280' },
  { name: 'Mobile', dot: '#2f9fe0' },
  { name: 'Messenger', dot: '#7c4dff' },
];
const CHANNEL_TINT = { Website: '#eef4fb', Messenger: '#e9f7ef', Email: '#fdf3e3', Mobile: '#e8f4fd' };
const DESCRIPTIONS = {
  'Welcome new visitor': 'Friendly greeting with clear next steps.',
  'Product tour invite': 'Invite visitors to explore key features.',
};

const card = { bg: 'white', borderRadius: '16px', boxShadow: 'card' };

const Analysis = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catSearch, setCatSearch] = useState('');
  const [journey, setJourney] = useState('All');
  const [channel, setChannel] = useState('All channels');
  const [sort, setSort] = useState('Most used');
  const [tab, setTab] = useState('All templates');
  const [selectedId, setSelectedId] = useState(null);
  const [previewAs, setPreviewAs] = useState('New visitor');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const toast = useToast();

  const load = async () => {
    try {
      const d = await getTemplates();
      setTemplates(Array.isArray(d) ? d : []);
      if (!selectedId && Array.isArray(d) && d.length > 0) setSelectedId(d[0].id);
    } catch {
      toast({ title: 'Could not load templates', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = templates.filter((t) => {
      if (tab === 'My team' && t.team !== 'My team' && t.team !== 'All templates') return false;
      if (tab === 'Recently used' && t.team !== 'Recently used' && (t.uses || 0) < 50) return false;
      if (journey !== 'All' && (t.journey || t.category) !== journey && t.category !== journey) return false;
      if (channel !== 'All channels' && t.channel !== channel) return false;
      if (!q) return true;
      return `${t.name} ${t.title || ''} ${t.content} ${t.category}`.toLowerCase().includes(q);
    });
    return [...rows].sort((a, b) => (sort === 'Name A-Z' ? a.name.localeCompare(b.name) : (b.uses || 0) - (a.uses || 0)));
  }, [templates, search, journey, channel, sort, tab]);

  const selected = filtered.find((t) => t.id === selectedId) || filtered[0] || null;
  const vars = selected ? [...new Set([...selected.content.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]))] : [];

  const handleDelete = async (t) => {
    try {
      await deleteTemplate(t.id);
      setTemplates((p) => p.filter((x) => x.id !== t.id));
      toast({ title: `"${t.name}" deleted`, status: 'info', duration: 2500, isClosable: true });
    } catch {
      toast({ title: 'Delete failed', status: 'error', duration: 2500, isClosable: true });
    }
  };

  const toggleStar = async (t) => {
    setTemplates((p) => p.map((x) => (x.id === t.id ? { ...x, starred: !x.starred } : x)));
    try {
      await updateTemplate(t.id, { starred: !t.starred });
    } catch { /* local-only */ }
  };

  const handleInsert = async () => {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(selected.content);
      toast({ title: 'Template copied', description: 'Paste it into any supervisor reply box.', status: 'success', duration: 2500, isClosable: true });
    } catch {
      toast({ title: 'Copy blocked by browser', description: selected.content, status: 'warning', duration: 4000, isClosable: true });
    }
  };

  const openCreate = () => { setEditing(null); setEditorOpen(true); };
  const openEdit = (t) => { setEditing(t); setEditorOpen(true); };

  if (loading) {
    return (
      <Grid templateColumns="220px 1fr 300px" gap={4}>
        <Skeleton height="500px" borderRadius="16px" />
        <Skeleton height="500px" borderRadius="16px" />
        <Skeleton height="500px" borderRadius="16px" />
      </Grid>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3} mb={4}>
        <Box>
          <Heading size="lg" letterSpacing="tight">Template Governance Workspace</Heading>
          <Text color="ink.500" fontSize="sm">Manage content quality, approvals, localization, performance, and lifecycle</Text>
        </Box>
        <Button bg="brand.700" color="white" borderRadius="10px" px={6} _hover={{ bg: 'brand.800' }} onClick={openCreate}>
          Create template
        </Button>
      </Flex>

      <Grid templateColumns={{ base: '1fr', lg: '210px 1fr', xl: '210px 1fr 300px' }} gap={4} align="start">
        {/* Library */}
        <Box {...card} p={4} display={{ base: 'none', lg: 'block' }}>
          <Text fontSize="11px" fontWeight="800" letterSpacing="0.06em" mb={2}>TEMPLATE LIBRARY</Text>
          <InputGroup size="sm" mb={3}>
            <InputLeftElement pointerEvents="none"><Icon as={FiSearch} color="gray.400" /></InputLeftElement>
            <Input placeholder="Search categories" borderRadius="full" value={catSearch} onChange={(e) => setCatSearch(e.target.value)} />
          </InputGroup>
          <Button w="100%" justifyContent="flex-start" size="sm" borderRadius="10px" bg="brand.50" color="brand.700" fontWeight="700" mb={1}
            onClick={() => { setJourney('All'); setTab('All templates'); }}>
            <Box w={2} h={2} borderRadius="full" bg="brand.500" mr={2} /> All templates
            <Badge ml="auto" bg="brand.100" color="brand.700" borderRadius="full">{templates.length}</Badge>
          </Button>
          <Button w="100%" justifyContent="flex-start" size="sm" variant="ghost" onClick={() => setSort('Most used')}>
            <Box w={2} h={2} borderRadius="full" bg="#e8a13c" mr={2} /> Popular
          </Button>
          <Button w="100%" justifyContent="flex-start" size="sm" variant="ghost" onClick={() => setSort('Most used')}>
            <Box w={2} h={2} borderRadius="full" bg="gray.400" mr={2} /> Low use
          </Button>
          <Text fontSize="10px" fontWeight="700" color="gray.400" mt={4} mb={1}>BY JOURNEY</Text>
          {JOURNEYS.filter((j) => j.toLowerCase().includes(catSearch.toLowerCase())).map((j) => (
            <Button key={j} w="100%" justifyContent="flex-start" size="sm" borderRadius="10px"
              bg={journey === j ? 'gray.100' : 'transparent'} fontWeight={journey === j ? '700' : '500'} onClick={() => setJourney(journey === j ? 'All' : j)}>
              <Box w={2} h={2} borderRadius="full" bg={j === 'Onboarding' ? 'brand.500' : j === 'Billing' ? '#2f9fe0' : j === 'Engagement' ? '#3aa56b' : '#e05252'} mr={2} /> {j}
            </Button>
          ))}
          <Text fontSize="10px" fontWeight="700" color="gray.400" mt={4} mb={1}>BY CHANNEL</Text>
          {CHANNELS.filter((c) => c.name.toLowerCase().includes(catSearch.toLowerCase())).map((c) => (
            <Button key={c.name} w="100%" justifyContent="flex-start" size="sm" variant="ghost" onClick={() => setChannel(channel === c.name ? 'All channels' : c.name)}>
              <Box w={2} h={2} borderRadius="full" bg={c.dot} mr={2} /> {c.name}
            </Button>
          ))}
        </Box>

        {/* Grid */}
        <Box {...card} p={5}>
          <Heading size="md" mb={1}>Response Templates</Heading>
          <Text fontSize="sm" color="gray.500" mb={3}>Choose a reply and customize it before inserting.</Text>
          <Flex gap={2} mb={3} flexWrap="wrap">
            <InputGroup maxW="260px" size="sm">
              <InputLeftElement pointerEvents="none"><Icon as={FiSearch} color="gray.400" /></InputLeftElement>
              <Input placeholder="Search title, message, or tag" borderRadius="full" value={search} onChange={(e) => setSearch(e.target.value)} />
            </InputGroup>
            <Menu>
              <MenuButton as={Button} size="sm" variant="outline" borderRadius="full" rightIcon={<FiChevronDown />}>{channel}</MenuButton>
              <MenuList>{['All channels', ...CHANNELS.map((c) => c.name)].map((c) => (
                <MenuItem key={c} onClick={() => setChannel(c)}>{c}</MenuItem>
              ))}</MenuList>
            </Menu>
            <Menu>
              <MenuButton as={Button} size="sm" variant="outline" borderRadius="full" rightIcon={<FiChevronDown />}>{sort}</MenuButton>
              <MenuList>{['Most used', 'Name A-Z'].map((s) => (
                <MenuItem key={s} onClick={() => setSort(s)}>{s}</MenuItem>
              ))}</MenuList>
            </Menu>
          </Flex>
          <Flex gap={2} align="center" mb={3}>
            <Tabs size="sm" variant="soft-rounded" colorScheme="purple"
              index={['All templates', 'My team', 'Recently used'].indexOf(tab)}
              onChange={(i) => setTab(['All templates', 'My team', 'Recently used'][i])}>
              <TabList><Tab>All templates</Tab><Tab>My team</Tab><Tab>Recently used</Tab></TabList>
            </Tabs>
            <Text ml="auto" fontSize="xs" color="gray.400">{filtered.length} results</Text>
          </Flex>
          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={3}>
            {filtered.map((t) => (
              <Box key={t.id} border="1px" borderColor={selected?.id === t.id ? 'brand.400' : 'gray.200'}
                borderRadius="14px" p={3} cursor="pointer" onClick={() => setSelectedId(t.id)}
                _hover={{ borderColor: 'brand.300', boxShadow: 'md' }} role="group">
                <Flex bg={CHANNEL_TINT[t.channel] || '#f4f3f9'} borderRadius="10px" p={3} mb={2} justify="space-between">
                  <Box flex="1">
                    <Box h={2} borderRadius="full" bg="gray.300" w="60%" mb={1.5} />
                    <Box h={2} borderRadius="full" bg="gray.200" w="85%" />
                  </Box>
                  <Icon as={FiStar} color={t.starred ? 'brand.500' : 'gray.400'} fill={t.starred ? 'currentColor' : 'none'}
                    cursor="pointer" onClick={(e) => { e.stopPropagation(); toggleStar(t); }} />
                </Flex>
                <Text fontWeight="700" fontSize="sm">{t.name}</Text>
                <Text fontSize="xs" color="gray.500" mb={2}>{t.title || DESCRIPTIONS[t.name] || t.category}</Text>
                <Flex gap={1} align="center">
                  <Badge bg="brand.50" color="brand.700" borderRadius="full" textTransform="none" fontSize="10px">{t.journey || t.category}</Badge>
                  <Badge bg={CHANNEL_TINT[t.channel] || 'gray.100'} color="gray.600" borderRadius="full" textTransform="none" fontSize="10px">{t.channel}</Badge>
                  {t.isShared && <Badge bg="green.100" color="green.700" borderRadius="full" textTransform="none" fontSize="10px">Shared</Badge>}
                  <Text ml="auto" fontSize="10px" color="gray.400">{t.uses || 0} uses</Text>
                </Flex>
                {selected?.id === t.id && (
                  <Flex gap={4} justify="center" mt={2}>
                    <Button size="sm" borderRadius="full" bg="red.50" color="red.500" onClick={(e) => { e.stopPropagation(); handleDelete(t); }} aria-label={`Delete ${t.name}`}>
                      <FiTrash2 />
                    </Button>
                    <Button size="sm" borderRadius="full" bg="blue.50" color="blue.500" onClick={(e) => { e.stopPropagation(); openEdit(t); }} aria-label={`Edit ${t.name}`}>
                      <FiEdit2 />
                    </Button>
                    <Button size="sm" borderRadius="full" bg="green.50" color="green.600" onClick={(e) => { e.stopPropagation(); handleInsert(); }} aria-label={`Use ${t.name}`}>
                      <FiArrowRight />
                    </Button>
                  </Flex>
                )}
              </Box>
            ))}
          </Grid>
          {filtered.length === 0 && (
            <Box textAlign="center" py={10}>
              {loading ? <Spinner color="brand.600" /> : <Text color="gray.400" fontSize="sm">No templates match these filters.</Text>}
            </Box>
          )}
        </Box>

        {/* Preview */}
        <Box {...card} p={5} display={{ base: 'none', xl: 'block' }}>
          <Heading size="sm">Preview</Heading>
          <Text fontSize="xs" color="gray.500" mb={3}>Review the selected reply before inserting.</Text>
          <Text fontSize="10px" fontWeight="800" letterSpacing="0.06em" mb={1}>PREVIEW AS</Text>
          <Menu>
            <MenuButton as={Button} w="100%" size="sm" variant="outline" borderRadius="10px" rightIcon={<FiChevronDown />} mb={3}>
              {previewAs}
            </MenuButton>
            <MenuList>{['New visitor', 'Returning customer', 'VIP member'].map((p) => (
              <MenuItem key={p} onClick={() => setPreviewAs(p)}>{p}</MenuItem>
            ))}</MenuList>
          </Menu>
          <Box bg="#f6f5fb" borderRadius="14px" p={3} mb={3}>
            <Text fontSize="10px" color="gray.400" mb={2}>Live preview</Text>
            <Box bg="white" borderRadius="12px" p={3} boxShadow="sm">
              <Text fontWeight="800" fontSize="sm" mb={1}>{selected?.title || selected?.name || '—'}</Text>
              <Text fontSize="xs" color="gray.600">{selected?.content || 'Select a template.'}</Text>
            </Box>
          </Box>
          <Flex gap={2} bg="green.50" borderRadius="10px" p={2.5} mb={3} align="center">
            <Icon as={FiCheckCircle} color="green.500" />
            <Box>
              <Text fontSize="xs" fontWeight="800" color="green.700">{vars.length} variables resolved</Text>
              <Text fontSize="10px" color="green.600">{vars.join(', ') || 'No variables'}</Text>
            </Box>
          </Flex>
          <Text fontSize="10px" color="gray.400" mb={3}>You can edit the message after inserting.</Text>
          <Flex gap={2}>
            <Button flex="1" variant="outline" borderRadius="10px" onClick={() => setSelectedId(null)}>Cancel</Button>
            <Button flex="1" bg="brand.700" color="white" borderRadius="10px" _hover={{ bg: 'brand.800' }} onClick={handleInsert}>Insert</Button>
          </Flex>
        </Box>
      </Grid>

      <TemplateEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        template={editing}
        onSaved={(saved) => {
          setTemplates((p) => {
            const i = p.findIndex((x) => x.id === saved.id);
            return i >= 0 ? p.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...p];
          });
          setSelectedId(saved.id);
        }}
      />
    </Box>
  );
};

export default Analysis;
