const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const { JWT_SECRET } = require('../middleware/auth');

async function register(req, res, next) {
    try {
        const { email, password, full_name, role, studentNo } = req.body;

        // Register in Supabase auth natively
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password
        });

        if (authError) throw authError;

        const finalRole = role || 'Student';

        // Create the real corresponding profile row in public schema database
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                user_id: authData.user?.id,
                full_name,
                email,
                course: 'Information Technology',
                year_of_study: '2026',
                role: finalRole,
                student_no: studentNo || 'KP-2026-993F'
            });

        if (profileError) throw profileError;

        const payload = {
            id: authData.user?.id,
            email,
            role: finalRole,
            full_name,
            studentNo: studentNo || 'KP-2026-993F'
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'User registered successfully with authentic credentials',
            token,
            user: payload
        });
    } catch (err) {
        next(err);
    }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        // Authenticate strictly against real Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Fetch corresponding profile role dynamically from live database
        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('role, full_name, student_no')
            .eq('user_id', data.user?.id)
            .maybeSingle();

        const role = profile ? profile.role : 'Student';
        const full_name = profile ? profile.full_name : (email.split('@')[0]);
        const studentNo = profile ? profile.student_no : 'KP-2026-993F';

        const payload = {
            id: data.user?.id,
            email,
            role,
            full_name,
            studentNo
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Logged in successfully against Supabase Auth',
            token,
            user: payload
        });
    } catch (err) {
        next(err);
    }
}

async function logout(req, res, next) {
    try {
        await supabase.auth.signOut();
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        next(err);
    }
}

async function getCurrentUser(req, res, next) {
    try {
        res.json({ user: req.user });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    register,
    login,
    logout,
    getCurrentUser
};
