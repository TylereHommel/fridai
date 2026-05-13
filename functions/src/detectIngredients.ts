import * as functions from 'firebase-functions/v2/https';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type DetectRequest = {
  imageUrls: string[];
  dietaryRestrictions: string[];
};

export const detectIngredients = functions.onCall<DetectRequest>(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new functions.HttpsError('unauthenticated', 'Sign in required');

    const { imageUrls, dietaryRestrictions } = request.data;
    if (!imageUrls?.length) throw new functions.HttpsError('invalid-argument', 'No images provided');

    const imageContent: Anthropic.ImageBlockParam[] = imageUrls.map((url) => ({
      type: 'image',
      source: { type: 'url', url },
    }));

    const restrictionNote = dietaryRestrictions.length > 0
      ? `User dietary restrictions: ${dietaryRestrictions.join(', ')}. Note any items that conflict.`
      : '';

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            {
              type: 'text',
              text: `Look at these fridge/pantry photos and list every food ingredient you can identify. ${restrictionNote}
Return ONLY a JSON array of ingredient names, lowercase, singular form, no brands. Example: ["eggs", "milk", "spinach", "chicken breast", "garlic"]. Return nothing else.`,
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '[]';
    let ingredients: string[] = [];
    try {
      const match = text.match(/\[[\s\S]*\]/);
      ingredients = match ? JSON.parse(match[0]) : [];
    } catch {
      ingredients = [];
    }

    return { ingredients, sessionId: `${uid}_${Date.now()}` };
  }
);
