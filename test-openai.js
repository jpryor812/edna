// test-openai.js
import axios from 'axios';
// Replace with your actual API key
const OPENAI_API_KEY = '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';

async function testOpenAI() {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini', // Using a standard model that definitely exists
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say hello world!' }
        ],
        max_tokens: 50
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('API Response:');
    console.log(response.data);
    console.log('API key is working! ✅');
  } catch (error) {
    console.error('Error testing OpenAI API:');
    console.error(error.response?.data || error.message);
    console.error('Status code:', error.response?.status);
    console.error('API key is NOT working ❌');
  }
}

testOpenAI();