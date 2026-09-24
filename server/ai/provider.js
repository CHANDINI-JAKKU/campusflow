import { groqChat } from './groqClient.js';

const getProvider = () => {
  const provider = process.env.AI_PROVIDER || 'groq';
  if (provider === 'groq') return { chat: groqChat };
  throw new Error(`Unsupported AI provider: ${provider}. Set AI_PROVIDER env var.`);
};

export const aiChat = async (messages, options = {}) => {
  const provider = getProvider();
  return provider.chat(messages, options);
};

export default { chat: aiChat };
