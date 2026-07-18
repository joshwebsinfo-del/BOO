const { uploadFileToSupabase, deleteFileFromSupabase } = require('../services/storageService');
const { supabase } = require('../config/supabase');

async function uploadResource(req, res, next) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { title, subject, course } = req.body;
        const uploadResult = await uploadFileToSupabase(req.file.buffer, req.file.originalname, req.file.mimetype);

        // Store file metadata in study_materials
        const { data, error } = await supabase
            .from('study_materials')
            .insert({
                title: title || req.file.originalname,
                subject: subject || 'General IT',
                course: course || 'Information Technology',
                file_url: uploadResult.publicUrl
            })
            .select();

        if (error) throw error;

        res.status(201).json({
            message: 'Resource uploaded successfully',
            resource: data[0]
        });
    } catch (err) {
        next(err);
    }
}

async function listResources(req, res, next) {
    try {
        const { data, error } = await supabase
            .from('study_materials')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        next(err);
    }
}

async function getResource(req, res, next) {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('study_materials')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        next(err);
    }
}

async function downloadResource(req, res, next) {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('study_materials')
            .select('file_url')
            .eq('id', id)
            .single();

        if (error) throw error;
        res.redirect(data.file_url);
    } catch (err) {
        next(err);
    }
}

async function deleteResource(req, res, next) {
    try {
        const { id } = req.params;

        // Remove DB metadata
        const { error } = await supabase
            .from('study_materials')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Resource deleted successfully' });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    uploadResource,
    listResources,
    getResource,
    downloadResource,
    deleteResource
};
