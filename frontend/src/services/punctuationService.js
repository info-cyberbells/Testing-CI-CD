// // src/services/punctuationService.js


import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export const punctuateText = async (text) => {
  const res = await axios.post(`${API_URL}/punctuate`, { text });
  return res.data.result;
};


// const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
// const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// const punctuationCache = new Map();
// const MAX_CACHE_SIZE = 500;

// /**
//  * Correct punctuation in continuous speech without over-punctuating
//  * @param {string} text - Text with potentially wrong or missing punctuation
//  * @param {string} language - Target language (e.g., 'English', 'Spanish', 'Hindi')
//  * @returns {Promise<string>} - Text with corrected punctuation
//  */
// export async function correctPunctuation(text, language) {
//   // Skip if text is too short
//   if (!text || text.trim().length < 5) {
//     return text;
//   }

//   // Check cache first
//   const cacheKey = `${text}_${language}_v2`;
//   if (punctuationCache.has(cacheKey)) {
//     console.log('[PUNCTUATION] ✓ Using cached result');
//     return punctuationCache.get(cacheKey);
//   }

//   try {
//     const words = text.trim().split(/\s+/).length;
//     console.log(`[PUNCTUATION] Correcting ${words} words in ${language}`);
//     const startTime = performance.now();

//     const response = await fetch(OPENAI_API_URL, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${OPENAI_API_KEY}`
//       },
//       body: JSON.stringify({
//         model: 'gpt-4o-mini',
//         messages: [
//           {
//             role: 'system',
//             content: `You are a punctuation correction expert for ${language}. You fix punctuation in LIVE SPEECH that's being translated in real-time chunks.

// CRITICAL RULES:
// 1. DO NOT change, add, or remove ANY words - ONLY fix punctuation
// 2. This is CONTINUOUS SPEECH - don't over-punctuate!
// 3. Only add periods at TRUE sentence boundaries, not every phrase
// 4. Use commas for natural pauses, NOT periods everywhere
// 5. Keep sentence flow natural - maintain connected thoughts
// 6. Fix obviously wrong punctuation placement
// 7. Keep proper nouns together (e.g., "Himachal Pradesh" not "Himachal. Pradesh")
// 8. Don't break up common phrases
// 9. Use ${language} punctuation rules correctly
// 10. Return ONLY the corrected text, no explanations

// Examples of GOOD corrections:
// ❌ "Hello. Hear me. Please. Let me know."
// ✅ "Hello, hear me please. Let me know."

// ❌ "I am from Himachal. Pradesh India"
// ✅ "I am from Himachal Pradesh, India."

// ❌ "doing the. Great job well done"
// ✅ "doing the great job, well done."

// ❌ "not at. all then someone"
// ✅ "not at all, then someone"

// ❌ "I don't know. Your name and age."
// ✅ "I don't know your name and age."

// ❌ "who are you? me please let"
// ✅ "Who are you? Me, please let"

// Remember: This is LIVE speech in small chunks. Be conservative with periods!`
//           },
//           {
//             role: 'user',
//             content: text
//           }
//         ],
//         temperature: 0.1, // Very low for conservative corrections
//         max_tokens: 1000,
//         top_p: 0.9,
//         frequency_penalty: 0.2, // Discourage repetitive punctuation
//         presence_penalty: 0.1
//       })
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
//     }

//     const data = await response.json();
//     let correctedText = data.choices[0].message.content.trim();
    
//     // Post-processing: Fix common GPT mistakes
//     correctedText = fixOverPunctuation(correctedText);
    
//     const duration = performance.now() - startTime;
//     const tokensUsed = data.usage?.total_tokens || 0;
    
//     console.log(`[PUNCTUATION] ✓ Corrected in ${duration.toFixed(0)}ms`);
//     console.log(`[PUNCTUATION] Before: "${text.substring(0, 80)}${text.length > 80 ? '...' : ''}"`);
//     console.log(`[PUNCTUATION] After:  "${correctedText.substring(0, 80)}${correctedText.length > 80 ? '...' : ''}"`);
//     console.log(`[PUNCTUATION] Tokens: ${tokensUsed} (~$${(tokensUsed * 0.0004 / 1000).toFixed(5)})`);

//     // Cache the result
//     addToCache(cacheKey, correctedText);

//     return correctedText;

//   } catch (error) {
//     console.error('[PUNCTUATION] ✗ Failed:', error);
//     return text; // Return original text on failure
//   }
// }

// /**
//  * Post-process to fix over-punctuation and common GPT mistakes
//  */
// function fixOverPunctuation(text) {
//   let fixed = text;
  
//   // Fix split place names
//   fixed = fixed.replace(/Himachal\.\s+Pradesh/gi, 'Himachal Pradesh');
//   fixed = fixed.replace(/Uttar\.\s+Pradesh/gi, 'Uttar Pradesh');
//   fixed = fixed.replace(/Madhya\.\s+Pradesh/gi, 'Madhya Pradesh');
//   fixed = fixed.replace(/Andhra\.\s+Pradesh/gi, 'Andhra Pradesh');
//   fixed = fixed.replace(/Arunachal\.\s+Pradesh/gi, 'Arunachal Pradesh');
//   fixed = fixed.replace(/Tamil\.\s+Nadu/gi, 'Tamil Nadu');
//   fixed = fixed.replace(/West\.\s+Bengal/gi, 'West Bengal');
  
//   // Fix common phrases that get split
//   fixed = fixed.replace(/\bat\.\s+all\b/gi, 'at all');
//   fixed = fixed.replace(/\bnot\.\s+at\s+all\b/gi, 'not at all');
//   fixed = fixed.replace(/\bof\.\s+course\b/gi, 'of course');
//   fixed = fixed.replace(/\bthank\.\s+you\b/gi, 'thank you');
//   fixed = fixed.replace(/\blet\.\s+me\b/gi, 'let me');
//   fixed = fixed.replace(/\btell\.\s+me\b/gi, 'tell me');
  
//   // Fix patterns like "the. Great" → "the great"
//   fixed = fixed.replace(/\bthe\.\s+([A-Z])/g, 'the $1');
  
//   // Fix patterns like "doing the. Great job" → "doing the great job"
//   fixed = fixed.replace(/([a-z]+)\s+the\.\s+([A-Z][a-z]+)/g, '$1 the $2');
  
//   // Fix lowercase word after period that shouldn't have one
//   // e.g., "word. lowercase" → "word lowercase" (but keep "word. Capital")
//   fixed = fixed.replace(/\b([a-z]+)\.\s+([a-z]{2,})\b/g, (match, word1, word2) => {
//     // List of words that commonly follow periods
//     const sentenceStarters = ['i', 'he', 'she', 'they', 'we', 'you', 'it', 'this', 'that', 'these', 'those'];
//     if (sentenceStarters.includes(word2.toLowerCase())) {
//       return match; // Keep the period
//     }
//     return `${word1} ${word2}`; // Remove the period
//   });
  
//   // Fix multiple spaces
//   fixed = fixed.replace(/\s{2,}/g, ' ');
  
//   // Fix space before punctuation
//   fixed = fixed.replace(/\s+([.,!?;:])/g, '$1');
  
//   // Ensure space after punctuation
//   fixed = fixed.replace(/([.,!?;:])([A-Za-z])/g, '$1 $2');
  
//   return fixed.trim();
// }

// /**
//  * Legacy function name for backward compatibility
//  */
// export async function addPunctuation(text, language) {
//   return correctPunctuation(text, language);
// }

// /**
//  * Add result to cache with size limit
//  */
// function addToCache(key, value) {
//   if (punctuationCache.size >= MAX_CACHE_SIZE) {
//     // Remove oldest entry
//     const firstKey = punctuationCache.keys().next().value;
//     punctuationCache.delete(firstKey);
//   }
//   punctuationCache.set(key, value);
// }

// /**
//  * Clear the punctuation cache
//  */
// export function clearPunctuationCache() {
//   punctuationCache.clear();
//   console.log('[PUNCTUATION] Cache cleared');
// }

// /**
//  * Get cache statistics
//  */
// export function getCacheStats() {
//   return {
//     size: punctuationCache.size,
//     maxSize: MAX_CACHE_SIZE,
//     hitRate: calculateHitRate()
//   };
// }

// /**
//  * Calculate cache hit rate
//  */
// let cacheHits = 0;
// let cacheMisses = 0;

// function calculateHitRate() {
//   const total = cacheHits + cacheMisses;
//   return total > 0 ? ((cacheHits / total) * 100).toFixed(1) + '%' : '0%';
// }

// /**
//  * Batch correction for multiple texts (advanced use)
//  */
// export async function correctPunctuationBatch(items) {
//   console.log(`[PUNCTUATION] Batch processing ${items.length} items`);
//   const results = await Promise.all(
//     items.map(item => correctPunctuation(item.text, item.language))
//   );
//   return results;
// }

// /**
//  * Get estimated cost for punctuation correction
//  * @param {number} wordCount - Number of words to correct
//  * @returns {string} - Estimated cost in USD
//  */
// export function estimateCost(wordCount) {
//   // GPT-4o Mini: $0.150/1M input, $0.600/1M output
//   // Average: ~50 tokens input, ~60 tokens output per request
//   const avgTokens = 110;
//   const requests = Math.ceil(wordCount / 8); // Assuming window_size = 8
//   const totalTokens = requests * avgTokens;
//   const inputCost = (totalTokens * 0.5 * 0.150) / 1000000;
//   const outputCost = (totalTokens * 0.5 * 0.600) / 1000000;
//   const totalCost = inputCost + outputCost;
  
//   return `$${totalCost.toFixed(4)}`;
// }

// /**
//  * Health check - test if OpenAI API is accessible
//  */
// export async function healthCheck() {
//   try {
//     const response = await fetch(OPENAI_API_URL, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${OPENAI_API_KEY}`
//       },
//       body: JSON.stringify({
//         model: 'gpt-4o-mini',
//         messages: [{ role: 'user', content: 'test' }],
//         max_tokens: 5
//       })
//     });
    
//     return response.ok;
//   } catch (error) {
//     console.error('[PUNCTUATION] Health check failed:', error);
//     return false;
//   }
// }

// // Export all functions
// export default {
//   correctPunctuation,
//   addPunctuation,
//   clearPunctuationCache,
//   getCacheStats,
//   correctPunctuationBatch,
//   estimateCost,
//   healthCheck
// };















// src/services/punctuationService.js
// Enhanced Punctuation Service v4.0
// Optimized for live sermon translation with fragment-aware processing

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Configuration
const CONFIG = {
  MAX_CACHE_SIZE: 1000,           // Increased cache size
  CACHE_VERSION: 'v4',            // Updated version
  MIN_TEXT_LENGTH: 5,             // Minimum text length to process
  API_TIMEOUT: 10000,             // 10 second timeout
  MAX_RETRIES: 2,                 // Retry failed requests
  TEMPERATURE: 0.01,              // Very conservative
  TOP_P: 0.75,                    // Lower for consistency
  FREQUENCY_PENALTY: 0.5,         // Discourage repetition
  PRESENCE_PENALTY: 0.1
};

// Cache implementation
const punctuationCache = new Map();
let cacheHits = 0;
let cacheMisses = 0;

/**
 * Main punctuation correction function
 * Handles fragment-aware punctuation for live speech chunks
 * 
 * @param {string} text - Text to correct (typically 8-word chunks)
 * @param {string} language - Target language code (e.g., 'en', 'hi', 'es')
 * @returns {Promise<string>} - Corrected text with proper punctuation
 */
export async function correctPunctuation(text, language) {
  // Validation
  if (!text || typeof text !== 'string') {
    console.warn('[PUNCTUATION] Invalid text input:', text);
    return text || '';
  }

  const trimmedText = text.trim();
  
  // Skip very short text
  if (trimmedText.length < CONFIG.MIN_TEXT_LENGTH) {
    return trimmedText;
  }

  // Check cache first
  const cacheKey = `${trimmedText}_${language}_${CONFIG.CACHE_VERSION}`;
  if (punctuationCache.has(cacheKey)) {
    cacheHits++;
    console.log('[PUNCTUATION] ✓ Cache hit');
    return punctuationCache.get(cacheKey);
  }

  cacheMisses++;

  try {
    const words = trimmedText.split(/\s+/).length;
    console.log(`[PUNCTUATION] Processing ${words} words in ${language}`);
    const startTime = performance.now();

    // Call OpenAI API with retries
    let correctedText = await callOpenAIWithRetry(trimmedText, language);
    
    // Critical post-processing (language-aware)
    correctedText = applyComprehensivePostProcessing(correctedText, trimmedText, language);
    
    const duration = performance.now() - startTime;
    
    // Logging
    console.log(`[PUNCTUATION] ✓ Corrected in ${duration.toFixed(0)}ms`);
    if (correctedText !== trimmedText) {
      console.log(`[PUNCTUATION] Before: "${trimmedText}"`);
      console.log(`[PUNCTUATION] After:  "${correctedText}"`);
    } else {
      console.log(`[PUNCTUATION] No changes needed`);
    }

    // Cache the result
    addToCache(cacheKey, correctedText);

    return correctedText;

  } catch (error) {
    console.error('[PUNCTUATION] ✗ Failed:', error.message);
    // Graceful fallback - return original text
    return trimmedText;
  }
}

/**
 * Call OpenAI API with retry logic
 */
async function callOpenAIWithRetry(text, language, retries = CONFIG.MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await callOpenAIAPI(text, language);
    } catch (error) {
      console.warn(`[PUNCTUATION] Attempt ${attempt}/${retries} failed:`, error.message);
      
      if (attempt === retries) {
        throw error; // Final attempt failed
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, attempt * 500));
    }
  }
}

/**
 * Call OpenAI API with enhanced prompt
 */
async function callOpenAIAPI(text, language) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: buildSystemPrompt(language)
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: CONFIG.TEMPERATURE,
        max_tokens: 1000,
        top_p: CONFIG.TOP_P,
        frequency_penalty: CONFIG.FREQUENCY_PENALTY,
        presence_penalty: CONFIG.PRESENCE_PENALTY
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('OpenAI API timeout');
    }
    
    throw error;
  }
}

/**
 * Build comprehensive system prompt for fragment-aware punctuation
 */
function buildSystemPrompt(language) {
  return `You are an expert punctuation correction specialist for ${language}. You fix punctuation in LIVE SPEECH that arrives in small 8-word chunks.

🎯 PRIMARY OBJECTIVE:
Add proper punctuation ONLY where appropriate. Be EXTREMELY conservative with ending punctuation.

⚠️ CRITICAL RULES - FOLLOW EXACTLY:

1. **NEVER change, add, or remove ANY words** - ONLY adjust punctuation
2. **This is a FRAGMENT** - NOT a complete sentence
3. **BE ULTRA-CONSERVATIVE** - When in doubt, DO NOT add ending punctuation
4. **Fragments continue** - The next chunk will continue this thought

🚫 NEVER ADD PERIOD IF TEXT ENDS WITH:

**Conjunctions:**
- "and", "or", "but", "so", "because", "while", "though", "if"
- "and I", "and he", "and she", "and they", "and we"

**Incomplete verb phrases:**
- "I am", "you are", "he is", "she is", "they are", "we are"
- "I was", "you were", "he was", "she was", "they were"
- "I have", "you have", "he has", "she has", "they have"
- "I will", "you will", "he will", "she will", "they will"

**Incomplete expressions:**
- "I hope", "I hope you", "I hope you do", "I think", "I believe"
- "let me", "tell me", "give me", "show me"
- "I want", "I need", "I like", "I love"

**Prepositions (always incomplete):**
- "to", "at", "in", "on", "from", "with", "by", "for"
- "of", "about", "after", "before", "under", "over"

**Adjectives without nouns:**
- "a great", "a good", "a bad", "the best", "the worst"
- "very good", "so much", "too much", "many more"

**Question words:**
- "who", "what", "where", "when", "why", "how", "which"

**Articles and possessives:**
- "the", "a", "an", "my", "your", "his", "her", "their", "our"

✅ ONLY ADD ENDING PUNCTUATION IF:

1. **Complete sentence** with clear ending:
   - "I live in my house" ✓
   - "Hello everyone" ✓
   - "Thank you very much" ✓

2. **Complete question** that makes standalone sense:
   - "How are you" → "How are you?"
   - "What is your name" → "What is your name?"

3. **Clear ending indicators:**
   - Ends with nouns: "house", "school", "today", "here", "there"
   - Ends with complete actions: "done", "finished", "ready", "okay"

📝 INTERNAL PUNCTUATION (Always okay):

- Add commas for natural pauses: "Hello everyone, how are you"
- Add commas in lists: "Tom, Dick, and Harry"
- Capitalize first word: "hello" → "Hello"

❌ EXAMPLES OF WHAT NOT TO DO:

"my name is Aman Sharma and I am" 
→ ❌ "My name is Aman Sharma, and I am."  [WRONG - has period]
→ ✅ "My name is Aman Sharma and I am"    [CORRECT - no period]

"I hope you do"
→ ❌ "I hope you do."  [WRONG - incomplete thought]
→ ✅ "I hope you do"   [CORRECT - will continue]

"that's why you're doing a great"
→ ❌ "That's why you're doing a great." [WRONG - incomplete]
→ ✅ "That's why you're doing a great"  [CORRECT - expecting noun]

"I am from India and I"
→ ❌ "I am from India, and I." [WRONG - has period]
→ ✅ "I am from India and I"   [CORRECT - no period]

✅ EXAMPLES OF CORRECT PUNCTUATION:

"hello everyone how are you all"
→ ✅ "Hello everyone, how are you all?" [Complete question]

"I live in my house"
→ ✅ "I live in my house." [Complete sentence]

"my name is Aman Sharma"
→ ✅ "My name is Aman Sharma." [Complete thought]

"thank you very much"
→ ✅ "Thank you very much." [Complete expression]

🎭 PUNCTUATION RULES:

- Use **ONLY ONE** question mark: "How are you?" NOT "How are you???"
- Use **ONLY ONE** exclamation: "Great!" NOT "Great!!!"
- Use commas naturally: "Yes, I am here"
- Capitalize first word always
- Use ${language} punctuation conventions

🔑 KEY PRINCIPLE:
**When in doubt, DO NOT add ending punctuation. It's better to under-punctuate than over-punctuate fragments.**

Return ONLY the corrected text. No explanations, no notes, no extra text.`;
}

/**
 * Comprehensive post-processing to fix any GPT mistakes
 */
function applyComprehensivePostProcessing(text, originalText, language = 'en') {
  let fixed = text;
  
  // Step 1: Fix multiple punctuation marks
  fixed = fixMultiplePunctuation(fixed);
  
  // Step 2: Remove periods from incomplete endings (language-aware)
  fixed = removeIncompleteEndings(fixed, language);
  
  // Step 3: Fix split proper nouns (language-aware)
  fixed = fixSplitProperNouns(fixed, language);
  
  // Step 4: Fix common phrase splits (language-aware)
  fixed = fixCommonPhrases(fixed, language);
  
  // Step 5: Fix capitalization issues
  fixed = fixCapitalization(fixed);
  
  // Step 6: Clean up spacing
  fixed = cleanSpacing(fixed);
  
  // Step 7: Validate the result
  fixed = validateResult(fixed, originalText);
  
  return fixed.trim();
}

/**
 * Fix multiple punctuation marks (???, !!!)
 */
function fixMultiplePunctuation(text) {
  let fixed = text;
  
  // Fix multiple question marks
  fixed = fixed.replace(/\?{2,}/g, '?');
  
  // Fix multiple exclamation marks
  fixed = fixed.replace(/!{2,}/g, '!');
  
  // Fix multiple periods (ellipsis okay, but not ...)
  fixed = fixed.replace(/\.{4,}/g, '...');
  
  // Fix mixed punctuation
  fixed = fixed.replace(/[?!]{2,}/g, (match) => match[0]);
  
  if (fixed !== text) {
    console.log('[POST-PROCESS] Fixed multiple punctuation');
  }
  
  return fixed;
}

/**
 * Get language-specific incomplete patterns
 */
function getLanguageSpecificPatterns(language = 'en') {
  const patterns = {
    // English patterns
    'en': [
      // Conjunctions
      /\band\.\s*$/i, /\bor\.\s*$/i, /\bbut\.\s*$/i, /\bso\.\s*$/i,
      /\bbecause\.\s*$/i, /\bwhile\.\s*$/i, /\bthough\.\s*$/i, /\bif\.\s*$/i,
      // Incomplete verbs
      /\bI am\.\s*$/i, /\byou are\.\s*$/i, /\bhe is\.\s*$/i, /\bshe is\.\s*$/i,
      /\bI was\.\s*$/i, /\bI have\.\s*$/i, /\bI will\.\s*$/i,
      // Prepositions
      /\bto\.\s*$/i, /\bat\.\s*$/i, /\bin\.\s*$/i, /\bon\.\s*$/i, /\bfrom\.\s*$/i,
    ],
    
    // Hindi patterns (हिंदी)
    'hi': [
      /\bऔर\.\s*$/i,        // and (aur)
      /\bया\.\s*$/i,         // or (ya)
      /\bपर\.\s*$/i,         // but (par)
      /\bक्योंकि\.\s*$/i,    // because (kyonki)
      /\bमैं हूँ\.\s*$/i,    // I am (main hoon)
      /\bवह है\.\s*$/i,      // he/she is (vah hai)
      /\bमें\.\s*$/i,        // in (mein)
      /\bसे\.\s*$/i,         // from (se)
      /\bको\.\s*$/i,         // to (ko)
    ],
    
    // Spanish patterns (Español)
    'es': [
      /\by\.\s*$/i,          // and
      /\bo\.\s*$/i,          // or
      /\bpero\.\s*$/i,       // but
      /\bporque\.\s*$/i,     // because
      /\bsoy\.\s*$/i,        // I am
      /\beres\.\s*$/i,       // you are
      /\ben\.\s*$/i,         // in
      /\bde\.\s*$/i,         // from/of
      /\ba\.\s*$/i,          // to
    ],
    
    // Portuguese patterns (Português)
    'pt': [
      /\be\.\s*$/i,          // and
      /\bou\.\s*$/i,         // or
      /\bmas\.\s*$/i,        // but
      /\bporque\.\s*$/i,     // because
      /\bsou\.\s*$/i,        // I am
      /\bem\.\s*$/i,         // in
      /\bde\.\s*$/i,         // from/of
      /\ba\.\s*$/i,          // to
    ],
    
    // Punjabi patterns (ਪੰਜਾਬੀ)
    'pa': [
      /\bਅਤੇ\.\s*$/i,        // and (ate)
      /\bਜਾਂ\.\s*$/i,        // or (jaan)
      /\bਪਰ\.\s*$/i,         // but (par)
      /\bਮੈਂ ਹਾਂ\.\s*$/i,    // I am (main haan)
      /\bਵਿੱਚ\.\s*$/i,       // in (vich)
      /\bਤੋਂ\.\s*$/i,        // from (ton)
    ],
    
    // French patterns (Français)
    'fr': [
      /\bet\.\s*$/i,         // and
      /\bou\.\s*$/i,         // or
      /\bmais\.\s*$/i,       // but
      /\bparce que\.\s*$/i,  // because
      /\bje suis\.\s*$/i,    // I am
      /\bdans\.\s*$/i,       // in
      /\bde\.\s*$/i,         // from/of
      /\bà\.\s*$/i,          // to
    ],
    
    // German patterns (Deutsch)
    'de': [
      /\bund\.\s*$/i,        // and
      /\boder\.\s*$/i,       // or
      /\baber\.\s*$/i,       // but
      /\bweil\.\s*$/i,       // because
      /\bich bin\.\s*$/i,    // I am
      /\bin\.\s*$/i,         // in
      /\bvon\.\s*$/i,        // from
      /\bzu\.\s*$/i,         // to
    ],
    
    // Chinese patterns (中文)
    'zh': [
      /和\。\s*$/i,          // and (hé)
      /或\。\s*$/i,          // or (huò)
      /但\。\s*$/i,          // but (dàn)
      /因为\。\s*$/i,        // because (yīnwèi)
      /我是\。\s*$/i,        // I am (wǒ shì)
      /在\。\s*$/i,          // in/at (zài)
      /从\。\s*$/i,          // from (cóng)
    ],
    
    // Arabic patterns (العربية)
    'ar': [
      /\bو\.\s*$/i,          // and (wa)
      /\bأو\.\s*$/i,         // or (aw)
      /\bلكن\.\s*$/i,        // but (lakin)
      /\bلأن\.\s*$/i,        // because (li'anna)
      /\bأنا\.\s*$/i,        // I (ana)
      /\bفي\.\s*$/i,         // in (fi)
      /\bمن\.\s*$/i,         // from (min)
    ],
  };
  
  // Return language-specific patterns, fallback to English
  return patterns[language] || patterns['en'];
}

/**
 * Remove periods from clearly incomplete endings
 */
function removeIncompleteEndings(text, language = 'en') {
  // Get base English patterns (universal)
  const incompletePatterns = [
    // Conjunctions
    /\band\.\s*$/i,
    /\bor\.\s*$/i,
    /\bbut\.\s*$/i,
    /\bso\.\s*$/i,
    /\bbecause\.\s*$/i,
    /\bwhile\.\s*$/i,
    /\bthough\.\s*$/i,
    /\bif\.\s*$/i,
    
    // Conjunctions + pronouns
    /\band I\.\s*$/i,
    /\band he\.\s*$/i,
    /\band she\.\s*$/i,
    /\band they\.\s*$/i,
    /\band we\.\s*$/i,
    /\bor I\.\s*$/i,
    /\bbut I\.\s*$/i,
    
    // Incomplete verb phrases
    /\bI am\.\s*$/i,
    /\byou are\.\s*$/i,
    /\bhe is\.\s*$/i,
    /\bshe is\.\s*$/i,
    /\bthey are\.\s*$/i,
    /\bwe are\.\s*$/i,
    /\bI was\.\s*$/i,
    /\byou were\.\s*$/i,
    /\bhe was\.\s*$/i,
    /\bshe was\.\s*$/i,
    /\bI have\.\s*$/i,
    /\byou have\.\s*$/i,
    /\bhe has\.\s*$/i,
    /\bshe has\.\s*$/i,
    /\bI will\.\s*$/i,
    /\byou will\.\s*$/i,
    
    // Incomplete expressions
    /\bI hope\.\s*$/i,
    /\bI hope you\.\s*$/i,
    /\bI hope you do\.\s*$/i,
    /\bI think\.\s*$/i,
    /\bI believe\.\s*$/i,
    /\blet me\.\s*$/i,
    /\btell me\.\s*$/i,
    /\bgive me\.\s*$/i,
    /\bshow me\.\s*$/i,
    /\bI want\.\s*$/i,
    /\bI need\.\s*$/i,
    /\bI like\.\s*$/i,
    /\bI love\.\s*$/i,
    
    // Prepositions
    /\bto\.\s*$/i,
    /\bat\.\s*$/i,
    /\bin\.\s*$/i,
    /\bon\.\s*$/i,
    /\bfrom\.\s*$/i,
    /\bwith\.\s*$/i,
    /\bby\.\s*$/i,
    /\bfor\.\s*$/i,
    /\bof\.\s*$/i,
    /\babout\.\s*$/i,
    /\bafter\.\s*$/i,
    /\bbefore\.\s*$/i,
    /\bunder\.\s*$/i,
    /\bover\.\s*$/i,
    
    // Adjectives without nouns
    /\ba great\.\s*$/i,
    /\ba good\.\s*$/i,
    /\ba bad\.\s*$/i,
    /\bthe best\.\s*$/i,
    /\bthe worst\.\s*$/i,
    /\bvery good\.\s*$/i,
    /\bso much\.\s*$/i,
    /\btoo much\.\s*$/i,
    /\bmany more\.\s*$/i,
    
    // Articles and possessives
    /\bthe\.\s*$/i,
    /\ba\.\s*$/i,
    /\ban\.\s*$/i,
    /\bmy\.\s*$/i,
    /\byour\.\s*$/i,
    /\bhis\.\s*$/i,
    /\bher\.\s*$/i,
    /\btheir\.\s*$/i,
    /\bour\.\s*$/i,
    
    // Question words
    /\bwho\.\s*$/i,
    /\bwhat\.\s*$/i,
    /\bwhere\.\s*$/i,
    /\bwhen\.\s*$/i,
    /\bwhy\.\s*$/i,
    /\bhow\.\s*$/i,
    /\bwhich\.\s*$/i,
  ];
  
  // Add language-specific patterns
  const languagePatterns = getLanguageSpecificPatterns(language);
  const allPatterns = [...incompletePatterns, ...languagePatterns];
  
  let fixed = text;
  let changesMade = false;
  
  for (const pattern of allPatterns) {
    if (pattern.test(fixed)) {
      const before = fixed;
      fixed = fixed.replace(pattern, (match) => match.replace(/\.$/, ''));
      if (fixed !== before) {
        changesMade = true;
        console.log(`[POST-PROCESS] Removed period from: "${match.trim()}"`);
      }
    }
  }
  
  return fixed;
}

/**
 * Fix split proper nouns (especially place names)
 */
function fixSplitProperNouns(text, language = 'en') {
  const properNounsByLanguage = {
    // English / Hindi place names (common in sermons)
    'en': [
      // Indian states
      { pattern: /Himachal\.\s+Pradesh/gi, fix: 'Himachal Pradesh' },
      { pattern: /Uttar\.\s+Pradesh/gi, fix: 'Uttar Pradesh' },
      { pattern: /Madhya\.\s+Pradesh/gi, fix: 'Madhya Pradesh' },
      { pattern: /Andhra\.\s+Pradesh/gi, fix: 'Andhra Pradesh' },
      { pattern: /Arunachal\.\s+Pradesh/gi, fix: 'Arunachal Pradesh' },
      { pattern: /Tamil\.\s+Nadu/gi, fix: 'Tamil Nadu' },
      { pattern: /West\.\s+Bengal/gi, fix: 'West Bengal' },
      // Common place names
      { pattern: /New\.\s+York/gi, fix: 'New York' },
      { pattern: /New\.\s+Delhi/gi, fix: 'New Delhi' },
      { pattern: /Los\.\s+Angeles/gi, fix: 'Los Angeles' },
      { pattern: /San\.\s+Francisco/gi, fix: 'San Francisco' },
      // Religious terms
      { pattern: /Jesus\.\s+Christ/gi, fix: 'Jesus Christ' },
      { pattern: /Holy\.\s+Spirit/gi, fix: 'Holy Spirit' },
    ],
    'hi': [
      // Same as English (these are used in Hindi too)
      { pattern: /Himachal\.\s+Pradesh/gi, fix: 'Himachal Pradesh' },
      { pattern: /Uttar\.\s+Pradesh/gi, fix: 'Uttar Pradesh' },
      { pattern: /Tamil\.\s+Nadu/gi, fix: 'Tamil Nadu' },
    ],
    'pa': [
      // Punjabi place names
      { pattern: /Himachal\.\s+Pradesh/gi, fix: 'Himachal Pradesh' },
    ],
    'es': [
      // Spanish place names
      { pattern: /Los\.\s+Angeles/gi, fix: 'Los Angeles' },
      { pattern: /San\.\s+Francisco/gi, fix: 'San Francisco' },
    ],
  };
  
  // Get proper nouns for language, fallback to English
  const properNounFixes = properNounsByLanguage[language] || properNounsByLanguage['en'];
  
  let fixed = text;
  
  for (const { pattern, fix } of properNounFixes) {
    if (pattern.test(fixed)) {
      fixed = fixed.replace(pattern, fix);
      console.log(`[POST-PROCESS] Fixed proper noun: "${fix}"`);
    }
  }
  
  return fixed;
}

/**
 * Fix common phrase splits
 */
function fixCommonPhrases(text, language = 'en') {
  const phrasesByLanguage = {
    'en': [
      { pattern: /\bat\.\s+all\b/gi, fix: 'at all' },
      { pattern: /\bnot\.\s+at\s+all\b/gi, fix: 'not at all' },
      { pattern: /\bof\.\s+course\b/gi, fix: 'of course' },
      { pattern: /\bthank\.\s+you\b/gi, fix: 'thank you' },
      { pattern: /\blet\.\s+me\b/gi, fix: 'let me' },
      { pattern: /\btell\.\s+me\b/gi, fix: 'tell me' },
      { pattern: /\bgive\.\s+me\b/gi, fix: 'give me' },
      { pattern: /\bshow\.\s+me\b/gi, fix: 'show me' },
      { pattern: /\bhelp\.\s+me\b/gi, fix: 'help me' },
      { pattern: /\beach\.\s+other\b/gi, fix: 'each other' },
      { pattern: /\bone\.\s+another\b/gi, fix: 'one another' },
    ],
    'hi': [
      { pattern: /\bबिल्कुल\.\s+नहीं\b/gi, fix: 'बिल्कुल नहीं' }, // not at all
      { pattern: /\bधन्यवाद\b/gi, fix: 'धन्यवाद' }, // thank you (usually one word)
    ],
    'es': [
      { pattern: /\bpor\.\s+favor\b/gi, fix: 'por favor' }, // please
      { pattern: /\bmuchas\.\s+gracias\b/gi, fix: 'muchas gracias' }, // thank you very much
      { pattern: /\bde\.\s+nada\b/gi, fix: 'de nada' }, // you're welcome
    ],
    'pt': [
      { pattern: /\bpor\.\s+favor\b/gi, fix: 'por favor' }, // please
      { pattern: /\bmuito\.\s+obrigado\b/gi, fix: 'muito obrigado' }, // thank you very much
    ],
    'fr': [
      { pattern: /\bs'il\.\s+vous\s+plaît\b/gi, fix: "s'il vous plaît" }, // please
      { pattern: /\bmerci\.\s+beaucoup\b/gi, fix: 'merci beaucoup' }, // thank you very much
    ],
  };
  
  // Get phrases for language, fallback to English
  const phraseFixes = phrasesByLanguage[language] || phrasesByLanguage['en'];
  
  let fixed = text;
  
  for (const { pattern, fix } of phraseFixes) {
    if (pattern.test(fixed)) {
      fixed = fixed.replace(pattern, fix);
      console.log(`[POST-PROCESS] Fixed phrase: "${fix}"`);
    }
  }
  
  return fixed;
}

/**
 * Fix capitalization issues
 */
function fixCapitalization(text) {
  let fixed = text;
  
  // Capitalize first letter
  fixed = fixed.charAt(0).toUpperCase() + fixed.slice(1);
  
  // Fix "the. Great" → "the great"
  fixed = fixed.replace(/\bthe\.\s+([A-Z])/g, (match, letter) => {
    return `the ${letter}`;
  });
  
  // Fix "doing the. Great" → "doing the great"
  fixed = fixed.replace(/([a-z]+)\s+the\.\s+([A-Z][a-z]+)/g, (match, word1, word2) => {
    return `${word1} the ${word2}`;
  });
  
  return fixed;
}

/**
 * Clean up spacing issues
 */
function cleanSpacing(text) {
  let fixed = text;
  
  // Fix multiple spaces
  fixed = fixed.replace(/\s{2,}/g, ' ');
  
  // Fix space before punctuation
  fixed = fixed.replace(/\s+([.,!?;:])/g, '$1');
  
  // Ensure space after punctuation (but not at end)
  fixed = fixed.replace(/([.,!?;:])([A-Za-z])/g, '$1 $2');
  
  // Fix space before apostrophe
  fixed = fixed.replace(/\s+'/g, "'");
  
  return fixed;
}

/**
 * Validate result - ensure we didn't break anything
 */
function validateResult(correctedText, originalText) {
  // Count words in both
  const originalWords = originalText.trim().split(/\s+/);
  const correctedWords = correctedText.trim().split(/\s+/).filter(w => w.length > 0);
  
  // Word count should be similar (allowing for punctuation removal)
  const wordCountDiff = Math.abs(originalWords.length - correctedWords.length);
  
  if (wordCountDiff > 2) {
    console.warn('[VALIDATION] Word count changed significantly!');
    console.warn(`Original: ${originalWords.length} words, Corrected: ${correctedWords.length} words`);
    // Return original if too different
    return originalText;
  }
  
  // Check if corrected text is not just punctuation
  if (correctedWords.length === 0) {
    console.warn('[VALIDATION] Corrected text is empty!');
    return originalText;
  }
  
  return correctedText;
}

/**
 * Add result to LRU cache
 */
function addToCache(key, value) {
  // If cache is full, remove oldest entry (FIFO)
  if (punctuationCache.size >= CONFIG.MAX_CACHE_SIZE) {
    const firstKey = punctuationCache.keys().next().value;
    punctuationCache.delete(firstKey);
    console.log('[CACHE] Evicted oldest entry');
  }
  
  punctuationCache.set(key, value);
}

/**
 * Legacy function name for backward compatibility
 */
export async function addPunctuation(text, language) {
  return correctPunctuation(text, language);
}

/**
 * Clear the punctuation cache
 */
export function clearPunctuationCache() {
  punctuationCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  console.log('[CACHE] Cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const total = cacheHits + cacheMisses;
  const hitRate = total > 0 ? ((cacheHits / total) * 100).toFixed(1) : '0.0';
  
  return {
    size: punctuationCache.size,
    maxSize: CONFIG.MAX_CACHE_SIZE,
    hits: cacheHits,
    misses: cacheMisses,
    hitRate: `${hitRate}%`,
    total: total
  };
}

/**
 * Batch correction for multiple texts (advanced use)
 */
export async function correctPunctuationBatch(items) {
  console.log(`[PUNCTUATION] Batch processing ${items.length} items`);
  
  const results = await Promise.all(
    items.map(item => correctPunctuation(item.text, item.language))
  );
  
  return results;
}

/**
 * Get estimated cost for punctuation correction
 * @param {number} wordCount - Number of words to correct
 * @returns {string} - Estimated cost in USD
 */
export function estimateCost(wordCount) {
  // GPT-4o-mini: $0.150/1M input, $0.600/1M output
  // System prompt: ~400 tokens
  // Average text: ~15 tokens
  // Total input: ~415 tokens
  // Average output: ~15 tokens
  
  const chunks = Math.ceil(wordCount / 8); // 8 words per chunk
  const inputTokens = chunks * 415;
  const outputTokens = chunks * 15;
  
  const inputCost = (inputTokens / 1000000) * 0.150;
  const outputCost = (outputTokens / 1000000) * 0.600;
  const totalCost = inputCost + outputCost;
  
  return `$${totalCost.toFixed(4)}`;
}

/**
 * Health check - verify API key is configured
 * @returns {boolean} - True if service is properly configured
 */
export function healthCheck() {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'undefined') {
    console.error('[PUNCTUATION] OpenAI API key not configured!');
    return false;
  }
  
  console.log('[PUNCTUATION] Service healthy ✓');
  return true;
}

/**
 * Pre-warm cache with common phrases (optional optimization)
 * @param {Array<string>} phrases - Common phrases to cache
 * @param {string} language - Language code
 */
export async function preWarmCache(phrases, language) {
  console.log(`[CACHE] Pre-warming with ${phrases.length} phrases...`);
  
  for (const phrase of phrases) {
    await correctPunctuation(phrase, language);
  }
  
  console.log(`[CACHE] Pre-warming complete. Cache size: ${punctuationCache.size}`);
}

// Export all functions
export default {
  correctPunctuation,
  addPunctuation,
  clearPunctuationCache,
  getCacheStats,
  correctPunctuationBatch,
  estimateCost,
  healthCheck,
  preWarmCache

};
