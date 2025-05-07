const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Create the uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Setup storage for multer
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Generate a random filename to prevent filename collisions
    const randomName = crypto.randomBytes(16).toString('hex');
    const fileExt = path.extname(file.originalname);
    cb(null, `${randomName}${fileExt}`);
  }
});

// File filter function to restrict file types if needed
const fileFilter = (req, file, cb) => {
  // Accept all file types for now
  // You can add restrictions here if needed
  cb(null, true);
};

// Create and export the multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  }
});

module.exports = upload;