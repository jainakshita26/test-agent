// src/components/Sidebar.js
import React from 'react';
import { Box, Flex, Text, VStack, Icon, Button } from '@chakra-ui/react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiBriefcase, FiZap, FiSettings } from 'react-icons/fi';
import { TbTicket } from 'react-icons/tb';

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const navItems = [
    { name: 'Dashboard', icon: FiHome, path: '/' },
    { name: 'Conversations', icon: TbTicket, path: '/conversations' },
    { name: 'AI Agents', icon: FiBriefcase, path: '/agent-config' },
    { name: 'Templates', icon: FiZap, path: '/templates' },
  ];

  return (
    <Box
      w="210px"
      minW="210px"
      bg="white"
      borderRadius="20px"
      boxShadow="card"
      p={4}
      display={{ base: 'none', md: 'flex' }}
      flexDirection="column"
      justifyContent="space-between"
      minH="calc(100vh - 120px)"
      position="sticky"
      top="88px"
    >
      <VStack spacing={1} align="stretch">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Button
              key={item.path}
              as={NavLink}
              to={item.path}
              variant="ghost"
              justifyContent="flex-start"
              fontWeight={active ? '700' : '500'}
              color={active ? 'ink.900' : 'ink.600'}
              bg={active ? 'brand.50' : 'transparent'}
              borderRadius="12px"
              py={3}
              leftIcon={<Icon as={item.icon} boxSize={5} />}
              _hover={{ bg: 'brand.50', color: 'ink.900' }}
              _active={{ bg: 'brand.100' }}
            >
              {item.name}
            </Button>
          );
        })}
      </VStack>
      <Flex
        as={NavLink}
        to="/agent-config"
        align="center"
        gap={2}
        px={3}
        py={3}
        borderRadius="12px"
        color="ink.900"
        fontWeight="600"
        _hover={{ bg: 'brand.50' }}
      >
        <Icon as={FiSettings} boxSize={5} />
        <Text>Settings</Text>
      </Flex>
    </Box>
  );
};

export default Sidebar;
