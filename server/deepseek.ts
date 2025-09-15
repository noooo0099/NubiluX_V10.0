import OpenAI from "openai";

// DeepSeek API configuration - compatible with OpenAI SDK format
const deepseek = new OpenAI({ 
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

export async function generatePoster(
  posterId: number, 
  profileImageUrl: string, 
  selectedSkins: string[]
): Promise<string> {
  try {
    // DeepSeek doesn't support image generation, return placeholder
    console.log('Poster generation requested but DeepSeek does not support image generation');
    return 'https://via.placeholder.com/1024x1792/134D37/ffffff?text=Gaming+Account+Poster';
  } catch (error) {
    console.error('Poster generation failed:', error);
    throw new Error('Failed to generate poster');
  }
}

export async function processAdminMention(
  chatHistory: any[], 
  chat: any
): Promise<string> {
  try {
    // Prepare chat context for AI analysis
    const chatContext = chatHistory.map(msg => 
      `${msg.senderId === chat.buyerId ? 'Buyer' : 'Seller'}: ${msg.content}`
    ).join('\n');

    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `You are an AI admin for NubiluXchange, a gaming marketplace platform. Your role is to:
          1. Mediate disputes between buyers and sellers
          2. Provide transaction guidance and policy clarification
          3. Resolve conflicts fairly and professionally
          4. Ensure smooth marketplace operations
          5. Protect both parties from fraud
          
          Always respond in a helpful, professional tone. If a transaction dispute occurs, analyze the conversation and provide a fair resolution. For policy questions, refer to marketplace guidelines.
          
          Respond with JSON in this format: { "response": "your response message", "action": "none|warning|suspend|refund|escalate" }`
        },
        {
          role: "user",
          content: `Chat history:\n${chatContext}\n\nPlease analyze this conversation and provide appropriate admin assistance.`
        }
      ],
    });

    const result = JSON.parse(response.choices[0].message.content!);
    
    // Log admin action if needed
    if (result.action !== "none") {
      console.log(`AI Admin action taken: ${result.action} for chat ${chat.id}`);
    }
    
    return result.response;
  } catch (error) {
    console.error('AI admin processing failed:', error);
    return "Hello! I'm the AI Admin. I'm currently experiencing technical difficulties, but I'm here to help resolve any issues. Please describe your concern and I'll assist you as soon as possible.";
  }
}

export async function moderateContent(content: string): Promise<{
  isAppropriate: boolean;
  confidence: number;
  reason?: string;
}> {
  try {
    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `You are a content moderator for a gaming marketplace. Analyze content for:
          - Inappropriate language or harassment
          - Scam attempts or fraudulent behavior
          - Spam or promotional content outside guidelines
          - Personal information sharing that could be unsafe
          
          Respond with JSON: { "isAppropriate": boolean, "confidence": number (0-1), "reason": "explanation if inappropriate" }`
        },
        {
          role: "user",
          content: content
        }
      ],
    });

    const result = JSON.parse(response.choices[0].message.content!);
    return {
      isAppropriate: result.isAppropriate,
      confidence: Math.max(0, Math.min(1, result.confidence)),
      reason: result.reason
    };
  } catch (error) {
    console.error('Content moderation failed:', error);
    // Default to allowing content if moderation fails
    return {
      isAppropriate: true,
      confidence: 0.5,
      reason: "Moderation service unavailable"
    };
  }
}

export async function generateProductDescription(
  title: string,
  gameCategory: string,
  additionalDetails?: string
): Promise<string> {
  try {
    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `You are a gaming marketplace expert. Generate compelling product descriptions for gaming accounts that highlight key selling points while being honest and accurate. Focus on rank, items, characters, achievements, and account value.`
        },
        {
          role: "user",
          content: `Generate a professional product description for:
          Title: ${title}
          Game: ${gameCategory}
          Additional details: ${additionalDetails || 'None provided'}
          
          Make it engaging but factual, highlighting the account's value proposition.`
        }
      ],
    });

    return response.choices[0].message.content!;
  } catch (error) {
    console.error('Description generation failed:', error);
    return "Premium gaming account with excellent progress and valuable items. Contact seller for detailed information about rank, characters, and achievements.";
  }
}
