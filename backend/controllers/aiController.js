const { getCascadeAIResponse } = require('../services/aiService');
const { supabase } = require('../config/supabase');

async function chat(req, res, next) {
    try {
        const { message, subject, context } = req.body;
        const userEmail = req.user ? req.user.email : 'student@kwekwe.ac.zw';

        const aiResult = await getCascadeAIResponse(message, subject, context);

        // Store chat log in Supabase
        try {
            await supabase
                .from('ai_conversations')
                .insert({
                    question: message,
                    answer: aiResult.answer,
                    ai_model_used: aiResult.model,
                    subject: subject || 'General Education'
                });
        } catch (dbErr) {
            console.warn('⚠️ Supabase db insert bypassed / offline:', dbErr.message);
        }

        res.json({
            answer: aiResult.answer,
            model: aiResult.model,
            success: true
        });
    } catch (err) {
        next(err);
    }
}

async function explain(req, res, next) {
    try {
        const { topic } = req.body;
        const prompt = `Explain the academic topic "${topic}" in detail with examples and step-by-step reasoning.`;
        const aiResult = await getCascadeAIResponse(prompt, 'Explainer Hub', '');
        res.json({ answer: aiResult.answer, model: aiResult.model });
    } catch (err) {
        next(err);
    }
}

async function summarize(req, res, next) {
    try {
        const { text } = req.body;
        const prompt = `Summarize the following lecture study text concisely: "${text}"`;
        const aiResult = await getCascadeAIResponse(prompt, 'Summarization Hub', '');
        res.json({ answer: aiResult.answer, model: aiResult.model });
    } catch (err) {
        next(err);
    }
}

async function getHistory(req, res, next) {
    try {
        const { data, error } = await supabase
            .from('ai_conversations')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    chat,
    explain,
    summarize,
    getHistory
};
