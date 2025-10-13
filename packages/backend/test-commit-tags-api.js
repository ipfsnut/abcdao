import express from 'express';
import commitTagRoutes from './src/routes/commit-tags.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/commits', commitTagRoutes);

// Start test server
const PORT = 3333;
const server = app.listen(PORT, () => {
  console.log(`🧪 Test server running on http://localhost:${PORT}`);
  runTests();
});

async function runTests() {
  console.log('\n🧪 Testing commit tags API endpoints...\n');
  
  try {
    // Test 1: Get tags documentation
    console.log('1. Testing GET /api/commits/tags');
    const tagsResponse = await fetch(`http://localhost:${PORT}/api/commits/tags`);
    const tagsData = await tagsResponse.json();
    
    if (tagsData.status === 'success') {
      console.log('✅ Tags documentation endpoint working');
      console.log(`   Found ${Object.keys(tagsData.tags).length} supported tags`);
    } else {
      console.log('❌ Tags documentation failed');
    }
    
    // Test 2: Parse commit message
    console.log('\n2. Testing POST /api/commits/parse');
    const parseResponse = await fetch(`http://localhost:${PORT}/api/commits/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: 'feat: awesome feature #milestone #silent' 
      })
    });
    const parseData = await parseResponse.json();
    
    if (parseData.status === 'success') {
      console.log('✅ Commit message parsing working');
      console.log(`   Parsed tags: ${parseData.parsed.tags.join(', ')}`);
      console.log(`   Should cast: ${parseData.parsed.shouldCast}`);
      console.log(`   Priority: ${parseData.parsed.priority}`);
    } else {
      console.log('❌ Commit message parsing failed');
    }
    
    // Test 3: Error handling
    console.log('\n3. Testing error handling');
    const errorResponse = await fetch(`http://localhost:${PORT}/api/commits/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // Missing message
    });
    const errorData = await errorResponse.json();
    
    if (errorData.status === 'error' && errorData.message.includes('required')) {
      console.log('✅ Error handling working');
    } else {
      console.log('❌ Error handling failed');
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    server.close();
    process.exit(0);
  }
}

// Handle cleanup
process.on('SIGINT', () => {
  server.close();
  process.exit(0);
});