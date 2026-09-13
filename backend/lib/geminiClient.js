const axios = require('axios');

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const EMBED_MODEL = 'gemini-embedding-001';
const GENERATE_MODEL = 'gemini-flash-latest';
// Tried after GENERATE_MODEL exhausts its retries - a different model has separate
// capacity, so it often succeeds when the primary model is under high demand.
const GENERATE_MODEL_FALLBACK = 'gemini-flash-lite-latest';

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');
  return key;
}

// Gemini's free tier returns 503 "high demand" fairly often under normal load.
// It's transient, so retry a few times with backoff before giving up.
const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 1000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryable(error) {
  const status = error.response?.status;
  return status === 503 || status === 429;
}

async function withRetry(fn) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES && isRetryable(error)) {
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

async function embedText(text) {
  return withRetry(async () => {
    const res = await axios.post(
      `${API_BASE}/${EMBED_MODEL}:embedContent?key=${getApiKey()}`,
      { content: { parts: [{ text }] } }
    );
    return res.data.embedding.values;
  });
}

async function callGenerate(model, prompt) {
  const res = await axios.post(
    `${API_BASE}/${model}:generateContent?key=${getApiKey()}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.05,
        topP: 0.9,
        maxOutputTokens: 1024
      }
    }
  );
  const candidate = res.data.candidates?.[0];
  const text = candidate?.content?.parts?.map(p => p.text).join('').trim();
  if (!text) throw new Error('Gemini returned no text');
  return text;
}

async function generateAnswer(prompt) {
  try {
    return await withRetry(() => callGenerate(GENERATE_MODEL, prompt));
  } catch (error) {
    if (!isRetryable(error)) throw error;
    // Primary model still overloaded after retries - one more try on a different model.
    return callGenerate(GENERATE_MODEL_FALLBACK, prompt);
  }
}

module.exports = { embedText, generateAnswer, EMBED_MODEL, GENERATE_MODEL };
