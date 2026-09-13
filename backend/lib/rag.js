const fs = require('fs');
const path = require('path');
const { embedText, generateAnswer } = require('./geminiClient');

const EMBEDDINGS_PATH = path.join(__dirname, '..', 'data', 'embeddings.json');
const TOP_K = 5;

let knowledgeBase = null;

function loadKnowledgeBase() {
  if (knowledgeBase) return knowledgeBase;
  if (!fs.existsSync(EMBEDDINGS_PATH)) {
    throw new Error('embeddings.json not found. Run scripts/build-embeddings.js first.');
  }
  knowledgeBase = JSON.parse(fs.readFileSync(EMBEDDINGS_PATH, 'utf-8'));
  return knowledgeBase;
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function retrieveContext(question) {
  const kb = loadKnowledgeBase();
  const queryEmbedding = await embedText(question);

  const scored = kb.map(chunk => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding)
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, TOP_K);
}

// In-memory conversation history, per session, kept small.
const conversationHistory = {};

function formatHistory(sessionId) {
  const history = conversationHistory[sessionId] || [];
  if (history.length === 0) return '(No previous conversation)';
  return history
    .slice(-2)
    .map(h => `User asked: ${h.question}\nYou (Jarvis) answered: ${h.answer}`)
    .join('\n\n');
}

function pushHistory(sessionId, question, answer) {
  if (!conversationHistory[sessionId]) conversationHistory[sessionId] = [];
  conversationHistory[sessionId].push({ question, answer });
  if (conversationHistory[sessionId].length > 3) {
    conversationHistory[sessionId] = conversationHistory[sessionId].slice(-3);
  }
}

async function answerWithGemini(question, sessionId) {
  const topChunks = await retrieveContext(question);
  const context = topChunks.map(c => c.text).join('\n\n---\n\n');
  const chatHistory = formatHistory(sessionId);

  const prompt = `You are Jarvis AI, a helpful assistant for President University students.

Context:
${context}

Recent Conversation:
${chatHistory}

User Input: ${question}

RULES:
- If user says ONLY "hi", "hello", "hey" (nothing else): Say "Hello! I'm Jarvis AI, here to help with President University information. How can I assist you today?"
- If user says ONLY "thank you", "thanks" (nothing else): Say "You're welcome! Happy to help!"
- For ANY OTHER INPUT (questions, requests): Answer directly from Context. DO NOT add greetings like "Hello" or "I'm Jarvis AI". Just answer the question.
- Use numbered lists for steps, bullet points for options
- Never mention "document", "context", or "handbook"
- If answer not in Context, say you don't have that information and recommend contacting the relevant university department

Answer:`;

  const answer = await generateAnswer(prompt);
  pushHistory(sessionId, question, answer);
  return answer;
}

module.exports = { answerWithGemini };
