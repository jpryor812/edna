import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import OpenAI from "openai";

// Initialize OpenAI with error handling
let openai: OpenAI;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} catch (error) {
  console.error("Error initializing OpenAI:", error);
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    // Validate OpenAI initialization
    if (!openai) {
      console.error("OpenAI client not initialized");
      return json(
        { success: false, error: "OpenAI client not initialized" },
        { status: 500 }
      );
    }

    // Check API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set");
      return json(
        { success: false, error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Parse request body
    let data;
    try {
      data = await request.json();
    } catch (error) {
      return json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

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
    
    // Build the messages array
    let messages = [];
    if (conversation && Array.isArray(conversation) && conversation.length > 0) {
      messages = conversation.concat({ role: 'user', content: message });
    } else {
      messages = [systemPrompt, { role: 'user', content: message }];
    }
    
    // Call OpenAI API
    console.log("Calling OpenAI API with messages:", JSON.stringify(messages));
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Changed to more reliable model
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      max_tokens: 300,
      temperature: 0.7,
    });
    
    const aiResponse = completion.choices[0].message.content;
    console.log("Received response from OpenAI:", aiResponse);
    
    // Return the AI response with proper CORS headers
    return json(
      { success: true, response: aiResponse },
      {
        headers: {
          "Access-Control-Allow-Origin": "*", // Simplified for testing
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        }
      }
    );
    
  } catch (error) {
    console.error('Error in OpenAI API request:', error);
    return json(
      {
        success: false,
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : String(error)
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*", // Simplified for testing
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      }
    );
  }
}

// Fixed: Use LoaderFunctionArgs for loader function
export async function loader({ request }: LoaderFunctionArgs) {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*", // Simplified for testing
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}