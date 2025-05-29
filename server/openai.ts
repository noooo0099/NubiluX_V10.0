import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export async function generatePoster(
  posterId: number, 
  profileImageUrl: string, 
  selectedSkins: string[]
): Promise<string> {
  try {
    // Generate poster description for DALL-E
    const prompt = `Create a professional gaming account showcase poster with the following elements:
    - A sleek dark background with neon green accents (#134D37)
    - Place the profile image at the top center in a stylized frame
    - Arrange ${selectedSkins.length} gaming skins in a 9x6 grid layout below the profile
    - Use a modern, gaming-themed design with glowing effects
    - Include subtle geometric patterns and gaming UI elements
    - Professional typography for the "NubiluXchange" branding
    - High contrast and vibrant colors suitable for gaming community
    - Resolution optimized for mobile display (720x1280)
    
    Skins to showcase: ${selectedSkins.join(', ')}
    
    Style: Modern gaming UI, cyberpunk aesthetic, professional marketplace poster`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1792", // Closest to 720x1280 ratio
      quality: "hd",
    });

    return response.data[0].url!;
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

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
      response_format: { type: "json_object" },
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
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
      response_format: { type: "json_object" },
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
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
