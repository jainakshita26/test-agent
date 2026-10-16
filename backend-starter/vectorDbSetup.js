// vectorDbSetup.js - Setup script for the Qdrant vector database

const { QdrantClient } = require('@qdrant/js-client-rest');
const fs = require('fs');
const path = require('path');
const { encode } = require('gpt-3-encoder');

// Initialize Qdrant client
const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
const client = new QdrantClient({ url: qdrantUrl });

// Collection configuration
const COLLECTION_NAME = 'knowledge_base';
const VECTOR_SIZE = 1536; // OpenAI Ada embedding size

// Main setup function
async function setupVectorDb() {
  console.log('Setting up Qdrant vector database...');
  
  try {
    // Check if collection exists
    const collections = await client.getCollections();
    const collectionExists = collections.collections.some(c => c.name === COLLECTION_NAME);
    
    if (collectionExists) {
      console.log(`Collection '${COLLECTION_NAME}' already exists.`);
      
      // Optionally recreate the collection
      if (process.env.RECREATE_COLLECTION === 'true') {
        console.log(`Recreating collection '${COLLECTION_NAME}'...`);
        await client.deleteCollection(COLLECTION_NAME);
        await createCollection();
      }
    } else {
      await createCollection();
    }
    
    // Load and index knowledge base documents
    await indexKnowledgeBase();
    
    console.log('Vector database setup complete!');
  } catch (error) {
    console.error('Error setting up vector database:', error);
    process.exit(1);
  }
}

// Create collection with appropriate schema
async function createCollection() {
  try {
    await client.createCollection(COLLECTION_NAME, {
      vectors: {
        size: VECTOR_SIZE,
        distance: 'Cosine',
      },
      optimizers_config: {
        default_segment_number: 2,
      },
      replication_factor: 1,
      write_consistency_factor: 1,
      on_disk_payload: true,
    });
    
    // Create necessary field indices for filtering
    await client.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'knowledge_base_id',
      field_schema: 'keyword',
      wait: true,
    });
    
    await client.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'document_type',
      field_schema: 'keyword',
      wait: true,
    });
    
    await client.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'section_path',
      field_schema: 'keyword',
      wait: true,
    });
    
    console.log(`Collection '${COLLECTION_NAME}' created successfully.`);
  } catch (error) {
    console.error('Error creating collection:', error);
    throw error;
  }
}

// Index knowledge base documents
async function indexKnowledgeBase() {
  const knowledgeBasePath = path.join(__dirname, '../data/knowledge_base');
  
  // Ensure directory exists
  if (!fs.existsSync(knowledgeBasePath)) {
    console.log(`Creating knowledge base directory: ${knowledgeBasePath}`);
    fs.mkdirSync(knowledgeBasePath, { recursive: true });
    
    // Create sample knowledge base files
    await createSampleKnowledgeBaseFiles(knowledgeBasePath);
  }
  
  const files = fs.readdirSync(knowledgeBasePath)
    .filter(file => file.endsWith('.md'));
  
  console.log(`Found ${files.length} knowledge base documents to index.`);
  
  for (const file of files) {
    const filePath = path.join(knowledgeBasePath, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Parse knowledge base ID from filename
    const kbId = file.replace('.md', '');
    
    console.log(`Indexing ${kbId}...`);
    
    // Process and chunk the document
    const chunks = chunkDocument(content, kbId);
    console.log(`Created ${chunks.length} chunks for ${kbId}`);
    
    // Generate mock embeddings and index chunks
    const points = chunks.map((chunk, index) => ({
      id: `${kbId}-${index}`,
      vector: generateMockEmbedding(chunk.text),
      payload: {
        text: chunk.text,
        knowledge_base_id: kbId,
        document_type: 'markdown',
        section_path: chunk.section,
        chunk_index: index,
      }
    }));
    
    // Upsert points in batches of 100
    const batchSize = 100;
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);
      await client.upsert(COLLECTION_NAME, {
        wait: true,
        points: batch,
      });
      console.log(`Indexed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(points.length / batchSize)}`);
    }
    
    console.log(`Indexed ${points.length} chunks for ${kbId}`);
  }
}

// Create sample knowledge base files if they don't exist
async function createSampleKnowledgeBaseFiles(knowledgeBasePath) {
  // Sample knowledge base files
  const samples = [
    {
      id: 'kb-cs-general',
      filename: 'kb-cs-general.md',
      content: `# Customer Service Guidelines

## Core Principles

### 1. Customer-First Approach
Always prioritize the customer's needs and concerns. Every interaction should demonstrate that we value their business and are committed to their satisfaction.

### 2. Empathy in Every Interaction
Acknowledge the customer's feelings and perspective. Use phrases like "I understand your frustration" or "I can see why this is important to you" to show empathy.

### 3. Solution-Oriented Communication
Focus on what can be done rather than what cannot. When facing limitations, always offer alternatives or next steps.

### 4. Ownership and Accountability
Take responsibility for resolving the customer's issue, even if it requires collaboration with other departments. Avoid transferring customers between representatives whenever possible.

## Communication Standards

### Greeting and Introduction
- Begin with a warm greeting: "Hello [Customer Name], thank you for contacting RetailPlus."
- Introduce yourself: "My name is [Agent Name], and I'm here to assist you today."
- Set positive expectations: "I'll do my best to address your concerns/questions."

### Active Listening
- Demonstrate understanding by summarizing the customer's concern.
- Ask clarifying questions when needed.
- Avoid interrupting the customer while they are explaining their issue.

### Response Formulation
- Use clear, jargon-free language.
- Structure responses logically with a beginning, middle, and end.
- For complex issues, break down information into digestible segments.
- Match the customer's communication style where appropriate.

### Closing Interactions
- Summarize the actions taken and next steps.
- Ask if there are any other questions or concerns.
- Thank the customer for their business and patience.
- Invite feedback on the service provided.

## Issue Handling Protocols

### Shipping and Delivery Issues
**Priority Level: High**

#### Delayed Shipments
1. Verify the current status using order number.
2. Explain the cause of delay if known.
3. Provide an updated estimated delivery date.
4. For delays exceeding 3 business days beyond the original estimate:
   - Offer 10% refund on shipping costs
   - Provide expedited shipping on next order

#### Lost Packages
1. Initiate lost package investigation protocol.
2. Inform customer of the 3-5 business day investigation period.
3. Set up automatic notifications for investigation updates.
4. If package is confirmed lost:
   - Offer immediate replacement with expedited shipping
   - Or process full refund including shipping costs

#### Damaged Items
1. Request photos of the damaged item and packaging.
2. Process immediate replacement or refund without requiring return for damages under $50.
3. For items over $50, provide prepaid return label.
4. Add courtesy discount of 15% on next purchase.`
    },
    {
      id: 'kb-return-policy',
      filename: 'kb-return-policy.md',
      content: `# Return Policy

## General Return Policy

### Standard Return Window
- **Non-Electronics**: 30 days from delivery date
- **Electronics**: 15 days from delivery date
- **Seasonal Items**: 14 days from delivery date
- **Luxury Items**: 10 days from delivery date

### Return Condition Requirements
Items must be returned in their original condition to qualify for a full refund:
- Unused and unworn
- All original tags and packaging intact
- All accessories and free gifts included
- No signs of wear, damage, or alteration
- No pet hair, smoke, or strong odors

### Return Methods
Customers can return items through the following methods:
1. **In-Store Returns**: Available at any RetailPlus location
2. **Mail-In Returns**: Using our prepaid return label
3. **Third-Party Drop-Off**: Available at partner locations (fees may apply)
4. **Scheduled Pickup**: Available for large items (fees may apply)

### Refund Methods
- **Original Payment Method**: Standard processing time 3-5 business days after return is received
- **Store Credit**: Instantly available upon return approval
- **Gift Returns**: Issued as store credit only

### Return Shipping Fees
- **Standard Returns**: $5.95 deducted from refund amount
- **Premium and Loyalty Members**: Free return shipping
- **Defective or Incorrect Items**: Free return shipping
- **Large Items (Over 50 lbs)**: $29.95 return shipping fee`
    },
    {
      id: 'kb-product-catalog',
      filename: 'kb-product-catalog.md',
      content: `# Product Catalog

## Kitchen Appliances

### Blenders

#### Eco-Friendly Blender
- **Price**: $129.99
- **Brand**: GreenLife
- **Model**: GL-B1200
- **Features**:
  - 1200-watt motor
  - 5 variable speeds + pulse function
  - 64oz BPA-free container
  - Stainless steel blades
  - Pre-programmed settings for smoothies, soups, and crushing ice
  - Dishwasher-safe components
- **Warranty**: 2-year manufacturer warranty
- **Dimensions**: 8" x 9" x 17"
- **Weight**: 7.5 lbs
- **Colors Available**: White, Black, Red, Green
- **Energy Rating**: A+
- **Included Accessories**: Tamper tool, recipe book

#### Professional Chef Blender
- **Price**: $299.99
- **Brand**: KitchenPro
- **Model**: KP-B2000
- **Features**:
  - 2000-watt commercial-grade motor
  - 10 speed settings with turbo boost
  - 72oz shatterproof container
  - Laser-cut stainless steel blades
  - Noise reduction technology
  - Digital timer display
  - Self-cleaning cycle
- **Warranty**: 7-year manufacturer warranty
- **Dimensions**: 9" x 11" x 18"
- **Weight**: 12 lbs
- **Colors Available**: Stainless Steel, Black
- **Energy Rating**: A
- **Included Accessories**: Tamper tool, mini-grinding jar, recipe book, spatula

## Smart Home

### Security

#### Smart Home Security System
- **Price**: $349.99
- **Brand**: SecureConnect
- **Model**: SC-SSK1
- **Components Included**:
  - 1 base station
  - 2 motion sensors
  - 3 contact sensors
  - 1 keypad
  - 1 range extender
- **Features**:
  - No monthly subscription required
  - 24/7 monitoring optional ($15/month)
  - Battery backup (up to 24 hours)
  - Mobile app control
  - Real-time alerts and notifications
  - Easy DIY installation
  - Compatible with Alexa, Google Assistant, and Apple HomeKit
- **Connectivity**: Wi-Fi (2.4GHz), Bluetooth 5.0, Z-Wave
- **Warranty**: 3-year manufacturer warranty
- **Power Source**: AC with battery backup
- **Storage**: Local and cloud options available`
    },
    {
      id: 'kb-shipping-policy',
      filename: 'kb-shipping-policy.md',
      content: `# Shipping Policy

## Standard Shipping Times

- **Domestic (US)**: 3-5 business days
- **Canada**: 5-7 business days
- **International**: 7-14 business days

## Shipping Options

### Standard Shipping
- **Cost**: 
  - Orders under $35: $5.95
  - Orders $35-$75: $8.95
  - Orders over $75: Free
- **Delivery Time**: 3-5 business days
- **Tracking**: Yes
- **Insurance**: Up to $100 included

### Expedited Shipping
- **Cost**: $12.95 (free for orders over $150)
- **Delivery Time**: 2 business days
- **Tracking**: Yes
- **Insurance**: Up to $500 included

### Next-Day Shipping
- **Cost**: $24.95
- **Order By**: 2pm EST for next-day delivery
- **Delivery Time**: Next business day (excluding weekends and holidays)
- **Tracking**: Yes
- **Insurance**: Up to $1000 included

## Shipping Restrictions

### Location Restrictions
- We ship to all 50 US states, US territories, and over 200 countries worldwide.
- Some products cannot be shipped to international destinations due to local regulations.
- APO/FPO addresses may experience longer delivery times.

### Product Restrictions
- Hazardous materials (aerosols, perfumes, nail polish) cannot be shipped internationally or by air.
- Oversized items may incur additional shipping charges.
- Perishable items are only shipped Monday-Wednesday to avoid weekend transit.

## Order Processing

- Orders placed before 2pm EST on business days typically ship the same day.
- Orders placed after 2pm EST or on weekends/holidays ship the next business day.
- Order processing may take 1-2 additional business days during peak seasons (holidays, special promotions).

## Tracking Your Order

- Tracking information is emailed once your order ships.
- You can also track your order by:
  - Logging into your account
  - Using the order tracking page with your order number
  - Contacting customer service

## Shipping Delays

- Severe weather conditions may cause unavoidable delays.
- Incorrect or incomplete address information may result in delivery delays or returned packages.
- International orders may experience additional delays due to customs processing.
- During peak seasons (holidays), shipping carriers may experience higher volumes resulting in occasional delays.

## Failed Delivery Attempts

- For packages requiring signature, three delivery attempts will be made.
- After three failed attempts, packages will be held at the local carrier facility for pickup.
- Packages held for pickup are typically available for 5-7 business days before being returned to us.

## Lost or Damaged Packages

- If tracking shows your package as delivered but you haven't received it, contact us within 7 days.
- For visibly damaged packages, please refuse delivery or note damage when signing.
- Take photos of damaged items and packaging for claims processing.
- We'll replace damaged items or issue a refund once the claim is verified (typically within 5 business days).`
    }
  ];
  
  for (const sample of samples) {
    const filePath = path.join(knowledgeBasePath, sample.filename);
    fs.writeFileSync(filePath, sample.content);
    console.log(`Created sample knowledge base file: ${sample.filename}`);
  }
}

// Split document into chunks for vector storage
function chunkDocument(content, kbId) {
  const chunks = [];
  
  // Split by section headers
  const sections = [];
  let currentSection = '';
  let currentText = '';
  let currentPath = '';
  
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect headers
    if (line.startsWith('# ')) {
      // Save previous section if exists
      if (currentText.trim() !== '') {
        sections.push({
          path: currentPath,
          text: currentText.trim()
        });
      }
      
      // Start new top-level section
      currentPath = line.replace('# ', '').trim();
      currentSection = currentPath;
      currentText = line + '\n';
    } else if (line.startsWith('## ')) {
      // Save previous section if exists
      if (currentText.trim() !== '') {
        sections.push({
          path: currentPath,
          text: currentText.trim()
        });
      }
      
      // Start new second-level section
      const sectionName = line.replace('## ', '').trim();
      currentPath = `${currentSection} > ${sectionName}`;
      currentText = line + '\n';
    } else if (line.startsWith('### ')) {
      // Save previous section if exists
      if (currentText.trim() !== '') {
        sections.push({
          path: currentPath,
          text: currentText.trim()
        });
      }
      
      // Start new third-level section
      const parentParts = currentPath.split(' > ');
      const parent = parentParts.length > 1 ? parentParts[0] : currentSection;
      const subParent = parentParts.length > 1 ? parentParts[1] : '';
      const sectionName = line.replace('### ', '').trim();
      
      currentPath = subParent ? 
        `${parent} > ${subParent} > ${sectionName}` : 
        `${parent} > ${sectionName}`;
      
      currentText = line + '\n';
    } else if (line.startsWith('#### ')) {
      // Save previous section if exists
      if (currentText.trim() !== '') {
        sections.push({
          path: currentPath,
          text: currentText.trim()
        });
      }
      
      // Start new fourth-level section
      const pathParts = currentPath.split(' > ');
      const parent = pathParts[0];
      const subParent = pathParts.length > 1 ? pathParts[1] : '';
      const subSubParent = pathParts.length > 2 ? pathParts[2] : '';
      const sectionName = line.replace('#### ', '').trim();
      
      if (subSubParent) {
        currentPath = `${parent} > ${subParent} > ${subSubParent} > ${sectionName}`;
      } else if (subParent) {
        currentPath = `${parent} > ${subParent} > ${sectionName}`;
      } else {
        currentPath = `${parent} > ${sectionName}`;
      }
      
      currentText = line + '\n';
    } else {
      // Add line to current section
      currentText += line + '\n';
    }
  }
  
  // Add the last section
  if (currentText.trim() !== '') {
    sections.push({
      path: currentPath,
      text: currentText.trim()
    });
  }
  
  // Process sections into appropriate chunks
  for (const section of sections) {
    const text = section.text;
    
    // Skip very short sections
    if (text.length < 50) continue;
    
    // For longer sections, we need to chunk them
    if (text.length > 1000) {
      // Split into paragraphs
      const paragraphs = text.split('\n\n');
      
      let currentChunk = '';
      for (const paragraph of paragraphs) {
        // Skip empty paragraphs
        if (paragraph.trim() === '') continue;
        
        // If adding this paragraph would make the chunk too long, save chunk and start new one
        if (currentChunk.length + paragraph.length > 1000) {
          if (currentChunk !== '') {
            chunks.push({
              section: section.path,
              text: currentChunk.trim()
            });
          }
          currentChunk = paragraph + '\n\n';
        } else {
          currentChunk += paragraph + '\n\n';
        }
      }
      
      // Save the last chunk
      if (currentChunk !== '') {
        chunks.push({
          section: section.path,
          text: currentChunk.trim()
        });
      }
    } else {
      // Section is a good size already
      chunks.push({
        section: section.path,
        text: text
      });
    }
  }
  
  return chunks;
}

// Generate a mock embedding vector
function generateMockEmbedding(text) {
  // This is a simplified mock that creates deterministic but semi-realistic embeddings
  // In a real implementation, we would use OpenAI's embedding API or similar
  
  // Get tokens and create a hash-like value for each token
  const tokens = tokenize(text);
  const tokenValues = tokens.map(token => {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = ((hash << 5) - hash) + token.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  });
  
  // Create a normalized vector of length VECTOR_SIZE
  const vector = new Array(VECTOR_SIZE).fill(0);
  
  // Fill vector with values based on token hashes
  for (let i = 0; i < tokenValues.length; i++) {
    const hash = tokenValues[i];
    const idx = Math.abs(hash) % VECTOR_SIZE;
    vector[idx] = Math.sin(hash) * 0.5 + 0.5; // Value between 0 and 1
  }
  
  // Normalize vector (L2 norm)
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => val / magnitude);
}

// Tokenize text (simplified version)
function tokenize(text) {
  // Use GPT tokenizer for more realistic tokenization
  try {
    return encode(text);
  } catch (error) {
    // Fallback to simple tokenization if GPT tokenizer fails
    console.warn('GPT tokenizer failed, using simple tokenization');
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupVectorDb().catch(console.error);
}

module.exports = { setupVectorDb };
