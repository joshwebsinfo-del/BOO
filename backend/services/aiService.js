const axios = require('axios');
require('dotenv').config();

// Timeout helper with AbortController
async function fetchWithTimeout(url, options, timeoutMs = 10000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeout);
        return response;
    } catch (err) {
        clearTimeout(timeout);
        throw err;
    }
}

// Highly reliable fetch call helper with automatic retry logic
async function fetchWithRetry(url, options, timeoutMs = 10000, maxRetries = 2) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[AI Backend]: Attempting API call (Attempt ${attempt}/${maxRetries}) to ${url.substring(0, 60)}...`);
            const response = await fetchWithTimeout(url, options, timeoutMs);
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP Error ${response.status}: ${text}`);
            }
            return response;
        } catch (err) {
            console.warn(`[AI Backend warning]: Attempt ${attempt} failed: ${err.message}`);
            lastError = err;
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, attempt * 500));
            }
        }
    }
    throw lastError;
}

// 1. Google Gemini API integration
async function tryGemini(prompt, subject, context) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not defined.');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const systemPrompt = `You are EduMentor, a highly skilled academic tutor at Kwekwe Poly.
Subject: ${subject || 'General Education'}
Context details: ${context || 'None'}
Answer the following query clearly with step-by-step breakdowns, code formatting if applicable, and terminology:`;

    const body = {
        contents: [
            {
                parts: [
                    { text: `${systemPrompt}\n\nStudent Query: "${prompt}"` }
                ]
            }
        ]
    };

    const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    }, 12000, 2);

    const json = await response.json();
    if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts[0]) {
        return json.candidates[0].content.parts[0].text;
    }
    throw new Error('Unexpected Google Gemini payload format.');
}

// 2. Groq API integration
async function tryGroq(prompt, subject, context) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is not defined.');

    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const systemPrompt = `You are EduMentor, a highly skilled academic tutor at Kwekwe Poly.
Subject: ${subject || 'General Education'}
Context details: ${context || 'None'}
Answer the student query step-by-step. Use code formatting and terminology where appropriate.`;

    const body = {
        model: 'llama-3.3-70b-versatile',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ]
    };

    const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
    }, 12000, 2);

    const json = await response.json();
    if (json.choices && json.choices[0] && json.choices[0].message) {
        return json.choices[0].message.content;
    }
    throw new Error('Unexpected Groq payload format.');
}

// 3. OpenRouter API integration
async function tryOpenRouter(prompt, subject, context) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is not defined.');

    const url = 'https://openrouter.ai/api/v1/chat/completions';
    const systemPrompt = `You are EduMentor, a highly skilled academic tutor at Kwekwe Poly.
Subject: ${subject || 'General Education'}
Context: ${context || 'None'}`;

    const models = ['deepseek/deepseek-r1', 'meta-llama/llama-3.1-8b-instruct:free'];
    let lastError;

    for (const model of models) {
        try {
            console.log(`[OpenRouter]: Trying OpenRouter model ${model}...`);
            const body = {
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ]
            };

            const response = await fetchWithRetry(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://edumentor.smis.production',
                    'X-Title': 'EduMentor AI'
                },
                body: JSON.stringify(body)
            }, 12000, 1);

            const json = await response.json();
            if (json.choices && json.choices[0] && json.choices[0].message) {
                return {
                    text: json.choices[0].message.content,
                    modelUsed: model
                };
            }
            throw new Error('Unexpected OpenRouter response payload layout.');
        } catch (err) {
            console.warn(`[OpenRouter Model Failed] ${model}: ${err.message}`);
            lastError = err;
        }
    }
    throw lastError;
}

// Main cascading cascade caller
async function getCascadeAIResponse(message, subject, context) {
    try {
        console.log('[AI Cascade]: Attempting Gemini 2.0 Flash...');
        const answer = await tryGemini(message, subject, context);
        return { answer, model: 'gemini-2.0-flash' };
    } catch (geminiError) {
        console.error(`[AI Cascade Gemini Error]: ${geminiError.message}`);
        try {
            console.log('[AI Cascade]: Falling back to Groq Llama 3.3...');
            const answer = await tryGroq(message, subject, context);
            return { answer, model: 'llama-3.3-70b-versatile' };
        } catch (groqError) {
            console.error(`[AI Cascade Groq Error]: ${groqError.message}`);
            try {
                console.log('[AI Cascade]: Falling back to OpenRouter DeepSeek R1...');
                const result = await tryOpenRouter(message, subject, context);
                return { answer: result.text, model: result.modelUsed };
            } catch (openRouterError) {
                console.error(`[AI Cascade OpenRouter Error]: ${openRouterError.message}`);
                throw new Error('All AI service providers are currently offline. Please contact Kwekwe Poly IT admin.');
            }
        }
    }
}

module.exports = { getCascadeAIResponse };
