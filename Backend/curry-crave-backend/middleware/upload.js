import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for multer
const cloudinaryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'curry-crave-menu',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
            { width: 800, height: 600, crop: 'limit', quality: 'auto' }
        ]
    }
});

// Fallback to memory storage if Cloudinary not configured
const memoryStorage = multer.memoryStorage();

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
    return process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET;
};

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files (jpg, jpeg, png, gif, webp) are allowed!'));
    }
};

// Create upload middleware
const upload = multer({
    storage: isCloudinaryConfigured() ? cloudinaryStorage : memoryStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: fileFilter
});

// Helper function to upload buffer to Cloudinary (for memory storage fallback)
export const uploadToCloudinary = async (buffer, filename) => {
    return new Promise((resolve, reject) => {
        if (!isCloudinaryConfigured()) {
            reject(new Error('Cloudinary not configured'));
            return;
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'curry-crave-menu',
                public_id: filename,
                transformation: [
                    { width: 800, height: 600, crop: 'limit', quality: 'auto' }
                ]
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );

        uploadStream.end(buffer);
    });
};

// Export cloudinary instance for direct use
export { cloudinary };
export default upload;
