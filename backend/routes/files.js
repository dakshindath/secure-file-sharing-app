const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../utils/fileUpload');
const File = require('../models/file');
const User = require('../models/user');
const Share = require('../models/share');
const { encryptFile, decryptToTemporary } = require('../utils/fileEncryption');
const fs = require('fs');
const path = require('path');
const util = require('util');

// Convert fs.unlink to promise-based
const unlinkAsync = util.promisify(fs.unlink);

// @route   POST api/files/upload
// @desc    Upload a file
// @access  Private
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get user for storage limit check
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has enough storage space
    if (user.storageUsed + req.file.size > user.storageLimit) {
      // Delete the uploaded file
      await unlinkAsync(req.file.path);
      return res.status(400).json({ message: 'Storage limit exceeded' });
    }

    // Encrypt the file
    const { encryptedFilePath, key, iv } = await encryptFile(req.file.path);

    // Save file metadata in database
    const file = new File({
      owner: req.user.id,
      originalName: req.file.originalname,
      storedName: path.basename(encryptedFilePath),
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: encryptedFilePath,
      isEncrypted: true,
      encryptionKey: key,
      encryptionIV: iv,
      folder: req.body.folder || 'root'
    });

    await file.save();

    // Update user's storage used
    user.storageUsed += req.file.size;
    await user.save();

    res.json({ 
      message: 'File uploaded successfully',
      file: {
        id: file._id,
        originalName: file.originalName,
        size: file.size,
        mimetype: file.mimetype,
        createdAt: file.createdAt
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/files
// @desc    Get user's files
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const folder = req.query.folder || 'root';
    
    const files = await File.find({ 
      owner: req.user.id,
      folder: folder
    }).sort({ createdAt: -1 });
    
    res.json(files.map(file => ({
      _id: file._id,
      originalName: file.originalName,
      size: file.size,
      mimetype: file.mimetype,
      folder: file.folder,
      createdAt: file.createdAt
    })));
  } catch (error) {
    console.error('Error getting files:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/files/:id
// @desc    Get file details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Check if user owns the file
    if (file.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json({
      _id: file._id,
      originalName: file.originalName,
      size: file.size,
      mimetype: file.mimetype,
      folder: file.folder,
      createdAt: file.createdAt
    });
  } catch (error) {
    console.error('Error getting file details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/files/download/:id
// @desc    Download a file
// @access  Private
router.get('/download/:id', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Check if user owns the file or has access through a share
    const isOwner = file.owner.toString() === req.user.id;
    
    if (!isOwner) {
      // Check if there's an active share for this user
      const userEmail = (await User.findById(req.user.id)).email;
      const share = await Share.findOne({
        file: file._id,
        recipientEmail: userEmail,
        isOtpVerified: true,
        isRevoked: false,
        expiresAt: { $gt: new Date() }
      });
      
      if (!share || share.permission === 'view') {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    // Decrypt the file to a temporary location
    const tempFilePath = await decryptToTemporary(
      file.path,
      file.encryptionKey,
      file.encryptionIV,
      file.originalName
    );
    
    // Send the file
    res.download(tempFilePath, file.originalName, async (err) => {
      // Delete the temporary file after download completes
      try {
        if (fs.existsSync(tempFilePath)) {
          await unlinkAsync(tempFilePath);
        }
      } catch (deleteErr) {
        console.error('Error deleting temporary file:', deleteErr);
      }
      
      if (err) {
        console.error('Download error:', err);
      }
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE api/files/:id
// @desc    Delete a file
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Check if user owns the file
    if (file.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get user to update storage used
    const user = await User.findById(req.user.id);
    
    // Delete file from storage
    if (fs.existsSync(file.path)) {
      await unlinkAsync(file.path);
    }
    
    // Delete file shares
    await Share.deleteMany({ file: file._id });
    
    // Delete file from database
    await file.deleteOne();
    
    // Update user's storage used
    user.storageUsed = Math.max(0, user.storageUsed - file.size);
    await user.save();
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;