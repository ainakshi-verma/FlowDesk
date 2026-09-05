import { config } from '../config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class LLMService {
  private hasOpenAi = Boolean(config.openaiApiKey);
  private hasGemini = Boolean(config.geminiApiKey);

  async complete(prompt: string, systemPrompt?: string): Promise<string> {
    if (this.hasOpenAi) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.openaiApiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
              { role: 'user', content: prompt }
            ],
            temperature: 0.7
          })
        });

        if (response.ok) {
          const data: any = await response.json();
          return data.choices[0]?.message?.content || '';
        }
      } catch (err) {
        console.warn('OpenAI request failed, using intelligent agent fallback:', err);
      }
    }

    if (this.hasGemini) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt ? `[SYSTEM]: ${systemPrompt}\n\n` : ''}${prompt}` }] }]
          })
        });

        if (response.ok) {
          const data: any = await response.json();
          return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      } catch (err) {
        console.warn('Gemini request failed, using intelligent agent fallback:', err);
      }
    }

    // Fallback: returns empty string so caller uses agent fallback logic
    return '';
  }

  async generateEmbeddings(text: string): Promise<number[]> {
    if (this.hasOpenAi) {
      try {
        const res = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.openaiApiKey}`
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: text.slice(0, 8000)
          })
        });
        if (res.ok) {
          const data: any = await res.json();
          return data.data[0].embedding;
        }
      } catch (e) {
        console.warn('Embedding API call failed, falling back to deterministic local embedding');
      }
    }

    // Deterministic 1536-dimensional semantic hash vector for testing/offline RAG
    const vector = new Array(1536).fill(0);
    const words = text.toLowerCase().match(/\w+/g) || [];
    words.forEach((word, idx) => {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = (hash * 31 + word.charCodeAt(i)) % 1536;
      }
      vector[hash] += 1 / Math.sqrt(idx + 1);
    });

    // Normalize vector
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vector.map(v => v / norm);
  }
}

export const llm = new LLMService();
