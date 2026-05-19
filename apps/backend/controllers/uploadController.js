const cloudinary = require('../config/cloudinary');

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Set up upload stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'study_buddy_uploads',
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] upload error:', error);
          return res.status(500).json({ error: 'Cloudinary upload failed: ' + error.message });
        }
        res.json({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    // End stream with buffer data
    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error('[Upload] error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { uploadImage };
