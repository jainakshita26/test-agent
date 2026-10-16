// src/components/Header.js
import React from 'react';
import {
  Box, Flex, Text, Input, InputGroup, Avatar, IconButton,
  Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerBody,
  VStack, Button, Icon, useDisclosure,
} from '@chakra-ui/react';
import { FiMenu, FiHome, FiBriefcase, FiZap, FiSettings } from 'react-icons/fi';
import { TbTicket } from 'react-icons/tb';
import { NavLink, useLocation } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';

const NAV = [
  { name: 'Dashboard', icon: FiHome, path: '/' },
  { name: 'Conversations', icon: TbTicket, path: '/conversations' },
  { name: 'AI Agents', icon: FiBriefcase, path: '/agent-config' },
  { name: 'Templates', icon: FiZap, path: '/templates' },
];

const Header = () => {
  const { searchTerm, setSearchTerm } = useAppData();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const location = useLocation();

  return (
    <>
      <Box as="header" bg="brand.800" px={{ base: 3, md: 6 }} py={3} position="sticky" top={0} zIndex={20}>
        <Flex justify="space-between" align="center" gap={2}>
          <Flex align="center" gap={2} minW={0}>
            <IconButton aria-label="Open menu" icon={<FiMenu />} variant="ghost" color="white"
              display={{ base: 'flex', md: 'none' }} onClick={onOpen} flexShrink={0} />
            <Text color="white" fontWeight="800" fontSize={{ base: 'md', md: 'lg' }} letterSpacing="tight"
              whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
              ABC Company
            </Text>
          </Flex>
          <Flex align="center" gap={2} flex="1" minW={0} maxW={{ base: '100%', md: '420px' }} justify="flex-end">
            <InputGroup flex="1" minW={0} maxW={{ base: '100%', md: '340px' }}>
              <Input
                placeholder="Search conversations, agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                bg="whiteAlpha.200"
                border="none"
                borderRadius="12px"
                color="white"
                _placeholder={{ color: 'whiteAlpha.700' }}
                _hover={{ bg: 'whiteAlpha.300' }}
                _focus={{ bg: 'whiteAlpha.300', border: 'none', boxShadow: 'none' }}
                size="md"
              />
            </InputGroup>
            <Avatar size="sm" name="Neha Patel" bg="#e8c39e" color="brand.900" fontWeight="700" flexShrink={0}>
              NP
            </Avatar>
          </Flex>
        </Flex>
      </Box>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent borderTopRightRadius="20px" borderBottomRightRadius="20px">
          <DrawerCloseButton />
          <DrawerBody py={6} display="flex" flexDirection="column">
            <VStack spacing={1} align="stretch" flex="1">
              {NAV.map((item) => {
                const active = location.pathname === item.path;
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
                    onClick={onClose}
                  >
                    {item.name}
                  </Button>
                );
              })}
            </VStack>
            <Flex as={NavLink} to="/agent-config" align="center" gap={2} px={3} py={3}
              borderRadius="12px" fontWeight="600" onClick={onClose}>
              <Icon as={FiSettings} boxSize={5} />
              <Text>Settings</Text>
            </Flex>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default Header;
