const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
  api_key    : process.env.CLOUDINARY_API_KEY,
  api_secret : process.env.CLOUDINARY_API_SECRET,
});

function uploadToCloudinary(buffer, folder = 'municipal-complaints') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', allowed_formats: ['jpg','jpeg','png','webp'],
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }, { quality: 'auto:good' }] },
      (error, result) => {
        if (error) return reject(new Error('Upload failed: ' + error.message));
        resolve({ imageUrl: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

async function deleteFromCloudinary(publicId) {
  try { await cloudinary.uploader.destroy(publicId); }
  catch (err) { console.error('[Cloudinary] Delete error:', err.message); }
}

module.exports = { uploadToCloudinary, deleteFromCloudinary };
