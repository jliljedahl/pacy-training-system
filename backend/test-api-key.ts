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

    // Check for billing/credit errors
    const errorMessage = error.message || error.error?.message || '';
    const isBillingError =
      error.status === 402 ||
      errorMessage.toLowerCase().includes('credit balance') ||
      errorMessage.toLowerCase().includes('billing') ||
      errorMessage.toLowerCase().includes('insufficient funds') ||
      errorMessage.toLowerCase().includes('add funds');

    if (isBillingError) {
      console.error('💳 Billing/Credit Error:');
      console.error('   Your Anthropic account has insufficient credits.');
      console.error(`   Error: ${errorMessage}\n`);
      console.error('💡 Solutions:');
      console.error(
        '   1. Check your account balance: https://console.anthropic.com/settings/billing'
      );
      console.error('   2. Add credits to your account');
      console.error('   3. If you just added credits, wait a few minutes for them to activate');
      console.error("   4. Verify you're using the correct API key for the account with credits\n");
    } else if (error.status === 401 || error.status === 403) {
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
      console.error(`   Message: ${errorMessage || 'Unknown error'}`);
      if (error.error) {
        console.error(`   Error object:`, error.error);
      }
      console.error('');
    }

    process.exit(1);
  });
