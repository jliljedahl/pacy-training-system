import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Testing API Key...\n');

// Check if API key exists
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ERROR: ANTHROPIC_API_KEY not found in .env file');
  console.log('\n💡 Please add this line to backend/.env:');
  console.log('   ANTHROPIC_API_KEY=your_api_key_here\n');
  process.exit(1);
}

const apiKey = process.env.ANTHROPIC_API_KEY;

// Check if it looks like a valid key
if (!apiKey.startsWith('sk-ant-')) {
  console.warn('⚠️  WARNING: API key does not start with "sk-ant-"');
  console.warn('   This might not be a valid Anthropic API key format\n');
}

console.log('✅ API Key found in .env file');
console.log(`   Key starts with: ${apiKey.substring(0, 10)}...`);
console.log(`   Key length: ${apiKey.length} characters\n`);

// Test the API key with a simple request
console.log('🧪 Testing API connection...\n');

const anthropic = new Anthropic({
  apiKey: apiKey,
  timeout: 30000, // 30 second timeout
});

anthropic.messages
  .create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 10,
    messages: [
      {
        role: 'user',
        content: 'Say "test"',
      },
    ],
  })
  .then((response) => {
    console.log('✅ SUCCESS! API key is working correctly!');
    const textContent = response.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('');
    console.log(`   Response: ${textContent}\n`);
    console.log('🎉 Your API key is valid and ready to use!\n');
    process.exit(0);
  })
  .catch((error: any) => {
    console.error('❌ ERROR: API key test failed\n');

    if (error.status === 401 || error.status === 403) {
      console.error('🔐 Authentication Error:');
      console.error('   Your API key is invalid or expired.');
      console.error('   Please check your API key at: https://console.anthropic.com/\n');
    } else if (error.status === 429) {
      console.error('⏳ Rate Limit Error:');
      console.error('   Too many requests. Wait a moment and try again.\n');
    } else if (error.message?.includes('timeout')) {
      console.error('⏱️  Timeout Error:');
      console.error('   Connection timed out. Check your internet connection.\n');
    } else {
      console.error('Error details:');
      console.error(`   Status: ${error.status || 'Unknown'}`);
      console.error(`   Message: ${error.message || 'Unknown error'}\n`);
    }

    process.exit(1);
  });
