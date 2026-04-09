const multer = require('multer');

const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  const allowed = ['image/jpeg','image/jpg','image/png','image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, WEBP allowed.'), false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
});

const uploadImages = (req, res, next) => {
  upload.array('images', 3)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Each image must be under 5MB.' });
      if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ error: 'Maximum 3 images allowed.' });
      return res.status(400).json({ error: err.message });
    }
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
};

const uploadChatPhoto = (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Image must be under 5MB.' });
      return res.status(400).json({ error: err.message });
    }
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
};

module.exports = { uploadImages, uploadChatPhoto };
