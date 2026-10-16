// src/pages/Conversations.js — full conversation list feeding the intervention view
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Flex, Heading, Text, Input, InputGroup, Badge, Button,
  Menu, MenuButton, MenuList, MenuItem, Spinner,
} from '@chakra-ui/react';
import { FiChevronDown } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';

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

const card = { bg: 'white', borderRadius: '16px', boxShadow: 'card' };

const Conversations = () => {
  const { conversations, loading, error, searchTerm, setSearchTerm } = useAppData();
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [sortMode, setSortMode] = useState('risk');
  const [tick, setTick] = useState(0);
  const navigate = useNavigate();

  // Refresh "wait" counters without refetching
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const rows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let list = conversations.map((c) => ({ c, risk: riskOf(c) })).filter(({ c }) => {
      if (statusFilter !== 'All statuses' && c.status !== statusFilter.toLowerCase().replace(' ', '')) {
        if (!(statusFilter === 'Needs attention' && c.alertLevel === 'high')) return false;
      }
      if (!q) return true;
      return `${c.customer?.name} ${c.id} ${(c.tags || []).join(' ')} ${c.agent?.name}`.toLowerCase().includes(q);
    });
    return [...list].sort((a, b) => {
      if (sortMode === 'wait') return new Date(a.c.startTime) - new Date(b.c.startTime);
      if (sortMode === 'name') return (a.c.customer?.name || '').localeCompare(b.c.customer?.name || '');
      return b.risk - a.risk;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, searchTerm, statusFilter, sortMode, tick]);

  return (
    <Box>
      <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3} mb={4}>
        <Box>
          <Heading size="lg" letterSpacing="tight">Conversations</Heading>
          <Text color="ink.500" fontSize="sm">
            {loading.conversations
              ? 'Loading cases…'
              : `${conversations.length} total • click a case to open the intervention view`}
          </Text>
        </Box>
        <Flex gap={2} flexWrap="wrap">
          <Menu>
            <MenuButton as={Button} size="sm" bg="white" borderRadius="full" rightIcon={<FiChevronDown />}>{statusFilter}</MenuButton>
            <MenuList>
              {['All statuses', 'Active', 'Escalated', 'Resolved', 'Needs attention'].map((s) => (
                <MenuItem key={s} onClick={() => setStatusFilter(s)}>{s}</MenuItem>
              ))}
            </MenuList>
          </Menu>
          <Menu>
            <MenuButton as={Button} size="sm" bg="white" borderRadius="full" rightIcon={<FiChevronDown />}>Sort: {sortMode}</MenuButton>
            <MenuList>
              {['risk', 'wait', 'name'].map((s) => (
                <MenuItem key={s} onClick={() => setSortMode(s)}>Sort: {s}</MenuItem>
              ))}
            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      <Box {...card} p={4} mb={4}>
        <InputGroup size="md">
          <Input placeholder="Search customer, case, tag or agent..." bg="#f6f5fb" border="none" borderRadius="10px"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </InputGroup>
      </Box>

      {loading.conversations ? (
        <Flex justify="center" py={10}><Spinner color="brand.600" /></Flex>
      ) : error.conversations ? (
        <Box {...card} p={8} textAlign="center">
          <Text fontWeight="700" mb={2}>Couldn't load conversations</Text>
          <Text fontSize="sm" color="gray.500" mb={4}>{error.conversations}</Text>
          <Button bg="brand.700" color="white" onClick={() => window.location.reload()}>Retry</Button>
        </Box>
      ) : (
        <Box display="grid" gridTemplateColumns={{ base: '1fr', md: '1fr 1fr', xl: '1fr 1fr 1fr' }} gap={3}>
          {rows.map(({ c, risk }) => {
            const s = severityOf(risk);
            return (
              <Box key={c.id} {...card} p={4} cursor="pointer" _hover={{ borderColor: 'brand.300', border: '1px' }} border="1px" borderColor="transparent"
                onClick={() => navigate(`/conversation/${c.id}`)}>
                <Flex gap={3} align="center" mb={3}>
                  <Box w={10} h={10} borderRadius="full" bg="#e3c39c" display="flex" alignItems="center" justifyContent="center" fontWeight="800">
                    {(c.customer?.name || '?')[0]}
                  </Box>
                  <Box minW={0}>
                    <Text fontWeight="800" noOfLines={1}>{c.customer?.name}</Text>
                    <Text fontSize="xs" color="gray.500" noOfLines={1}>{c.id} • {c.agent?.name}</Text>
                  </Box>
                </Flex>
                <Text fontSize="sm" color="gray.600" noOfLines={2} mb={3}>
                  {c.messages?.[c.messages.length - 1]?.text || 'No messages yet.'}
                </Text>
                <Flex justify="space-between" align="center">
                  <Flex gap={2}>
                    <Badge bg={s.bg} color={s.color} borderRadius="full" px={3} textTransform="none">{s.label}</Badge>
                    <Badge bg="gray.100" color="gray.600" borderRadius="full" px={3} textTransform="none">{c.status}</Badge>
                  </Flex>
                  <Text fontSize="xs" color="gray.500">{c.messages?.length || 0} msgs • {waitOf(c.startTime)}</Text>
                </Flex>
              </Box>
            );
          })}
        </Box>
      )}
      {!loading.conversations && rows.length === 0 && (
        <Text textAlign="center" color="gray.400" py={8}>No conversations match these filters.</Text>
      )}
    </Box>
  );
};

export default Conversations;
