const express = require('express');
const router = express.Router();
const upload = require('../config/multer.config');
const supabase = require('../config/supabase');
const { Buffer } = require('buffer');

const File = require('../models/files.models');
const authMiddleware = require('../middlewares/authe');

router.get('/home', authMiddleware, async (req, res) => {
    
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
        const { search } = req.query;
        const displayQuery = { user: req.user.userId };

        if (search) {
            // FIX: Implemented the search logic which was missing.
            displayQuery.originalName = { $regex: search, $options: 'i' };
        }

        const filesForDisplay = await File.find(displayQuery).sort({ createdAt: -1 });

        const allUserFiles = await File.find({ user: req.user.userId });
        const usedBytes = allUserFiles.reduce((sum, file) => sum + (file.size || 0), 0);

        const totalBytes = 500 * 1024 * 1024;
        const usedMB = (usedBytes / (1024 * 1024)).toFixed(2);
        const totalMB = 500;

        let percent = totalBytes > 0 ? Math.min((usedBytes / totalBytes) * 100, 100) : 0;
        percent = Math.round(percent);

        const uploadError = req.query.error;
        const uploadSuccess = req.query.success;

        res.render("home", { 
            files: filesForDisplay, 
            user: req.user, 
            usedMB, 
            totalMB, 
            percent,
            uploadError, 
            uploadSuccess,
            search: search || ''
        });
     
    } catch(err){
        console.error("Error in /home route:", err);
        res.status(500).send('Server error.'); // Sending a simple text/html error is fine here
    }
});

// This API route was already correct, no changes needed.
router.get('/api/files', authMiddleware, async (req, res) => {
    try {
        const { search } = req.query;
        const query = { user: req.user.userId };

        if (search) {
            query.originalName = { $regex: search, $options: 'i' };
        }

        const searchedFiles = await File.find(query).sort({ createdAt: -1 });

        const allUserFiles = await File.find({ user: req.user.userId });
        const usedBytes = allUserFiles.reduce((sum, file) => sum + (file.size || 0), 0);
        const totalBytes = 500 * 1024 * 1024;
        const usedMB = (usedBytes / (1024 * 1024)).toFixed(2);
        let percent = totalBytes > 0 ? Math.min((usedBytes / totalBytes) * 100, 100) : 0;

        res.json({
            files: searchedFiles,
            stats: {
                fileCount: allUserFiles.length,
                usedMB: usedMB,
                percent: Math.round(percent)
            }
        });
    } catch (err) {
        console.error("Error fetching files for API:", err);
        res.status(500).json({ error: 'Server error while fetching files.' });
    }
});

router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.redirect('/home?error=no_file_selected');
        }

        const totalLimitBytes = 500 * 1024 * 1024;
        const newFileSize = req.file.size;
        const userFiles = await File.find({ user: req.user.userId });
        const usedBytes = userFiles.reduce((sum, file) => sum + (file.size || 0), 0);

        if (usedBytes + newFileSize > totalLimitBytes) {
            return res.redirect('/home?error=storage_full');
        }

        const uploadedFile = req.file;
        const fileName = `${Date.now()}-${uploadedFile.originalname}`;

        const { error: supabaseError } = await supabase.storage
            .from('files')
            .upload(fileName, uploadedFile.buffer, {
                contentType: uploadedFile.mimetype,
            });
        
        if (supabaseError) {
            throw new Error(`Supabase upload failed: ${supabaseError.message}`);
        }

        try {
            await File.create({
                user: req.user.userId,
                originalName: uploadedFile.originalname,
                path: fileName, 
                size: uploadedFile.size,
                mimetype: uploadedFile.mimetype
            });
        } catch (dbError) {
            console.error("MongoDB save failed. Cleaning up from Supabase.", dbError);
            await supabase.storage.from('files').remove([fileName]);
            throw dbError;
        }

        return res.redirect('/home?success=true');

    } catch (err) {
        console.error("An error occurred during file upload:", err);
        // IMPROVEMENT: Redirect with a generic error for better UX on form submissions.
        return res.redirect('/home?error=upload_failed');
    }
});

// This download route was already correct, no changes needed.
router.get('/download/:path', authMiddleware, async (req, res) => {
    try {
        const fileRecord = await File.findOne({
            user: req.user.userId,
            path: req.params.path
        });

        if (!fileRecord) {
            return res.status(404).send('File not found or access denied.');
        }

        const { data, error } = await supabase.storage.from('files').download(req.params.path);
        if (error) throw error;

        const buffer = Buffer.from(await data.arrayBuffer());

        res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.originalName}"`);
        res.setHeader('Content-Type', fileRecord.mimetype);
        res.send(buffer);

    } catch (err) {
        console.error("Error downloading file:", err);
        res.status(500).send("Could not download the file.");
    }
});

router.post('/delete/:id', authMiddleware, async (req, res) => {
    try {
        const fileId = req.params.id;
        const userId = req.user.userId;

        const fileToDelete = await File.findById(fileId);

        if (!fileToDelete || fileToDelete.user.toString() !== userId) {
            return res.status(403).send("You do not have permission to delete this file.");
        }

        // IMPROVEMENT: Swapped the order of operations to prevent orphaned DB records.
        // 1. Delete the file metadata from MongoDB first.
        await File.findByIdAndDelete(fileId);

        // 2. If the DB deletion was successful, delete the file from Supabase Storage.
        const { error: supabaseError } = await supabase.storage
            .from('files')
            .remove([fileToDelete.path]);

        if (supabaseError) {
            // This is not a critical failure for the user. Log it for manual cleanup later.
            console.error(`Orphaned File Warning: Failed to delete '${fileToDelete.path}' from Supabase:`, supabaseError);
        }

        res.redirect('/home');

    } catch (err) {
        console.error("Error during file deletion:", err);
        res.status(500).send("Failed to delete file.");
    }
});

module.exports = router;