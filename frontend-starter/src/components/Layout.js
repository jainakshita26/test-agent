// src/components/Layout.js
import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <Box minHeight="100vh" bg="canvas">
      <Header />
      <Flex gap={5} px={{ base: 3, md: 5 }} py={5} align="flex-start">
        <Sidebar />
        <Box as="main" flex="1" minW={0}>
          {children}
        </Box>
      </Flex>
    </Box>
  );
};

export default Layout;
