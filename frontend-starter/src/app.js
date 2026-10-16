// src/App.js
import React from 'react';
import { ChakraProvider, Box } from '@chakra-ui/react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import theme from './theme';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Conversations from './pages/Conversations';
import AgentConfig from './pages/AgentConfig';
import ConversationView from './pages/ConversationView';
import Analysis from './pages/Analysis';
import { WebSocketProvider } from './context/WebSocketContext';
import { AppDataProvider } from './context/AppDataContext';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <WebSocketProvider>
        <AppDataProvider>
          <Router>
            <Box minHeight="100vh">
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/conversations" element={<Conversations />} />
                  <Route path="/conversation/:id" element={<ConversationView />} />
                  <Route path="/agent-config" element={<AgentConfig />} />
                  <Route path="/Analysis" element={<Analysis/>} />
                  <Route path="/templates" element={<Analysis/>} />
                </Routes>
              </Layout>
            </Box>
          </Router>
        </AppDataProvider>
      </WebSocketProvider>
    </ChakraProvider>
  );
}

export default App;


// src/pages/ConversationView.js
// Placeholder - Implement this component with:
// - Chat interface showing messages
// - Intervention controls
// - Customer info sidebar
// - Agent performance metrics

// src/pages/AgentConfig.js
// Placeholder - Implement this component with:
// - Agent selection
// - Parameter adjustments (temperature, etc.)
// - Capability toggles
// - Knowledge base selection

// src/pages/Analysis.js
// Placeholder - Implement this component with:
// - Trend charts
// - Common issue analysis
// - Conversation search and filtering
// - Performance reports