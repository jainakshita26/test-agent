// // src/context/AppDataContext.js
// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { getConversations, getAgents, getKnowledgeBases } from '../api';
// import { useWebSocket } from './WebSocketContext';

// const AppDataContext = createContext(null);

// export const useAppData = () => useContext(AppDataContext);

// export const AppDataProvider = ({ children }) => {
//   const [conversations, setConversations] = useState([]);
//   const [agents, setAgents] = useState([]);
//   const [knowledgeBases, setKnowledgeBases] = useState([]);
//   const [loading, setLoading] = useState({
//     conversations: true,
//     agents: true,
//     knowledgeBases: true,
//   });
//   const [error, setError] = useState({
//     conversations: null,
//     agents: null,
//     knowledgeBases: null,
//   });
  
//   const { lastMessage } = useWebSocket();
  
//   // Load initial data
//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         const conversationsData = await getConversations();
//         setConversations(conversationsData.data || []);
//         setLoading(prev => ({ ...prev, conversations: false }));
//       } catch (err) {
//         console.error('Error loading conversations:', err);
//         setError(prev => ({ ...prev, conversations: err.message }));
//         setLoading(prev => ({ ...prev, conversations: false }));
//       }
      
//       try {
//         const agentsData = await getAgents();
//         setAgents(agentsData || []);
//         setLoading(prev => ({ ...prev, agents: false }));
//       } catch (err) {
//         console.error('Error loading agents:', err);
//         setError(prev => ({ ...prev, agents: err.message }));
//         setLoading(prev => ({ ...prev, agents: false }));
//       }
      
//       try {
//         const knowledgeBasesData = await getKnowledgeBases();
//         setKnowledgeBases(knowledgeBasesData || []);
//         setLoading(prev => ({ ...prev, knowledgeBases: false }));
//       } catch (err) {
//         console.error('Error loading knowledge bases:', err);
//         setError(prev => ({ ...prev, knowledgeBases: err.message }));
//         setLoading(prev => ({ ...prev, knowledgeBases: false }));
//       }
//     };
    
//     loadData();
//   }, []);
  
//   // Handle WebSocket updates
//   useEffect(() => {
//     if (!lastMessage) return;
    
//     try {
//       switch (lastMessage.type) {
//         case 'conversations_update':
//           setConversations(lastMessage.data);
//           break;
          
//         case 'new_conversation':
//           setConversations(prev => [...prev, lastMessage.data]);
//           break;
          
//         case 'message_update':
//           setConversations(prev => 
//             prev.map(conv => {
//               if (conv.id === lastMessage.conversationId) {
//                 // In a real app, you'd need to handle this more carefully
//                 // Here we're just marking that there's a new message
//                 return {
//                   ...conv,
//                   hasNewMessage: true,
//                   lastMessage: lastMessage.message
//                 };
//               }
//               return conv;
//             })
//           );
//           break;
          
//         case 'metrics_update':
//           setConversations(prev => 
//             prev.map(conv => {
//               if (conv.id === lastMessage.conversationId) {
//                 return {
//                   ...conv,
//                   metrics: {
//                     ...conv.metrics,
//                     ...lastMessage.metrics
//                   }
//                 };
//               }
//               return conv;
//             })
//           );
//           break;
          
//         case 'agent_update':
//           setAgents(prev => 
//             prev.map(agent => {
//               if (agent.id === lastMessage.agentId) {
//                 return {
//                   ...agent,
//                   ...lastMessage.data
//                 };
//               }
//               return agent;
//             })
//           );
//           break;
          
//         default:
//           // Ignore other message types
//           break;
//       }
//     } catch (error) {
//       console.error('Error processing WebSocket message:', error);
//     }
//   }, [lastMessage]);
  
//   // Methods for updating data
//   const updateConversation = (id, data) => {
//     setConversations(prev => 
//       prev.map(conv => {
//         if (conv.id === id) {
//           return { ...conv, ...data };
//         }
//         return conv;
//       })
//     );
//   };
  
//   const updateAgent = (id, data) => {
//     setAgents(prev => 
//       prev.map(agent => {
//         if (agent.id === id) {
//           return { ...agent, ...data };
//         }
//         return agent;
//       })
//     );
//   };
  
//   return (
//     <AppDataContext.Provider
//       value={{
//         conversations,
//         agents,
//         knowledgeBases,
//         loading,
//         error,
//         updateConversation,
//         updateAgent,
//       }}
//     >
//       {children}
//     </AppDataContext.Provider>
//   );
// };
// src/context/AppDataContext.js

// src/context/AppDataContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getConversations, getAgents, getKnowledgeBases } from '../api';
import { useWebSocket } from './WebSocketContext';

const AppDataContext = createContext(null);
export const useAppData = () => useContext(AppDataContext);

export const AppDataProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [agents, setAgents] = useState([]);
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState({
    conversations: true,
    agents: true,
    knowledgeBases: true,
  });
  const [error, setError] = useState({
    conversations: null,
    agents: null,
    knowledgeBases: null,
  });

  const { lastMessage } = useWebSocket();

  useEffect(() => {
    const loadData = async () => {
      try {
        const conversationsData = await getConversations();
        setConversations(conversationsData.data || []);
        setLoading(prev => ({ ...prev, conversations: false }));
      } catch (err) {
        console.error('Error loading conversations:', err);
        setError(prev => ({ ...prev, conversations: err.message }));
        setLoading(prev => ({ ...prev, conversations: false }));
      }

      try {
        const agentsData = await getAgents();
        setAgents(agentsData || []);
        setLoading(prev => ({ ...prev, agents: false }));
      } catch (err) {
        console.error('Error loading agents:', err);
        setError(prev => ({ ...prev, agents: err.message }));
        setLoading(prev => ({ ...prev, agents: false }));
      }

      try {
        const knowledgeBasesData = await getKnowledgeBases();
        setKnowledgeBases(knowledgeBasesData || []);
        setLoading(prev => ({ ...prev, knowledgeBases: false }));
      } catch (err) {
        console.error('Error loading knowledge bases:', err);
        setError(prev => ({ ...prev, knowledgeBases: err.message }));
        setLoading(prev => ({ ...prev, knowledgeBases: false }));
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!lastMessage) return;

    try {
      switch (lastMessage.type) {
        case 'conversations_update':
          // Only accept a real list — never let a bad payload wipe state
          if (Array.isArray(lastMessage.data) && lastMessage.data.length > 0) {
            setConversations(lastMessage.data);
          }
          break;

        case 'new_conversation':
          if (lastMessage.data && lastMessage.data.id && lastMessage.data.customer) {
            setConversations((prev) => {
              if (prev.some((c) => c.id === lastMessage.data.id)) return prev;
              return [...prev, lastMessage.data];
            });
          }
          break;

        case 'message_update':
          if (!lastMessage.conversationId || !lastMessage.message) break;
          setConversations((prev) => {
            if (!prev.some((conv) => conv.id === lastMessage.conversationId)) return prev;
            return prev.map((conv) =>
              conv.id === lastMessage.conversationId
                ? {
                    ...conv,
                    hasNewMessage: true,
                    lastMessage: lastMessage.message,
                  }
                : conv
            );
          });
          break;

        case 'metrics_update':
          setConversations(prev =>
            prev.map(conv =>
              conv.id === lastMessage.conversationId
                ? {
                    ...conv,
                    metrics: {
                      ...conv.metrics,
                      ...lastMessage.metrics,
                    },
                  }
                : conv
            )
          );
          break;

        case 'agent_update':
          setAgents(prev =>
            prev.map(agent =>
              agent.id === lastMessage.agentId
                ? { ...agent, ...lastMessage.data }
                : agent
            )
          );
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }, [lastMessage]);

  const updateConversation = (id, data) => {
    setConversations(prev =>
      prev.map(conv => (conv.id === id ? { ...conv, ...data } : conv))
    );
  };

  const updateAgent = (id, data) => {
    setAgents(prev =>
      prev.map(agent => (agent.id === id ? { ...agent, ...data } : agent))
    );
  };

  const interveneInConversation = async (conversationId) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/intervene`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });
      console.log(`Intervened in conversation ${conversationId}`);
    } catch (error) {
      console.error('Failed to intervene:', error);
    }
  };

  return (
    <AppDataContext.Provider
      value={{
        conversations,
        agents,
        knowledgeBases,
        searchTerm,
        setSearchTerm,
        loading,
        error,
        updateConversation,
        updateAgent,
        interveneInConversation,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};
