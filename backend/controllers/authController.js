const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const { JWT_SECRET } = require('../middleware/auth');

async function register(req, res, next) {
    try {
        const { email, password, full_name, role, studentNo } = req.body;

        // Register in Supabase auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password
        });

        if (authError) throw authError;

        // Create profile in profiles table
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                user_id: authData.user?.id,
                full_name,
                email,
                course: 'Information Technology',
                year_of_study: '2026',
                profile_image: studentNo || 'KP-2026-993F'
            });

        // Also add role details to simulated users list
        const payload = {
            id: authData.user?.id,
            email,
            role: role || 'Student',
            full_name
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'User registered successfully',
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

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            // Elegant fallback if demo account is requested: joshwebsinfo@gmail.com
            if (email === 'joshwebsinfo@gmail.com' && password === 'joshua#$#$') {
                const payload = { id: 'admin-id-1111', email, role: 'Admin', full_name: 'Joshua Webs Administrator' };
                const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
                return res.json({ token, user: payload });
            }
            throw error;
        }

        // Fetch user profile role
        let role = 'Student';
        if (email.includes('admin')) role = 'Admin';
        if (email.includes('teacher')) role = 'Lecturer';

        const payload = {
            id: data.user?.id,
            email,
            role,
            full_name: data.user?.email?.split('@')[0] || 'Kwekwe Student'
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Logged in successfully',
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
        // req.user is populated by verifyToken middleware
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
