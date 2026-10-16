// src/theme.js
import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#efebfa',
      100: '#d9cff3',
      200: '#bdaee8',
      300: '#9c86db',
      400: '#775cc9',
      500: '#5b3fb5',
      600: '#4a2e9e',
      700: '#3b237e',
      800: '#2e1b62',
      900: '#211344',
    },
    ink: {
      900: '#1d1b2a',
      600: '#55556a',
      500: '#6f6f84',
      400: '#8f8fa3',
    },
    canvas: '#f4f3f9',
  },
  fonts: {
    heading: `'Inter', sans-serif`,
    body: `'Inter', sans-serif`,
  },
  styles: {
    global: {
      body: {
        bg: 'canvas',
        color: 'ink.900',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: '10px',
      },
    },
  },
  shadows: {
    card: '0 1px 2px rgba(29, 27, 42, 0.05)',
  },
});

export default theme;
