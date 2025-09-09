import { GoogleGenAI, Type } from "@google/genai";
import { HealthCheckResult, GeminiChatMessage } from '../types';
import type { Chat } from "@google/genai";

// FIX: Per coding guidelines, initialize GoogleGenAI with the API_KEY from the environment.
// In a Vite environment, client-side variables must be prefixed with VITE_ and accessed via import.meta.env.
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
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
  try {
    const imagePart = fileToGenerativePart(imageBase64, imageMimeType);
    const textPart = {
      text: `Analyze this pet image for a professional, infographic-style pet wellness report in India.
Pet's details: Name: ${petContext.name}, Breed: ${petContext.breed}, Age: ${petContext.age}.
User's notes: "${notes}"

Your response MUST be a single, valid JSON object that strictly adheres to the provided schema. Structure the report into clear, professional sections as described below:

1.  **reportId**: (string) Generate a unique report ID in the format 'RPT-DUMBLES-[YYYYMMDD]-[4_RANDOM_CHARS]'.
2.  **analysisDate**: (string) The current date and time in ISO 8601 format.
3.  **executiveSummary**: (string) A concise, professional paragraph summarizing the pet's overall health status and key findings.

4.  **breedAnalysis**: (object) An analysis of the pet's breed.
    *   **breedName**: (string) The most likely breed.
    *   **confidence**: (number) A confidence score (0-100) for the identification.
    *   **characteristics**: (array of strings) 2-3 key characteristics of this breed.

5.  **overallHealthScore**: (number) A score from 0-100.

6.  **healthAssessment**: (array of objects) An assessment for EACH of these categories: 'Coat & Skin', 'Eyes & Ears', 'Dental Health', 'Body Condition'.
    For each category object:
    *   **category**: (string) The category name.
    *   **score**: (number) A score from 0-100.
    *   **status**: (string) 'Excellent', 'Good', or 'Concern'.
    *   **observation**: (string) A detailed, professional observation, potentially using clinical terms.
    *   **interpretation**: (string) A simple, one-sentence plain-language explanation of what the observation means for the pet's health.
    *   **confidence**: (number) Your confidence score (0-100) in this specific assessment.
    *   **reliability**: (string) 'High', 'Medium', or 'Low', based on the image's quality for assessing this category.

7.  **careRecommendations**: (array of objects) 2-4 actionable care recommendations.
    For each recommendation object:
    *   **priority**: (string) 'Immediate', 'Routine', or 'Preventive'.
    *   **title**: (string) A short, clear title for the recommendation.
    *   **guidance**: (string) Detailed, step-by-step instructions.
    *   **timeline**: (string) A suggested timeline (e.g., "Daily", "Within 2 weeks").
    *   **icon_name**: (string) A relevant snake_case icon name from this list: [grooming_brush, dental_care, diet_food, exercise_walk, vet_visit, medication, eye_drops, ear_cleaner, skin_care, mental_stimulation].
    *   **difficulty**: (string) The estimated difficulty: 'Easy DIY', 'Moderate', or 'Professional Help Required'.
    *   **estimatedCost**: (string) An estimated cost in INR, e.g., "₹200 - ₹500" or "Free".

8.  **actionItems**: (array of objects) A list of 1-2 high-priority actions. If a vet or groomer visit is needed, include it here.
    For each action item object:
    *   **priority**: (string) 'High', 'Medium', or 'Low'.
    *   **title**: (string) The action to be taken (e.g., "Schedule Veterinarian Appointment").
    *   **details**: (string) Why this action is necessary.
    *   **icon_name**: (string) A relevant snake_case icon name (see list in careRecommendations).
    *   **estimatedCost**: (string) An estimated cost in INR, e.g., "₹1000 - ₹2500" or "Varies".

9.  **localServices**: (array of objects) Suggest 1-3 fictional local services in a major Indian city. Include a mix of vets, groomers, or pet stores.
    For each service object:
    *   **type**: (string) The type of service from this list: ['Veterinary Clinic', 'Emergency Vet', 'Groomer', 'Pet Store'].
    *   **name**: (string) A fictional name for the service (e.g., "Pawsitive Care Vet Clinic").
    *   **address**: (string) A fictional address (e.g., "123, Koramangala, Bangalore").
    *   **phone**: (string) A fictional 10-digit Indian mobile number (e.g., "9876543210").

10. **productRecommendations**: (array of objects) Suggest 1-2 relevant products.
    For each product object:
    *   **name**: (string) The product name or type (e.g., "Anti-Tick Dog Shampoo").
    *   **reason**: (string) A short explanation of why it's recommended.
    *   **estimatedCost**: (string) An estimated price in INR (e.g., "approx. ₹600").`
};

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [textPart, imagePart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reportId: { type: Type.STRING },
            analysisDate: { type: Type.STRING },
            executiveSummary: { type: Type.STRING },
            breedAnalysis: {
              type: Type.OBJECT,
              properties: {
                breedName: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                characteristics: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["breedName", "confidence", "characteristics"]
            },
            overallHealthScore: { type: Type.NUMBER },
            healthAssessment: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  status: { type: Type.STRING },
                  observation: { type: Type.STRING },
                  interpretation: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  reliability: { type: Type.STRING },
                },
                required: ["category", "score", "status", "observation", "interpretation", "confidence", "reliability"]
              }
            },
            careRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  priority: { type: Type.STRING },
                  title: { type: Type.STRING },
                  guidance: { type: Type.STRING },
                  timeline: { type: Type.STRING },
                  icon_name: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  estimatedCost: { type: Type.STRING },
                },
                required: ["priority", "title", "guidance", "timeline", "icon_name", "difficulty", "estimatedCost"]
              }
            },
            actionItems: {
              type: Type.ARRAY,
              items: {
                  type: Type.OBJECT,
                  properties: {
                      priority: { type: Type.STRING },
                      title: { type: Type.STRING },
                      details: { type: Type.STRING },
                      icon_name: { type: Type.STRING },
                      estimatedCost: { type: Type.STRING },
                  },
                  required: ["priority", "title", "details", "icon_name", "estimatedCost"]
              }
            },
            localServices: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  name: { type: Type.STRING },
                  address: { type: Type.STRING },
                  phone: { type: Type.STRING },
                },
                required: ["type", "name", "address", "phone"]
              }
            },
            productRecommendations: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        reason: { type: Type.STRING },
                        estimatedCost: { type: Type.STRING },
                    },
                    required: ["name", "reason", "estimatedCost"]
                }
            }
          },
          required: ["reportId", "analysisDate", "executiveSummary", "breedAnalysis", "overallHealthScore", "healthAssessment", "careRecommendations", "actionItems", "localServices", "productRecommendations"]
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