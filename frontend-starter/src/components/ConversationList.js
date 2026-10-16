// src/components/ConversationList.js
import React, { useState, useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Stack,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiSearch, FiAlertCircle, FiCheckCircle, FiMessageSquare, FiClock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { timeAgo } from '../utils/dateUtils';

const ConversationList = ({ conversations, loading, error }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [alertFilter, setAlertFilter] = useState('all');

  const navigate = useNavigate();
  const bg = useColorModeValue('white', 'gray.800');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      const matchesSearch = searchTerm === '' || 
        conv.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (conv.tags && conv.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      
      const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
      const matchesAlert = alertFilter === 'all' || conv.alertLevel === alertFilter;
      
      return matchesSearch && matchesStatus && matchesAlert;
    });
  }, [conversations, searchTerm, statusFilter, alertFilter]);

  const handleConversationClick = (id) => {
    navigate(`/conversation/${id}`);
  };

  if (loading) {
    return <Box p={4}>Loading conversations...</Box>;
  }

  if (error) {
    return <Box p={4} color="red.500">Error loading conversations: {error}</Box>;
  }

  return (
    <Box bg={bg} borderRadius="lg" boxShadow="sm" overflow="hidden">
      <Box p={4} borderBottom="1px" borderColor={borderColor}>
        <Stack spacing={3}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="gray.400" />
            </InputLeftElement>
            <Input 
              placeholder="Search by customer name or tag" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          
          <Flex gap={3}>
            <Select 
              size="sm" 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="waiting">Waiting</option>
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
            </Select>
            
            <Select 
              size="sm"
              value={alertFilter}
              onChange={(e) => setAlertFilter(e.target.value)}
            >
              <option value="all">All Alert Levels</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </Flex>
        </Stack>
      </Box>
      
      <Box maxH="600px" overflowY="auto">
        {filteredConversations.length === 0 ? (
          <Box p={4} textAlign="center" color="gray.500">
            No conversations match your filters
          </Box>
        ) : (
          filteredConversations.map((conversation) => (
            <Box
              key={conversation.id}
              p={4}
              borderBottom="1px"
              borderColor={borderColor}
              _hover={{ bg: hoverBg, cursor: 'pointer' }}
              onClick={() => handleConversationClick(conversation.id)}
            >
              <Flex justify="space-between" align="center" mb={2}>
                <Flex align="center">
                  <Text fontWeight="bold">{conversation.customer.name}</Text>
                  <Badge 
                    ml={2} 
                    colorScheme={
                      conversation.status === 'active' ? 'green' :
                      conversation.status === 'waiting' ? 'orange' :
                      conversation.status === 'resolved' ? 'blue' : 
                      'purple'
                    }
                  >
                    {conversation.status}
                  </Badge>
                </Flex>
                <Box>
                  {conversation.alertLevel === 'high' && (
                    <Icon as={FiAlertCircle} color="red.500" boxSize={5} />
                  )}
                  {conversation.alertLevel === 'medium' && (
                    <Icon as={FiAlertCircle} color="orange.500" boxSize={5} />
                  )}
                </Box>
              </Flex>
              
              <Flex align="center" fontSize="sm" color="gray.500" mb={2}>
                <Icon as={FiMessageSquare} mr={1} />
                <Text>{conversation.messages?.length || 0} messages</Text>
                
                <Icon as={FiClock} ml={3} mr={1} />
                <Text>{timeAgo(new Date(conversation.startTime))}</Text>
              </Flex>
              
              {conversation.tags && conversation.tags.length > 0 && (
                <Flex mt={2} flexWrap="wrap" gap={2}>
                  {conversation.tags.map((tag) => (
                    <Badge key={tag} colorScheme="gray" fontSize="xs">
                      {tag}
                    </Badge>
                  ))}
                </Flex>
              )}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
};

export default ConversationList;