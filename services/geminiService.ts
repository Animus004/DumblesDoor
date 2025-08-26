import { GoogleGenAI, Type } from "@google/genai";
import { HealthCheckResult, GeminiChatMessage } from '../types';
import type { Chat } from "@google/genai";

const apiKey = import.meta.env.VITE_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
let chat: Chat | null = null;

const fileToGenerativePart = (base64Data: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };
};

export const analyzePetHealth = async (
  imageBase64: string,
  imageMimeType: string,
  notes: string,
  petContext: { name: string; breed: string; age: string; }
): Promise<HealthCheckResult> => {
  if (!ai) {
    throw new Error("Gemini AI client is not initialized. Check VITE_API_KEY.");
  }
  try {
    const imagePart = fileToGenerativePart(imageBase64, imageMimeType);
    const textPart = {
      text: `Analyze this pet image and user notes for a pet in India.
Pet's details: Name: ${petContext.name}, Breed: ${petContext.breed}, Age: ${petContext.age}.
Provide a friendly, warm, and positive pet wellness card analysis.
Your response MUST be in JSON format.
Based on your analysis, provide the following fields:
1.  **breed**: Identify the breed (or likely mixed breeds). Be concise. If the breed is provided, confirm it.
2.  **healthAnalysis**: A brief summary (1-2 sentences) of the main finding based on the visual analysis. Example: "No visible health issues detected!" or "Mild skin irritation noticed on the left ear."
3.  **careTips**: Provide 1-2 essential, actionable tips as a list of strings. Relevant to the Indian context and the specific pet.
4.  **vetRecommendation**: A boolean (true/false). Set to true ONLY if you see potential medical issues like significant skin irritation, injury, infection signs, eye/ear discharge, or anything concerning.
5.  **groomingRecommendation**: A boolean (true/false). Set to true for long-haired breeds, matted fur, or if grooming could help a detected issue (like mild skin problems).
6.  **productRecommendations**: An array of 1-2 short, generic product types that could help, based on the image or notes (e.g., "anti-tick shampoo", "hypoallergenic dog food", "durable chew toy"). If none, return an empty array.

User's notes: "${notes}"`,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [textPart, imagePart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            breed: { type: Type.STRING, description: "The identified breed or likely mix." },
            healthAnalysis: { type: Type.STRING, description: "A brief, 1-2 sentence summary of the pet's health. A disclaimer is not needed." },
            careTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A short list of 1-2 actionable care tips."
            },
            vetRecommendation: { type: Type.BOOLEAN, description: "True if a vet visit is recommended." },
            groomingRecommendation: { type: Type.BOOLEAN, description: "True if grooming is recommended." },
            productRecommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of generic product recommendations."
            }
          },
          required: ["breed", "healthAnalysis", "careTips", "vetRecommendation", "groomingRecommendation", "productRecommendations"]
        },
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error analyzing pet health:", error);
    throw new Error("Failed to get analysis from AI. Please check the console for details.");
  }
};

export const suggestPostHashtags = async (postContent: string): Promise<string[]> => {
    if (!ai) {
        throw new Error("Gemini AI client is not initialized.");
    }
    if (!postContent.trim()) {
        return [];
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze this social media post from a pet owner in India and suggest 3-5 relevant hashtags. Post Content: "${postContent}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        hashtags: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING, description: "A hashtag starting with #" },
                            description: "An array of 3-5 suggested hashtags, like '#DogsofIndia'."
                        }
                    },
                    required: ["hashtags"]
                }
            }
        });
        
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        return parsed.hashtags || [];

    } catch (error) {
        console.error("Error suggesting hashtags:", error);
        // Return some generic hashtags on failure
        return ["#PetLove", "#HappyPet", "#CutePet"];
    }
};


export const getChatStream = async function* (history: GeminiChatMessage[], newMessage: string) {
    if (!ai) {
      throw new Error("Gemini AI client is not initialized. Check VITE_API_KEY.");
    }
    if (!chat) {
        chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: 'You are Dumble, a friendly and knowledgeable AI pet care assistant for pet owners in India. Provide helpful, empathetic, and practical advice. Always prioritize the pet\'s well-being and recommend consulting a veterinarian for any serious medical concerns.',
            },
            history: history,
        });
    }

    const result = await chat.sendMessageStream({ message: newMessage });

    for await (const chunk of result) {
        yield chunk.text;
    }
};