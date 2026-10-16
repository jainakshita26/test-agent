// test-runner.js - Automated test script for candidates to validate their implementation

const axios = require('axios');
const WebSocket = require('ws');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer');
const fs = require('fs');
const chalk = require('chalk');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:8080';
const WS_URL = process.env.WS_URL || 'ws://localhost:8080';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const SCREENSHOT_DIR = './test-screenshots';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)){
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Test suite
const tests = {
  api: [
    {
      name: 'Fetch conversations',
      run: async () => {
        const response = await axios.get(`${API_URL}/api/conversations`);
        if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
          throw new Error('Invalid response format for conversations');
        }
        if (response.data.data.length === 0) {
          console.warn(chalk.yellow('Warning: No conversations returned'));
        }
        return { success: true, data: response.data };
      }
    },
    {
      name: 'Fetch agents',
      run: async () => {
        const response = await axios.get(`${API_URL}/api/agents`);
        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('Invalid response format for agents');
        }
        if (response.data.length === 0) {
          console.warn(chalk.yellow('Warning: No agents returned'));
        }
        return { success: true, data: response.data };
      }
    },
    {
      name: 'Fetch single conversation',
      run: async () => {
        // First get a conversation ID
        const response = await axios.get(`${API_URL}/api/conversations`);
        if (!response.data || !response.data.data || !Array.isArray(response.data.data) || response.data.data.length === 0) {
          throw new Error('No conversations available for testing');
        }

        const conversationId = response.data.data[0].id;
        const detailResponse = await axios.get(`${API_URL}/api/conversations/${conversationId}`);
        
        if (!detailResponse.data || !detailResponse.data.id) {
          throw new Error('Invalid response for single conversation');
        }
        
        return { success: true, data: detailResponse.data };
      }
    },
    {
      name: 'Add message to conversation',
      run: async () => {
        // First get a conversation ID
        const response = await axios.get(`${API_URL}/api/conversations`);
        if (!response.data || !response.data.data || !Array.isArray(response.data.data) || response.data.data.length === 0) {
          throw new Error('No conversations available for testing');
        }

        const conversationId = response.data.data[0].id;
        const messageResponse = await axios.post(`${API_URL}/api/conversations/${conversationId}/messages`, {
          sender: 'supervisor',
          text: 'This is a test message from the automated test suite'
        });
        
        if (!messageResponse.data || !messageResponse.data.text) {
          throw new Error('Invalid response for message creation');
        }
        
        return { success: true, data: messageResponse.data };
      }
    },
    {
      name: 'Update agent configuration',
      run: async () => {
        // First get an agent ID
        const response = await axios.get(`${API_URL}/api/agents`);
        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
          throw new Error('No agents available for testing');
        }

        const agentId = response.data[0].id;
        const updateResponse = await axios.patch(`${API_URL}/api/agents/${agentId}/config`, {
          parameters: {
            temperature: 0.5
          }
        });
        
        if (!updateResponse.data || !updateResponse.data.message) {
          throw new Error('Invalid response for agent configuration update');
        }
        
        return { success: true, data: updateResponse.data };
      }
    },
    {
      name: 'Intervene in conversation',
      run: async () => {
        // First get a conversation ID
        const response = await axios.get(`${API_URL}/api/conversations`);
        if (!response.data || !response.data.data || !Array.isArray(response.data.data) || response.data.data.length === 0) {
          throw new Error('No conversations available for testing');
        }

        const conversationId = response.data.data[0].id;
        const interveneResponse = await axios.post(`${API_URL}/api/intervene`, {
          conversationId,
          supervisorId: 'supervisor-001',
          notes: 'Testing intervention from automated test suite'
        });
        
        if (!interveneResponse.data || !interveneResponse.data.message) {
          throw new Error('Invalid response for intervention');
        }
        
        return { success: true, data: interveneResponse.data };
      }
    },
    {
      name: 'Release intervention',
      run: async () => {
        // First get a conversation ID
        const response = await axios.get(`${API_URL}/api/conversations`);
        if (!response.data || !response.data.data || !Array.isArray(response.data.data) || response.data.data.length === 0) {
          throw new Error('No conversations available for testing');
        }

        const conversationId = response.data.data[0].id;
        
        // First intervene
        await axios.post(`${API_URL}/api/intervene`, {
          conversationId,
          supervisorId: 'supervisor-001',
          notes: 'Testing intervention from automated test suite'
        });
        
        // Then release
        const releaseResponse = await axios.post(`${API_URL}/api/intervene/release`, {
          conversationId,
          supervisorNotes: 'Testing release from automated test suite'
        });
        
        if (!releaseResponse.data || !releaseResponse.data.message) {
          throw new Error('Invalid response for intervention release');
        }
        
        return { success: true, data: releaseResponse.data };
      }
    },
    // Optional: Test template endpoints if implemented
    {
      name: 'Template APIs (only after twist)',
      optional: true,
      run: async () => {
        try {
          // Create a template
          const createResponse = await axios.post(`${API_URL}/api/templates`, {
            name: 'Test Template',
            category: 'test',
            content: 'This is a test template with {{variable}}',
            variables: [
              { name: 'variable', description: 'Test variable' }
            ],
            isShared: false
          });
          
          if (!createResponse.data || !createResponse.data.id) {
            throw new Error('Invalid response for template creation');
          }
          
          const templateId = createResponse.data.id;
          
          // Get all templates
          const listResponse = await axios.get(`${API_URL}/api/templates`);
          if (!listResponse.data || !Array.isArray(listResponse.data)) {
            throw new Error('Invalid response for template listing');
          }
          
          // Get specific template
          const getResponse = await axios.get(`${API_URL}/api/templates/${templateId}`);
          if (!getResponse.data || !getResponse.data.id) {
            throw new Error('Invalid response for template retrieval');
          }
          
          // Update template
          const updateResponse = await axios.patch(`${API_URL}/api/templates/${templateId}`, {
            name: 'Updated Test Template'
          });
          
          if (!updateResponse.data || !updateResponse.data.id) {
            throw new Error('Invalid response for template update');
          }
          
          // Delete template
          const deleteResponse = await axios.delete(`${API_URL}/api/templates/${templateId}`);
          if (!deleteResponse.data || !deleteResponse.data.message) {
            throw new Error('Invalid response for template deletion');
          }
          
          return { success: true, message: 'All template endpoints working' };
        } catch (error) {
          if (error.response && error.response.status === 404) {
            return { success: false, message: 'Template endpoints not implemented yet (expected before twist)' };
          }
          throw error;
        }
      }
    }
  ],
  websocket: [
    {
      name: 'WebSocket connection',
      run: async () => {
        return new Promise((resolve, reject) => {
          const ws = new WebSocket(WS_URL);
          
          const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('WebSocket connection timeout'));
          }, 5000);
          
          ws.on('open', () => {
            clearTimeout(timeout);
            resolve({ success: true, message: 'WebSocket connection established' });
            ws.close();
          });
          
          ws.on('error', (error) => {
            clearTimeout(timeout);
            reject(new Error(`WebSocket connection error: ${error.message}`));
          });
        });
      }
    },
    {
      name: 'WebSocket message handling',
      run: async () => {
        return new Promise((resolve, reject) => {
          const ws = new WebSocket(WS_URL);
          
          const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('WebSocket message timeout'));
          }, 8000);
          
          ws.on('open', () => {
            // Success will be determined when we receive a message
          });
          
          ws.on('message', (data) => {
            try {
              const message = JSON.parse(data);
              
              if (message.type) {
                clearTimeout(timeout);
                resolve({ success: true, data: message });
                ws.close();
              }
            } catch (error) {
              clearTimeout(timeout);
              reject(new Error(`WebSocket message parsing error: ${error.message}`));
              ws.close();
            }
          });
          
          ws.on('error', (error) => {
            clearTimeout(timeout);
            reject(new Error(`WebSocket error: ${error.message}`));
          });
        });
      }
    }
  ],
  ui: [
    {
      name: 'UI - Dashboard loads',
      run: async () => {
        const browser = await puppeteer.launch({ headless: true });
        try {
          const page = await browser.newPage();
          await page.goto(FRONTEND_URL, { waitUntil: 'networkidle0', timeout: 10000 });
          
          // Take screenshot
          await page.screenshot({ path: `${SCREENSHOT_DIR}/dashboard.png` });
          
          // Check if key elements exist
          const hasTitle = await page.evaluate(() => {
            const heading = document.querySelector('h1, h2, h3');
            return heading && heading.innerText.toLowerCase().includes('dashboard');
          });
          
          const hasConversationList = await page.evaluate(() => {
            return !!document.querySelector('table, [role="table"], [data-testid="conversation-list"]');
          });
          
          if (!hasTitle && !hasConversationList) {
            return { success: false, message: 'Dashboard missing key elements' };
          }
          
          return { success: true, message: 'Dashboard loaded successfully' };
        } finally {
          await browser.close();
        }
      }
    },
    {
      name: 'UI - Conversation detail loads',
      run: async () => {
        const browser = await puppeteer.launch({ headless: true });
        try {
          // First get conversation ID from API
          const response = await axios.get(`${API_URL}/api/conversations`);
          if (!response.data || !response.data.data || !Array.isArray(response.data.data) || response.data.data.length === 0) {
            throw new Error('No conversations available for testing');
          }
          
          const conversationId = response.data.data[0].id;
          
          const page = await browser.newPage();
          await page.goto(`${FRONTEND_URL}/conversation/${conversationId}`, { waitUntil: 'networkidle0', timeout: 10000 });
          
          // Take screenshot
          await page.screenshot({ path: `${SCREENSHOT_DIR}/conversation-detail.png` });
          
          // Check if message list exists
          const hasMessageList = await page.evaluate(() => {
            return !!document.querySelector('[data-testid="message-list"], .message-list, .conversation-messages');
          });
          
          // Check if intervention button exists
          const hasInterveneButton = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.some(button => 
              button.innerText.toLowerCase().includes('intervene') || 
              button.innerText.toLowerCase().includes('take over')
            );
          });
          
          if (!hasMessageList) {
            return { success: false, message: 'Conversation detail missing message list' };
          }
          
          return { 
            success: true, 
            message: `Conversation detail loaded successfully. Intervene button ${hasInterveneButton ? 'found' : 'not found'}` 
          };
        } finally {
          await browser.close();
        }
      }
    },
    {
      name: 'UI - Agent configuration loads',
      run: async () => {
        const browser = await puppeteer.launch({ headless: true });
        try {
          const page = await browser.newPage();
          await page.goto(`${FRONTEND_URL}/agent-config`, { waitUntil: 'networkidle0', timeout: 10000 });
          
          // Take screenshot
          await page.screenshot({ path: `${SCREENSHOT_DIR}/agent-config.png` });
          
          // Check if form elements exist
          const hasConfigForm = await page.evaluate(() => {
            return !!document.querySelector('form, [role="form"], [data-testid="agent-config-form"]');
          });
          
          const hasAgentSelection = await page.evaluate(() => {
            return !!document.querySelector('select, [role="combobox"], [data-testid="agent-selector"]');
          });
          
          if (!hasConfigForm && !hasAgentSelection) {
            return { success: false, message: 'Agent configuration missing key elements' };
          }
          
          return { success: true, message: 'Agent configuration loaded successfully' };
        } finally {
          await browser.close();
        }
      }
    },
    {
      name: 'UI - Response templates (after twist)',
      optional: true,
      run: async () => {
        const browser = await puppeteer.launch({ headless: true });
        try {
          // First get conversation ID from API
          const response = await axios.get(`${API_URL}/api/conversations`);
          if (!response.data || !response.data.data || !Array.isArray(response.data.data) || response.data.data.length === 0) {
            throw new Error('No conversations available for testing');
          }
          
          const conversationId = response.data.data[0].id;
          
          const page = await browser.newPage();
          await page.goto(`${FRONTEND_URL}/conversation/${conversationId}`, { waitUntil: 'networkidle0', timeout: 10000 });
          
          // Look for template button or link
          const hasTemplatesButton = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, a'));
            return buttons.some(element => 
              element.innerText.toLowerCase().includes('template') || 
              element.getAttribute('title')?.toLowerCase().includes('template') ||
              element.getAttribute('aria-label')?.toLowerCase().includes('template')
            );
          });
          
          // Take screenshot
          await page.screenshot({ path: `${SCREENSHOT_DIR}/templates-ui.png` });
          
          if (!hasTemplatesButton) {
            return { success: false, message: 'Templates UI not found (expected after twist)' };
          }
          
          // Try to click the button to see if template interface opens
          try {
            await page.evaluate(() => {
              const buttons = Array.from(document.querySelectorAll('button, a'));
              const templateButton = buttons.find(element => 
                element.innerText.toLowerCase().includes('template') || 
                element.getAttribute('title')?.toLowerCase().includes('template') ||
                element.getAttribute('aria-label')?.toLowerCase().includes('template')
              );
              
              if (templateButton) templateButton.click();
            });
            
            // Wait a bit for any modal or dropdown to appear
            await page.waitForTimeout(1000);
            
            // Take another screenshot
            await page.screenshot({ path: `${SCREENSHOT_DIR}/templates-ui-open.png` });
            
            return { success: true, message: 'Templates UI found and clicked' };
          } catch (error) {
            return { success: true, message: 'Templates UI found but interaction failed' };
          }
        } finally {
          await browser.close();
        }
      }
    }
  ]
};

// Helper function to run tests
async function runTests() {
  console.log(chalk.blue.bold('\n=== AI Agent Supervisor Workstation Automated Tests ===\n'));
  
  // Check if services are running
  try {
    console.log(chalk.blue('Checking services...'));
    
    const backendCheck = await axios.get(`${API_URL}/health`).catch(() => null);
    if (!backendCheck) {
      console.error(chalk.red('❌ Backend service is not running or health endpoint not available'));
      console.log(chalk.yellow('Make sure your backend server is running at ' + API_URL));
      process.exit(1);
    }
    console.log(chalk.green('✓ Backend service is running'));
    
    try {
      await axios.get(FRONTEND_URL, { timeout: 5000 });
      console.log(chalk.green('✓ Frontend service is running'));
    } catch (error) {
      console.error(chalk.red('❌ Frontend service is not running or not accessible'));
      console.log(chalk.yellow('Make sure your frontend application is running at ' + FRONTEND_URL));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('Error checking services:'), error.message);
    process.exit(1);
  }
  
  // Run API tests
  console.log(chalk.blue.bold('\nRunning API tests...'));
  await runTestGroup(tests.api);
  
  // Run WebSocket tests
  console.log(chalk.blue.bold('\nRunning WebSocket tests...'));
  await runTestGroup(tests.websocket);
  
  // Run UI tests
  console.log(chalk.blue.bold('\nRunning UI tests...'));
  await runTestGroup(tests.ui);
  
  console.log(chalk.blue.bold('\n=== Test Summary ===\n'));
  console.log(chalk.green(`✓ Passed: ${testResults.passed}`));
  console.log(chalk.red(`❌ Failed: ${testResults.failed}`));
  console.log(chalk.yellow(`⚠ Skipped: ${testResults.skipped}`));
  
  if (testResults.failed > 0) {
    console.log(chalk.red.bold('\nSome tests failed. Please review the test output for details.'));
  } else {
    console.log(chalk.green.bold('\nAll tests passed!'));
  }
  
  console.log(chalk.blue('\nUI screenshots saved to:'), SCREENSHOT_DIR);
}

// Track test results
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0
};

// Helper function to run a group of tests
async function runTestGroup(testGroup) {
  for (const test of testGroup) {
    try {
      if (test.optional) {
        console.log(chalk.yellow(`⚠ Running optional test: ${test.name}...`));
      } else {
        console.log(chalk.blue(`Running test: ${test.name}...`));
      }
      
      const result = await test.run();
      
      if (result.success) {
        console.log(chalk.green(`✓ ${test.name}: Passed`));
        if (result.message) {
          console.log(chalk.green(`  ${result.message}`));
        }
        testResults.passed++;
      } else {
        if (test.optional) {
          console.log(chalk.yellow(`⚠ ${test.name}: ${result.message || 'Optional test not implemented yet'}`));
          testResults.skipped++;
        } else {
          console.log(chalk.red(`❌ ${test.name}: Failed`));
          if (result.message) {
            console.log(chalk.red(`  ${result.message}`));
          }
          testResults.failed++;
        }
      }
    } catch (error) {
      if (test.optional) {
        console.log(chalk.yellow(`⚠ ${test.name}: Skipped (${error.message})`));
        testResults.skipped++;
      } else {
        console.log(chalk.red(`❌ ${test.name}: Error`));
        console.log(chalk.red(`  ${error.message}`));
        testResults.failed++;
      }
    }
    
    console.log(''); // Add a newline for readability
  }
}

// Run the tests
runTests().catch(error => {
  console.error(chalk.red('Test runner error:'), error);
  process.exit(1);
});
