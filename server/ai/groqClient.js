import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy_key_replace_me_in_env' });

export const groqChat = async (messages, options = {}) => {
  const response = await groq.chat.completions.create({
    model: options.model || 'llama-3.3-70b-versatile',
    messages,
    temperature: options.temperature || 0.7,
    max_tokens: options.maxTokens || 1500,
  });
  return response.choices[0]?.message?.content || '';
};

export default { chat: groqChat };
