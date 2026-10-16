// src/components/TemplateEditorModal.js — Create / Edit template (design mock)
import React, { useEffect, useState } from 'react';
import {
  Box, Flex, Text, Input, Textarea, Button, Select, useToast,
} from '@chakra-ui/react';
import { FiCheck } from 'react-icons/fi';
import { createTemplate, updateTemplate } from '../api';

const CATEGORIES = [
  'Onboarding', 'Billing', 'Engagement', 'Transaction',
  'Shipping', 'Returns', 'Refunds', 'Delivery', 'Account', 'Product',
  'Chat', 'Support',
];

function detectVars(content) {
  return [...new Set([...content.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]))];
}

const TemplateEditorModal = ({ isOpen, onClose, template, onSaved }) => {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Chat');
  const [content, setContent] = useState('');
  const [shared, setShared] = useState(false);
  const [varDescs, setVarDescs] = useState({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) return;
    setName(template?.name || '');
    setTitle(template?.title || '');
    setCategory(CATEGORIES.includes(template?.category) ? template.category : 'Chat');
    setContent(template?.content || '');
    setShared(!!template?.isShared);
    const d = {};
    (template?.variables || []).forEach((v) => { d[v.name] = v.description || ''; });
    setVarDescs(d);
  }, [isOpen, template]);

  if (!isOpen) return null;

  const vars = detectVars(content);

  const handleSave = async () => {
    if (!name.trim() || !content.trim()) {
      toast({ title: 'Name and content are required', status: 'warning', duration: 2500, isClosable: true });
      return;
    }
    setSaving(true);
    try {
      const variables = vars.map((v) => ({ name: v, description: varDescs[v] || '' }));
      const payload = { name: name.trim(), title: title.trim(), category, content, variables, isShared: shared };
      const saved = template
        ? await updateTemplate(template.id, payload)
        : await createTemplate({ ...payload, channel: 'Website', journey: category, team: 'All templates' });
      toast({ title: template ? 'Template updated' : 'Template created', status: 'success', duration: 2500, isClosable: true });
      onSaved(saved);
      onClose();
    } catch {
      toast({ title: 'Save failed', description: 'Backend unreachable.', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box position="fixed" inset={0} zIndex={50} bg="blackAlpha.500" display="flex" alignItems="center" justifyContent="center" p={4} onClick={onClose}>
      <Box bg="#f1eff7" borderRadius="24px" maxW="980px" w="100%" maxH="92vh" overflowY="auto" p={{ base: 4, md: 7 }} onClick={(e) => e.stopPropagation()}>
        <Flex gap={6} direction={{ base: 'column', md: 'row' }}>
          {/* Form */}
          <Box flex="1.2" minW={0}>
            <Text fontSize="xl" fontWeight="800" mb={4}>{template ? 'Edit Template' : 'Create Template'}</Text>
            <Box bg="white" borderRadius="20px" p={5}>
              <Text fontSize="xs" color="gray.500" mb={1}>Name</Text>
              <Input placeholder="Template name" borderRadius="10px" mb={4} value={name} onChange={(e) => setName(e.target.value)} />
              <Text fontSize="xs" color="gray.500" mb={1}>Title</Text>
              <Input placeholder="Say Hi to welcome new visitors!" borderRadius="10px" mb={4} value={title} onChange={(e) => setTitle(e.target.value)} />
              <Text fontSize="xs" color="gray.500" mb={1}>Category</Text>
              <Select borderRadius="10px" mb={4} value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Text fontSize="xs" color="gray.500" mb={1}>Content</Text>
              <Textarea rows={4} borderRadius="12px 12px 0 0" borderBottom="none"
                placeholder="Hi {{user_name}}! Welcome to {{company_name}}. How may I be of help today?"
                value={content} onChange={(e) => setContent(e.target.value)} />
              {/* Decorative formatting toolbar (visual only, per mock) */}
              <Flex gap={2} align="center" border="1px" borderColor="gray.200" borderRadius="0 0 12px 12px"
                px={3} py={1.5} fontSize="xs" color="gray.500" flexWrap="wrap" mb={5}>
                {['Sans Serif', 'T', 'B', 'I', 'U', 'A', '≡', '☰', '•', '←', '→'].map((t) => (
                  <Text key={t} fontWeight={t === 'B' ? '800' : '400'} cursor="default">{t}</Text>
                ))}
                <Text ml="auto" color="brand.600" fontWeight="600">{vars.length > 0 ? `${vars.length} variable${vars.length > 1 ? 's' : ''}` : ''}</Text>
              </Flex>
              <Text fontSize="xs" color="gray.500" mb={1}>Variables <Text as="span" color="gray.300">(use {'{{variable_name}}'} in content)</Text></Text>
              <Box mb={5}>
                {vars.length === 0 && (
                  <Text fontSize="xs" color="gray.300" mb={1}>No variables detected — type e.g. {'{{order_id}}'} above.</Text>
                )}
                {vars.map((v) => (
                  <Flex key={v} gap={2} align="center" mb={1.5}>
                    <Text fontSize="xs" fontWeight="700" bg="brand.50" color="brand.700" borderRadius="6px" px={2} py={1} whiteSpace="nowrap">
                      {'{{'}{v}{'}}'}
                    </Text>
                    <Input size="xs" borderRadius="8px" placeholder={`Describe ${v}…`} value={varDescs[v] || ''}
                      onChange={(e) => setVarDescs((p) => ({ ...p, [v]: e.target.value }))} />
                  </Flex>
                ))}
              </Box>
              <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
                <Button borderRadius="full" px={5} bg={shared ? 'brand.700' : 'gray.200'}
                  color={shared ? 'white' : 'gray.600'} _hover={{ bg: shared ? 'brand.800' : 'gray.300' }}
                  rightIcon={shared ? <FiCheck /> : undefined}
                  onClick={() => setShared((s) => !s)}>
                  Share with Team
                </Button>
                <Flex gap={2}>
                  <Button variant="ghost" borderRadius="10px" bg="gray.100" onClick={onClose}>Cancel</Button>
                  <Button bg="brand.700" color="white" borderRadius="10px" _hover={{ bg: 'brand.800' }}
                    isLoading={saving} onClick={handleSave}>Save</Button>
                </Flex>
              </Flex>
            </Box>
          </Box>

          {/* Preview */}
          <Box flex="1" minW={0}>
            <Text fontSize="xl" fontWeight="800" mb={4}>Preview</Text>
            <Box bg="white" borderRadius="20px" p={5} minH="380px" display="flex" alignItems="flex-end">
              <Flex border="1px" borderColor="gray.200" borderRadius="14px" p={3} w="100%" gap={2} align="flex-start">
                <Text fontSize="xs" bg="brand.50" color="brand.700" borderRadius="full" px={2.5} py={1} fontWeight="700" whiteSpace="nowrap">
                  ✦ {category}
                </Text>
                <Text fontSize="sm" color="gray.700" flex="1">
                  {title ? <><b>{title}</b><br /></> : null}
                  {content || <Text as="span" color="gray.300">Nothing to preview yet…</Text>}
                </Text>
                <Text color="gray.300" fontWeight="800">⋮</Text>
              </Flex>
            </Box>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};

export default TemplateEditorModal;
