// src/pages/AgentConfig.js — Agent Configuration (parameters, capabilities, thresholds, presets)
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Flex, Grid, Heading, Text, Button, Select, Badge, Switch,
  Slider, SliderTrack, SliderFilledTrack, SliderThumb, Input, Divider,
  useToast, Skeleton, Stat, StatLabel, StatNumber,
} from '@chakra-ui/react';
import { useAppData } from '../context/AppDataContext';
import { getAgents, getAgent, getAgentMetrics, getKnowledgeBases, updateAgentConfig } from '../api';

const PRESET_KEY = 'zangoh-agent-presets';

const BUILT_INS = {
  Balanced: {
    parameters: { temperature: 0.7, max_tokens: 150, top_p: 1.0 },
    escalationThresholds: { lowConfidence: 0.5, negativeSentiment: 0.35, responseTime: 18 },
  },
  Precise: {
    parameters: { temperature: 0.3, max_tokens: 150, top_p: 0.9 },
    escalationThresholds: { lowConfidence: 0.6, negativeSentiment: 0.4, responseTime: 15 },
  },
  Creative: {
    parameters: { temperature: 0.9, max_tokens: 300, top_p: 1.0 },
    escalationThresholds: { lowConfidence: 0.35, negativeSentiment: 0.25, responseTime: 22 },
  },
};

function loadCustomPresets() {
  try {
    return JSON.parse(localStorage.getItem(PRESET_KEY) || '{}');
  } catch {
    return {};
  }
}

const card = { bg: 'white', borderRadius: '16px', boxShadow: 'card', p: 5 };

function ParamSlider({ label, value, min, max, step, onChange, format }) {
  return (
    <Box mb={4}>
      <Flex justify="space-between" mb={1}>
        <Text fontSize="sm" fontWeight="600">{label}</Text>
        <Badge bg="brand.50" color="brand.700" borderRadius="full" px={2.5}>{format ? format(value) : value}</Badge>
      </Flex>
      <Slider value={value} min={min} max={max} step={step} onChange={onChange} colorScheme="purple">
        <SliderTrack bg="#eceaf3"><SliderFilledTrack bg="brand.600" /></SliderTrack>
        <SliderThumb />
      </Slider>
    </Box>
  );
}

const AgentConfig = () => {
  const { agents: ctxAgents, updateAgent } = useAppData();
  const [agents, setAgents] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [agent, setAgent] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [kbCatalog, setKbCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [customPresets, setCustomPresets] = useState(loadCustomPresets);
  const toast = useToast();

  // Form state
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(150);
  const [topP, setTopP] = useState(1.0);
  const [caps, setCaps] = useState([]);
  const [kbs, setKbs] = useState([]);
  const [thresholds, setThresholds] = useState({ lowConfidence: 0.5, negativeSentiment: 0.35, responseTime: 18 });

  useEffect(() => {
    Promise.all([getAgents(), getKnowledgeBases().catch(() => [])])
      .then(([a, kb]) => {
        setAgents(a || []);
        setKbCatalog(Array.isArray(kb) ? kb : kb?.data || []);
        if ((a || []).length > 0) setSelectedId(a[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (ctxAgents.length > 0 && agents.length === 0) {
      setAgents(ctxAgents);
      setSelectedId((s) => s || ctxAgents[0].id);
      setLoading(false);
    }
  }, [ctxAgents, agents.length]);

  // Load selected agent detail + metrics
  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    Promise.all([getAgent(selectedId), getAgentMetrics(selectedId).catch(() => null)])
      .then(([a, m]) => {
        setAgent(a);
        setMetrics(m);
        applyToForm(a);
        setDirty(false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const applyToForm = (a) => {
    setTemperature(a.parameters?.temperature ?? 0.7);
    setMaxTokens(a.parameters?.max_tokens ?? 150);
    setTopP(a.parameters?.top_p ?? 1.0);
    setCaps((a.capabilities || []).map((c) => ({ id: c.id, name: c.name, enabled: !!c.enabled })));
    // Union agent KBs with catalog so every domain is toggleable
    const byId = {};
    (a.knowledgeBases || []).forEach((k) => { byId[k.id] = { id: k.id, name: k.name, enabled: !!k.enabled }; });
    kbCatalog.forEach((k) => {
      if (!byId[k.id]) byId[k.id] = { id: k.id, name: k.name, enabled: false };
    });
    setKbs(Object.values(byId));
    setThresholds({
      lowConfidence: a.escalationThresholds?.lowConfidence ?? 0.5,
      negativeSentiment: a.escalationThresholds?.negativeSentiment ?? 0.35,
      responseTime: a.escalationThresholds?.responseTime ?? 18,
    });
  };

  const markDirty = (fn) => (...args) => { fn(...args); setDirty(true); };

  const handleReset = () => {
    if (agent) {
      applyToForm(agent);
      setDirty(false);
      toast({ title: 'Changes discarded', status: 'info', duration: 2000, isClosable: true });
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    try {
      const payload = {
        parameters: { temperature, max_tokens: maxTokens, top_p: topP },
        capabilities: caps.map((c) => ({ id: c.id, enabled: c.enabled })),
        knowledgeBases: kbs.map((k) => ({ id: k.id, name: k.name, enabled: k.enabled })),
        escalationThresholds: thresholds,
      };
      const res = await updateAgentConfig(selectedId, payload);
      if (res.agent) {
        setAgent(res.agent);
        updateAgent(selectedId, res.agent);
      }
      setDirty(false);
      toast({ title: 'Configuration saved', description: `${agent?.name} updated.`, status: 'success', duration: 3000, isClosable: true });
    } catch {
      toast({ title: 'Save failed', description: 'Backend unreachable.', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset) => {
    if (preset.parameters) {
      setTemperature(preset.parameters.temperature ?? temperature);
      setMaxTokens(preset.parameters.max_tokens ?? maxTokens);
      setTopP(preset.parameters.top_p ?? topP);
    }
    if (preset.escalationThresholds) {
      setThresholds({ ...thresholds, ...preset.escalationThresholds });
    }
    if (preset.capabilities) {
      // preset.capabilities: {id: enabled}
      setCaps((prev) => prev.map((c) =>
        preset.capabilities[c.id] !== undefined ? { ...c, enabled: preset.capabilities[c.id] } : c
      ));
    }
    setDirty(true);
    toast({ title: 'Preset applied', description: 'Review and Save Changes to persist.', status: 'info', duration: 2500, isClosable: true });
  };

  const snapshot = () => ({
    parameters: { temperature, max_tokens: maxTokens, top_p: topP },
    capabilities: Object.fromEntries(caps.map((c) => [c.id, c.enabled])),
    escalationThresholds: { ...thresholds },
  });

  const savePreset = () => {
    const name = presetName.trim();
    if (!name) {
      toast({ title: 'Name your preset', status: 'warning', duration: 2000, isClosable: true });
      return;
    }
    const next = { ...customPresets, [name]: snapshot() };
    setCustomPresets(next);
    localStorage.setItem(PRESET_KEY, JSON.stringify(next));
    setPresetName('');
    toast({ title: `Preset "${name}" saved`, status: 'success', duration: 2500, isClosable: true });
  };

  const deletePreset = (name) => {
    const next = { ...customPresets };
    delete next[name];
    setCustomPresets(next);
    localStorage.setItem(PRESET_KEY, JSON.stringify(next));
  };

  const allPresetNames = useMemo(
    () => [...Object.keys(BUILT_INS), ...Object.keys(customPresets)],
    [customPresets]
  );

  if (loading && !agent) {
    return (
      <Grid templateColumns="1fr 320px" gap={4}>
        <Skeleton height="480px" borderRadius="16px" />
        <Skeleton height="480px" borderRadius="16px" />
      </Grid>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3} mb={4}>
        <Box>
          <Heading size="lg" letterSpacing="tight">Agent Configuration</Heading>
          <Text color="ink.500" fontSize="sm">Tune model behavior, capabilities, and escalation policy per agent</Text>
        </Box>
        <Select data-testid="agent-selector" maxW="280px" bg="white" borderRadius="10px"
          value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>{a.name} • {a.model}</option>
          ))}
        </Select>
      </Flex>

      <Grid templateColumns={{ base: '1fr', xl: '1fr 320px' }} gap={4} align="start">
        <form data-testid="agent-config-form" onSubmit={handleSave}>
          <Box {...card} mb={4}>
            <Flex justify="space-between" align="center" mb={3}>
              <Box>
                <Heading size="sm">AI Parameters</Heading>
                <Text fontSize="xs" color="ink.400">Applied on the next agent turn after saving</Text>
              </Box>
              {dirty && <Badge colorScheme="orange" borderRadius="full">Unsaved changes</Badge>}
            </Flex>
            <ParamSlider label="Temperature" value={temperature} min={0} max={1} step={0.01}
              onChange={markDirty(setTemperature)} format={(v) => v.toFixed(2)} />
            <ParamSlider label="Max tokens" value={maxTokens} min={50} max={1000} step={10}
              onChange={markDirty(setMaxTokens)} />
            <ParamSlider label="Top-p" value={topP} min={0} max={1} step={0.01}
              onChange={markDirty(setTopP)} format={(v) => v.toFixed(2)} />
          </Box>

          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4} mb={4}>
            <Box {...card}>
              <Heading size="sm" mb={1}>Capabilities</Heading>
              <Text fontSize="xs" color="ink.400" mb={3}>Enable or disable what this agent can do</Text>
              {caps.map((c) => (
                <Flex key={c.id} justify="space-between" align="center" py={2} borderBottom="1px" borderColor="gray.100">
                  <Box>
                    <Text fontSize="sm" fontWeight="600">{c.name}</Text>
                    <Text fontSize="xs" color="ink.400">{c.id}</Text>
                  </Box>
                  <Switch colorScheme="purple" isChecked={c.enabled}
                    onChange={markDirty(() => setCaps((p) => p.map((x) => (x.id === c.id ? { ...x, enabled: !x.enabled } : x))))} />
                </Flex>
              ))}
              {caps.length === 0 && <Text fontSize="sm" color="ink.400">No capabilities defined for this agent.</Text>}
            </Box>

            <Box {...card}>
              <Heading size="sm" mb={1}>Knowledge domains</Heading>
              <Text fontSize="xs" color="ink.400" mb={3}>Retrieval sources available to the agent</Text>
              <Box maxH="260px" overflowY="auto">
                {kbs.map((k) => (
                  <Flex key={k.id} justify="space-between" align="center" py={2} borderBottom="1px" borderColor="gray.100">
                    <Box minW={0}>
                      <Text fontSize="sm" fontWeight="600" noOfLines={1}>{k.name}</Text>
                      <Text fontSize="xs" color="ink.400">{k.id}</Text>
                    </Box>
                    <Switch colorScheme="purple" isChecked={k.enabled}
                      onChange={markDirty(() => setKbs((p) => p.map((x) => (x.id === k.id ? { ...x, enabled: !x.enabled } : x))))} />
                  </Flex>
                ))}
              </Box>
            </Box>
          </Grid>

          <Box {...card} mb={4}>
            <Heading size="sm" mb={1}>Automatic escalation thresholds</Heading>
            <Text fontSize="xs" color="ink.400" mb={3}>When any threshold trips, the conversation is flagged for a supervisor</Text>
            <ParamSlider label="Low confidence below" value={thresholds.lowConfidence} min={0} max={1} step={0.05}
              onChange={markDirty((v) => setThresholds((t) => ({ ...t, lowConfidence: v })))} format={(v) => v.toFixed(2)} />
            <ParamSlider label="Negative sentiment below" value={thresholds.negativeSentiment} min={0} max={1} step={0.05}
              onChange={markDirty((v) => setThresholds((t) => ({ ...t, negativeSentiment: v })))} format={(v) => v.toFixed(2)} />
            <Flex align="center" gap={2} mt={2}>
              <Text fontSize="sm" fontWeight="600">Response time over</Text>
              <Input type="number" w="90px" size="sm" borderRadius="8px" value={thresholds.responseTime}
                onChange={markDirty((e) => setThresholds((t) => ({ ...t, responseTime: Number(e.target.value) })))} />
              <Text fontSize="sm" color="ink.500">seconds</Text>
            </Flex>
          </Box>

          <Flex gap={2} justify="flex-end">
            <Button variant="outline" borderRadius="10px" onClick={handleReset}>Reset</Button>
            <Button type="submit" bg="brand.700" color="white" borderRadius="10px" isLoading={saving}
              _hover={{ bg: 'brand.800' }} isDisabled={!dirty}>Save Changes</Button>
          </Flex>
        </form>

        <Box>
          <Box {...card} mb={4}>
            <Flex align="center" gap={2} mb={3}>
              <Box w={2.5} h={2.5} borderRadius="full" bg={agent?.status === 'active' ? 'green.400' : 'gray.400'} />
              <Heading size="sm">{agent?.name}</Heading>
            </Flex>
            <Text fontSize="xs" color="ink.400" mb={3}>{agent?.model} • {agent?.description}</Text>
            <Grid templateColumns="1fr 1fr" gap={3}>
              <Stat><StatLabel fontSize="xs">Conversations</StatLabel><StatNumber fontSize="lg">{metrics?.conversations ?? '—'}</StatNumber></Stat>
              <Stat><StatLabel fontSize="xs">Avg response</StatLabel><StatNumber fontSize="lg">{metrics ? `${metrics.avgResponseTime}s` : '—'}</StatNumber></Stat>
              <Stat><StatLabel fontSize="xs">Satisfaction</StatLabel><StatNumber fontSize="lg">{metrics ? `${Math.round(metrics.satisfaction * 100)}%` : '—'}</StatNumber></Stat>
              <Stat><StatLabel fontSize="xs">Escalation</StatLabel><StatNumber fontSize="lg">{metrics ? `${Math.round(metrics.escalationRate * 100)}%` : '—'}</StatNumber></Stat>
            </Grid>
          </Box>

          <Box {...card}>
            <Heading size="sm" mb={1}>Configuration presets</Heading>
            <Text fontSize="xs" color="ink.400" mb={3}>Apply a preset, then Save Changes to persist it</Text>
            {allPresetNames.map((name) => (
              <Flex key={name} justify="space-between" align="center" py={1.5} borderBottom="1px" borderColor="gray.100">
                <Button size="sm" variant="ghost" fontWeight="600"
                  onClick={() => applyPreset(BUILT_INS[name] || customPresets[name])}>
                  {name}
                  {BUILT_INS[name] && <Badge ml={2} fontSize="9px" bg="brand.50" color="brand.700">built-in</Badge>}
                </Button>
                {!BUILT_INS[name] && (
                  <Button size="xs" variant="ghost" color="red.500" onClick={() => deletePreset(name)}>Delete</Button>
                )}
              </Flex>
            ))}
            <Divider my={3} />
            <Text fontSize="xs" fontWeight="700" mb={2}>Save current as preset</Text>
            <Flex gap={2}>
              <Input size="sm" borderRadius="8px" placeholder="Preset name" value={presetName}
                onChange={(e) => setPresetName(e.target.value)} />
              <Button size="sm" bg="brand.700" color="white" borderRadius="8px" onClick={savePreset}>Save</Button>
            </Flex>
          </Box>
        </Box>
      </Grid>
    </Box>
  );
};

export default AgentConfig;
