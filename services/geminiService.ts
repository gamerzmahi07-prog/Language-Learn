
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Lesson } from "../types";

const getMockLesson = (language: string, lessonNumber: number): Lesson => ({
  id: `mock-${lessonNumber}`,
  title: `Essential ${language} Greetings`,
  description: `Master the basic ways to say hello and introduce yourself in ${language}.`,
  content: {
    vocabulary: [
      { word: "Hola", translation: "Hello", pronunciation: "oh-la" },
      { word: "Gracias", translation: "Thank you", pronunciation: "gra-syas" },
      { word: "Por favor", translation: "Please", pronunciation: "por fa-vor" },
      { word: "Buenos días", translation: "Good morning", pronunciation: "bwe-nos dee-as" },
      { word: "Lo siento", translation: "I'm sorry", pronunciation: "lo syen-to" },
      { word: "Adiós", translation: "Goodbye", pronunciation: "ah-dyos" },
      { word: "Sí", translation: "Yes", pronunciation: "see" },
      { word: "No", translation: "No", pronunciation: "no" }
    ],
    phrases: [
      { phrase: "¿Cómo estás?", translation: "How are you?" },
      { phrase: "Mucho gusto", translation: "Nice to meet you" },
      { phrase: "Mi nombre es...", translation: "My name is..." },
      { phrase: "¿Hablas inglés?", translation: "Do you speak English?" },
      { phrase: "¡Hasta luego!", translation: "See you later!" },
      { phrase: "De nada", translation: "You're welcome" }
    ],
    dialogue: [
      { speaker: "Mateo", text: "¡Hola! ¿Cómo estás?", translation: "Hello! How are you?" },
      { speaker: "Lucía", text: "Muy bien, gracias. ¿Y tú?", translation: "Very well, thanks. And you?" },
      { speaker: "Mateo", text: "Bien. Mi nombre es Mateo.", translation: "Good. My name is Mateo." },
      { speaker: "Lucía", text: "Mucho gusto, Mateo.", translation: "Nice to meet you, Mateo." }
    ],
    story: [
      { text: "Hoy es un día hermoso en la ciudad.", translation: "Today is a beautiful day in the city." },
      { text: "La gente camina por las calles y se saluda con alegría.", translation: "People walk through the streets and greet each other with joy." },
      { text: "Mateo va al mercado a comprar pan fresco y café.", translation: "Mateo goes to the market to buy fresh bread and coffee." }
    ],
    culturalNote: "In many Spanish-speaking countries, greetings are warm and often involve a handshake or light embrace."
  },
  quiz: [
    {
      question: `How do you say "Hello" in ${language}?`,
      options: ["Hola", "Adiós", "Gracias", "Perdón"],
      correctAnswer: 0
    },
    {
      question: "What does 'Mucho gusto' mean?",
      options: ["Good morning", "Nice to meet you", "See you later", "How are you?"],
      correctAnswer: 1
    }
  ]
});

export const generateLesson = async (language: string, lessonNumber: number): Promise<Lesson> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const prompt = `Create an EXTENSIVE, premium language lesson for ${language}, lesson #${lessonNumber}. 
    This is for a high-end social learning app.
    
    REQUIREMENTS:
    1. EXACTLY 12 vocabulary items with clear pronunciation guides.
    2. EXACTLY 8 conversational phrases.
    3. A "dialogue" section with 6 turns between two people.
    4. A "story" section: 5 detailed paragraphs forming a full narrative that uses the vocab and phrases.
    5. A cultural note that provides deep insight into social norms of ${language} speakers.
    6. 3 Challenging quiz questions.
    
    Return the response in JSON format according to the schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            content: {
              type: Type.OBJECT,
              properties: {
                vocabulary: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      word: { type: Type.STRING },
                      translation: { type: Type.STRING },
                      pronunciation: { type: Type.STRING }
                    }
                  }
                },
                phrases: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      phrase: { type: Type.STRING },
                      translation: { type: Type.STRING }
                    }
                  }
                },
                dialogue: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      speaker: { type: Type.STRING },
                      text: { type: Type.STRING },
                      translation: { type: Type.STRING }
                    }
                  }
                },
                story: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      translation: { type: Type.STRING }
                    }
                  }
                },
                culturalNote: { type: Type.STRING }
              }
            },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.INTEGER }
                }
              }
            }
          },
          required: ["title", "description", "content", "quiz"]
        }
      }
    });

    const lessonData = JSON.parse(response.text || "{}");
    return {
      id: `lesson-${lessonNumber}-${Date.now()}`,
      ...lessonData
    };
  } catch (error) {
    console.warn("Gemini Lesson Generation failed, using fallback.", error);
    return getMockLesson(language, lessonNumber);
  }
};

export const speakText = async (text: string, language: string): Promise<string | undefined> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say clearly in ${language}: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS generation failed:", error);
    return undefined;
  }
};
