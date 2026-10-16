// src/components/MetricsCard.js
import React from 'react';
import {
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Flex,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';

const MetricsCard = ({ title, value, icon, change, changeType, color = 'blue' }) => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box
      bg={bg}
      borderRadius="lg"
      boxShadow="sm"
      p={4}
      borderLeft="4px"
      borderColor={`${color}.500`}
    >
      <Flex justify="space-between" align="center">
        <Stat>
          <StatLabel color="gray.500">{title}</StatLabel>
          <StatNumber fontSize="2xl">{value}</StatNumber>
          {change && (
            <StatHelpText>
              <StatArrow type={changeType} />
              {change}
            </StatHelpText>
          )}
        </Stat>
        <Box
          p={2}
          borderRadius="md"
          bg={`${color}.50`}
          color={`${color}.500`}
        >
          <Icon as={icon} boxSize={6} />
        </Box>
      </Flex>
    </Box>
  );
};

export default MetricsCard;