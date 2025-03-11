import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import OpenAI from "openai";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function action({ request }: ActionFunctionArgs) {
  try {
    const data = await request.json();
    const { message, conversation } = data;
    
    if (!message) {
      return json({ success: false, error: 'Message is required' }, { status: 400 });
    }
    
    // Static system prompt for context
    const systemPrompt = {
      role: 'system',
      content: `You are Edna, a helpful and friendly AI shopping assistant.
Your goal is to provide clothing suggestions and answer related questions.
Keep your responses concise, friendly, and helpful.
Current date: ${new Date().toLocaleDateString()}`
    };
    
    // Build the messages array: if a conversation is provided, use it; otherwise, start fresh.
    let messages = [];
    if (conversation && Array.isArray(conversation) && conversation.length > 0) {
      // The conversation should already include previous messages.
      messages = conversation.concat({ role: 'user', content: message });
    } else {
      messages = [systemPrompt, { role: 'user', content: message }];
    }
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      max_tokens: 300,
      temperature: 0.7,
    });
    
    const aiResponse = completion.choices[0].message.content;
    
    // Return the AI response with proper CORS headers
    return json(
      { success: true, response: aiResponse },
      {
        headers: {
          "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "https://edna-app.myshopify.com",
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
        details: process.env.NODE_ENV === 'development'
          ? error instanceof Error ? error.message : String(error)
          : undefined
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "https://edna-app.myshopify.com",
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
  const origin = request.headers.get('origin') || process.env.ALLOWED_ORIGIN || "https://edna-app.myshopify.com";
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true"
    }
  });
}
