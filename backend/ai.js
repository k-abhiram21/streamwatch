import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Ensure dotenv is loaded
dotenv.config();

// Initialize with lazy loading to ensure env vars are loaded
let genAI = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Converts a natural language question into a MongoDB query
 * @param {string} question - Natural language question
 * @returns {Promise<{query: object, type: string}>} - MongoDB query object and type
 */
export async function convertToMongoQuery(question) {
  try {
    const model = getGenAI().getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a MongoDB query generator. Convert the following natural language question into a valid MongoDB query.

Rules:
1. Return ONLY a valid JSON object with this exact structure:
   {
     "type": "find" or "aggregate",
     "query": { ... } // MongoDB query object
   }

2. For "find" queries, use the structure: { "filter": {...}, "projection": {...}, "sort": {...}, "limit": number }
   Example: { "filter": { "temperature": { "$gt": 50 } }, "sort": { "timestamp": -1 }, "limit": 10 }
   
3. For "aggregate" queries, return an array of pipeline stages in the "query" field
   Example: { "type": "aggregate", "query": [{ "$match": {...} }, { "$group": {...} }] }

4. The collection name is "sensor_data" (you don't need to include it in the query)
5. Common fields: temperature (Number), water_level (Number), power_stats.voltage (Number), power_stats.current (Number), power_stats.wattage (Number), timestamp (Date), location (String)
6. Return ONLY the JSON, no explanations, no markdown, no code blocks, no backticks

Question: ${question}

Response (JSON only):`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Clean the response - remove markdown code blocks if present
    text = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    // Remove any leading/trailing whitespace and newlines
    text = text.replace(/^\s+|\s+$/g, '');

    // Try to extract JSON if wrapped in other text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    // Parse the JSON response
    const parsed = JSON.parse(text);

    if (parsed.type === 'aggregate') {
      return {
        type: 'aggregate',
        query: Array.isArray(parsed.query) ? parsed.query : (parsed.pipeline || [])
      };
    } else {
      // For find queries, ensure we have the proper structure
      return {
        type: 'find',
        query: parsed.query || {
          filter: parsed.filter || parsed,
          projection: parsed.projection || {},
          sort: parsed.sort || {},
          limit: parsed.limit || 100
        }
      };
    }
  } catch (error) {
    console.error('Error converting to MongoDB query:', error);
    throw new Error(`Failed to convert question to MongoDB query: ${error.message}`);
  }
}

/**
 * Generates a natural language explanation of the query result
 * @param {string} question - Original question
 * @param {object} query - MongoDB query used
 * @param {Array|object} result - Query result
 * @returns {Promise<string>} - Natural language explanation
 */
export async function generateNaturalLanguageAnswer(question, query, result) {
  try {
    const model = getGenAI().getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Given the following:
- Original question: ${question}
- MongoDB query used: ${JSON.stringify(query, null, 2)}
- Query result: ${JSON.stringify(result, null, 2)}

Provide a clear, concise natural language answer explaining what the data shows. Be specific about numbers and values found.

Answer:`;

    const result_response = await model.generateContent(prompt);
    const response = await result_response.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error generating natural language answer:', error);
    return `Found ${Array.isArray(result) ? result.length : 1} result(s) matching your query.`;
  }
}

