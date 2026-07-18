const { supabase } = require('../config/supabase');

async function getProfile(req, res, next) {
    try {
        const userId = req.user ? req.user.id : null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            // Return default mock user profile if DB row is not created yet
            return res.json({
                full_name: req.user ? req.user.full_name : 'Kwekwe Poly Student',
                email: req.user ? req.user.email : 'student@kwekwe.ac.zw',
                course: 'Information Technology',
                studentNo: 'KP-2026-993F'
            });
        }

        res.json(data);
    } catch (err) {
        next(err);
    }
}

async function updateProfile(req, res, next) {
    try {
        const userId = req.user ? req.user.id : null;
        const { full_name, course, year_of_study } = req.body;

        const { data, error } = await supabase
            .from('profiles')
            .upsert({
                user_id: userId,
                full_name,
                course,
                year_of_study
            })
            .select()
            .single();

        if (error) throw error;
        res.json({ message: 'Profile updated successfully', profile: data });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getProfile,
    updateProfile
};
