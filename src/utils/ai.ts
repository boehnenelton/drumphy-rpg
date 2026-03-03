import { GoogleGenAI, Modality } from '@google/genai';
import { AI_KEYS } from '../constants';

let currentKeyIndex = Math.floor(Math.random() * AI_KEYS.length);

export function rotateKey() {
  currentKeyIndex = Math.floor(Math.random() * AI_KEYS.length);
  return AI_KEYS[currentKeyIndex];
}

export function getCurrentKey() {
  return AI_KEYS[currentKeyIndex];
}

export async function generateText(prompt: string, model: string, contextFiles: {name: string, content: string}[], onStatus: (status: string) => void) {
  onStatus('SENDING: Query has left the device.');
  try {
    const ai = new GoogleGenAI({ apiKey: getCurrentKey() });
    
    let fullPrompt = prompt;
    if (contextFiles.length > 0) {
      fullPrompt = `[CONTEXT FILES - DO NOT COPY DIRECTLY, JUST STUDY AND LEARN FROM THEM]\n\n` + 
        contextFiles.map(f => `--- ${f.name} ---\n${f.content}`).join('\n\n') + 
        `\n\n[END CONTEXT]\n\n` + prompt;
    }

    onStatus('PROCESSING: Google has received the query and is generating.');
    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
    });
    
    onStatus('SUCCESS: Data received and parsed.');
    return response.text || '';
  } catch (error: any) {
    onStatus(`ERROR: ${error.message || 'Unknown error'}`);
    throw error;
  }
}

export async function generateSpeech(text: string, onStatus: (status: string) => void) {
  onStatus('SENDING: Requesting TTS...');
  try {
    const ai = new GoogleGenAI({ apiKey: getCurrentKey() });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' },
          },
        },
      },
    });
    
    onStatus('SUCCESS: Audio received.');
    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (inlineData && inlineData.data) {
      return inlineData.data;
    }
    throw new Error("No audio data returned");
  } catch (error: any) {
    onStatus(`ERROR: ${error.message || 'Unknown error'}`);
    throw error;
  }
}

export async function playAudio(base64Data: string): Promise<void> {
  const binaryString = window.atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Convert to 16-bit PCM
  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }

  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const sampleRate = 24000; // Gemini TTS default

  const audioBuffer = audioCtx.createBuffer(1, float32Array.length, sampleRate);
  audioBuffer.getChannelData(0).set(float32Array);

  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioCtx.destination);
  source.start();

  return new Promise((resolve) => {
    source.onended = () => resolve();
  });
}
