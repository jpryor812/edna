import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import OpenAI from "openai";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In-memory chat history storage (for production, use your database)
const chatHistories: Record<string, Array<{ role: string; content: string }>> = {};

export async function action({ request }: ActionFunctionArgs) {
  // For API endpoints that will be called from the storefront, 
  // we need a different authentication approach
  // We'll use a simple API key check for now
  // You can enhance this with proper verification later
  
  try {
    const data = await request.json();
    const { message } = data;
    
    if (!message) {
      return json({ success: false, error: 'Message is required' }, { status: 400 });
    }
    
    // Use a default shop ID or extract it from headers
    // In production, you should verify this is a valid shop
    const shopId = request.headers.get('x-shopify-shop-id') || 'default';
    
    // Initialize or get existing chat history
    if (!chatHistories[shopId]) {
      chatHistories[shopId] = [];
    }
    
    // Add user message to conversation history
    chatHistories[shopId].push({
      role: 'user',
      content: message
    });
    
    // Prepare the system prompt
    const systemPrompt = {
      role: 'system',
      content: `You are Edna, a helpful and friendly AI shopping assistant.
      Your goal is to help customers find what they're looking for, answer questions about products, 
      provide information about shipping and returns, and generally assist with their shopping experience.
      Keep your responses concise, friendly, and helpful.
      Current date: ${new Date().toLocaleDateString()}`
    };
    
    // Create the messages array
    const messages = [
      systemPrompt,
      ...chatHistories[shopId].slice(-10) // Keep only the last 10 messages
    ];
    
    // Make the API request to OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      max_tokens: 300,
      temperature: 0.7,
    });
    
    // Get the response
    const aiResponse = completion.choices[0].message.content;
    
    // Add AI response to conversation history
    chatHistories[shopId].push({
      role: 'assistant',
      content: aiResponse || 'No response from AI'
    });
    
    // Set CORS headers for access from the storefront
    return json(
      { success: true, response: aiResponse },
      {
        headers: {
            "Access-Control-Allow-Origin": "https://edna-app.myshopify.com",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Credentials": "true"
          }
      }
    );
    
  } catch (error) {
    console.error('Error in OpenAI API request:', error);
    
    return json(
      {
        success: false,
        error: 'Failed to process request',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { 
        status: 500,
        headers: {
            "Access-Control-Allow-Origin": "https://edna-app.myshopify.com",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Credentials": "true"
          }
      }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function loader({ request }: ActionFunctionArgs) {
    const origin = request.headers.get('origin') || 'https://edna-app.myshopify.com';
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": "true"
      }
    });
}