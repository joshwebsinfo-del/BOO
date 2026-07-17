const { supabase } = require('../config/supabase');

async function uploadFileToSupabase(fileBuffer, originalName, mimeType) {
    try {
        const uniqueFileName = `${Date.now()}_${originalName.replace(/\s+/g, '_')}`;

        const { data, error } = await supabase.storage
            .from('resources')
            .upload(uniqueFileName, fileBuffer, {
                contentType: mimeType,
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Retrieve public URL
        const { data: publicUrlData } = supabase.storage
            .from('resources')
            .getPublicUrl(uniqueFileName);

        return {
            path: data.path,
            publicUrl: publicUrlData.publicUrl
        };
    } catch (err) {
        console.error('Error uploading file to Supabase Storage:', err);
        throw err;
    }
}

async function deleteFileFromSupabase(filePath) {
    try {
        const { error } = await supabase.storage
            .from('resources')
            .remove([filePath]);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error deleting file from Supabase Storage:', err);
        throw err;
    }
}

module.exports = {
    uploadFileToSupabase,
    deleteFileFromSupabase
};
