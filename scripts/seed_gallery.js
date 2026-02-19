/**
 * seed_gallery.js
 * Uploads all images/videos from temp/Gallery to Cloudinary
 * and creates corresponding Gallery records in MongoDB.
 *
 * Usage: node scripts/seed_gallery.js
 */

const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// ── Cloudinary config ────────────────────────────────────────────────────────
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Mongoose schema ──────────────────────────────────────────────────────────
const GallerySchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String, required: true },
    thumbnailUrl: { type: String },
    category: { type: String, default: 'general' },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Gallery = mongoose.models.Gallery || mongoose.model('Gallery', GallerySchema);

// ── Helpers ──────────────────────────────────────────────────────────────────
/** Derive a friendly category name from the subfolder */
function getCategory(relativePath) {
    const parts = relativePath.split(path.sep);
    if (parts.length > 1) {
        return parts[0].toLowerCase().trim(); // subfolder name
    }
    return 'general';
}

/** Derive a title from the filename */
function getTitle(filename) {
    return path.parse(filename).name
        .replace(/[_-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Recursively collect all files under a directory */
function getAllFiles(dir, baseDir = dir, result = []) {
    for (const entry of fs.readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (fs.statSync(full).isDirectory()) {
            getAllFiles(full, baseDir, result);
        } else {
            result.push({ full, relative: path.relative(baseDir, full) });
        }
    }
    return result;
}

/** Upload one file to Cloudinary, returns secure_url + thumbnail */
async function uploadToCloudinary(filePath, resourceType) {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
            filePath,
            {
                folder: 'ldm-gallery',
                resource_type: resourceType,
                use_filename: true,
                unique_filename: true,
            },
            (err, result) => {
                if (err) reject(err);
                else resolve(result);
            }
        );
    });
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
    const galleryDir = path.resolve(__dirname, '../temp/Gallery');

    if (!fs.existsSync(galleryDir)) {
        console.error('temp/Gallery directory not found');
        process.exit(1);
    }

    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI not set');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const files = getAllFiles(galleryDir);
    console.log(`Found ${files.length} files to process`);

    let order = 1;
    for (const { full, relative } of files) {
        const ext = path.extname(full).toLowerCase();
        const isVideo = ['.mp4', '.mov', '.avi', '.webm'].includes(ext);
        const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);

        if (!isVideo && !isImage) {
            console.log(`  Skipping unsupported file: ${relative}`);
            continue;
        }

        const resourceType = isVideo ? 'video' : 'image';
        const category = getCategory(relative);
        const title = getTitle(path.basename(full));

        console.log(`\n[${order}] Uploading: ${relative} (${resourceType})`);

        try {
            const result = await uploadToCloudinary(full, resourceType);
            const imageUrl = result.secure_url;

            // For videos, Cloudinary can generate a thumbnail
            const thumbnailUrl = isVideo
                ? result.secure_url.replace('/video/upload/', '/video/upload/so_0,eo_1,f_jpg/').replace('.mp4', '.jpg')
                : imageUrl;

            await Gallery.create({
                title,
                imageUrl,
                thumbnailUrl,
                category,
                displayOrder: order,
                isActive: true,
            });

            console.log(`  ✓ Uploaded → ${imageUrl.substring(0, 80)}...`);
            order++;
        } catch (err) {
            console.error(`  ✗ Failed: ${err.message}`);
        }
    }

    console.log(`\n✅ Done! Seeded ${order - 1} gallery records.`);
    await mongoose.disconnect();
    process.exit(0);
}

seed().catch((err) => {
    console.error('Fatal:', err);
    process.exit(1);
});
