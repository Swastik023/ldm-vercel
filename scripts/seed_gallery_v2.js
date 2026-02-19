/**
 * seed_gallery_v2.js
 * Clears existing Gallery records, then uploads temp/Gallery files to Cloudinary
 * with proper categories, clean titles and skipping duplicates.
 *
 * Usage: node scripts/seed_gallery_v2.js
 */

const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// ── Cloudinary ────────────────────────────────────────────────────────────────
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── MongoDB ───────────────────────────────────────────────────────────────────
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

// ── Category mapping ──────────────────────────────────────────────────────────

// Subfolder → category
const SUBFOLDER_CAT = {
    'activity': 'activity',
    'awards': 'awards',
    'celebrations': 'celebrations',
    'classroom': 'classroom',
    'faculty': 'faculty',
    'testimonials': 'testimonials',
    'campain': 'general',   // campaign photos go to general
};

// Root-level files → category (keyed by filename, case-sensitive)
const ROOT_CAT = {
    'LAB IMAG.jpeg': 'labs',
    'LAB..jpeg': 'labs',
    'DMLT.jpeg': 'labs',
    'PHARMACY.jpeg': 'pharmacy',
    'PHARMACY2.jpeg': 'pharmacy',
    'OPD 1.jpeg': 'hospital',
    'WARD.jpeg': 'hospital',
    'WARD PICS.jpeg': 'hospital',
    'SEMI PVT..jpeg': 'hospital',
    'PIC9.jpeg': 'hospital',
    'GROUP PHOTO.jpeg': 'general',
    'GAL.jpeg': 'general',
    'GAL 1.mp4': 'general',
    'h gallaryPIC 6.jpeg': 'general',
    'pic1...jpeg': 'general',
    '1.15 AUGUST 2024 PHOTO 1.jpeg': 'activity',
    '1.1 NATIONAL NANTHEM ON 15 AUG 2024.mp4': 'activity',
};

// Files to skip entirely (classroom duplicates)
const SKIP = new Set([
    path.join('classroom', 'EXAM PICS(1).jpeg'),
    path.join('classroom', 'EX.PIC 2(1).jpeg'),
    path.join('classroom', 'EX. PIC 4(1).jpeg'),
    path.join('classroom', 'EX. PICS 5(1).jpeg'),
]);

// ── Title generation ──────────────────────────────────────────────────────────

// Static title overrides keyed by relative path (use forward slashes)
const TITLE_OVERRIDES = {
    // Root
    'LAB IMAG.jpeg': 'Medical Lab',
    'LAB..jpeg': 'Laboratory',
    'DMLT.jpeg': 'DMLT Laboratory',
    'PHARMACY.jpeg': 'College Pharmacy',
    'PHARMACY2.jpeg': 'Pharmacy Section',
    'OPD 1.jpeg': 'OPD Department',
    'WARD.jpeg': 'Hospital Ward',
    'WARD PICS.jpeg': 'Ward Area',
    'SEMI PVT..jpeg': 'Semi-Private Ward',
    'PIC9.jpeg': 'Hospital Section',
    'GROUP PHOTO.jpeg': 'Group Photograph',
    'GAL.jpeg': 'Campus View',
    'GAL 1.mp4': 'Campus Video',
    'h gallaryPIC 6.jpeg': 'Campus Gallery',
    'pic1...jpeg': 'College Campus',
    '1.15 AUGUST 2024 PHOTO 1.jpeg': 'Independence Day Celebration',
    '1.1 NATIONAL NANTHEM ON 15 AUG 2024.mp4': 'National Anthem - 15 Aug 2024',
    // Activity
    'activity/VINAY PARTAP 1.jpeg': 'Student Activity',
    'activity/WATER DAY PIC.jpeg': 'World Water Day',
    'activity/GR 2.jpeg': 'Group Activity',
    'activity/competiton.jpeg': 'Competition',
    'activity/activity.m.jpeg': 'Activity',
    'activity/pic12.jpeg': 'Activity Photo',
    'activity/pic2.jpg': 'Activity Event',
    'activity/pic4.jpeg': 'Activity Programme',
    'activity/pic6.jpeg': 'Activity Session',
    'activity/WhatsApp Image 2024-03-14 at 1.09.27 PM.jpeg': 'Activity Event',
    'activity/WhatsApp Image 2024-05-30 at 8.07.05 PM.jpeg': 'Activity Programme',
    'activity/WhatsApp Video 2024-03-14 at 1.03.42 PM.mp4': 'Activity Video',
    'activity/WhatsApp Video 2024-03-14 at 1.03.42 PM (1).mp4': null, // skip dupe video
    'activity/vedios go to streets.mp4': 'Health Awareness Drive',
    // Awards
    'awards/awards.jpeg': 'Awards Ceremony',
    'awards/convocation 1.jpeg': 'Convocation',
    'awards/convocation.jpeg': 'Convocation Ceremony',
    'awards/WhatsApp Image 2024-11-27 at 22.30.59_feea9974.jpg': 'Award Ceremony',
    'awards/WhatsApp Image 2024-11-27 at 22.31.34_6dcf6f21.jpg': 'Award Ceremony 2',
    // Celebrations
    'celebrations/activity .jpeg': 'Event Activity',
    'celebrations/celebrations .jpeg': 'College Celebration',
    'celebrations/h celebration.jpg': 'Celebration Event',
    'celebrations/home 2.jpeg': 'Campus Celebration',
    'celebrations/home 5.jpeg': 'College Event',
    'celebrations/home 6.jpeg': 'Campus Event',
    'celebrations/pic4.jpg': 'Celebration Photo',
    'celebrations/yoga home.jpeg': 'Yoga Day',
    'celebrations/annual functionDancing vedio.mp4': 'Annual Function Dance',
    // Classroom
    'classroom/EXAM PICS.jpeg': 'Examination Hall',
    'classroom/EX.PIC 2.jpeg': 'Exam Center',
    'classroom/EX. PIC 4.jpeg': 'Examination Room',
    'classroom/EX. PICS 5.jpeg': 'Exam Area',
    'classroom/FECULTY 2.jpeg': 'Faculty Members',
    'classroom/home 3.jpeg': 'Classroom',
    'classroom/ldm class_.jpg': 'LDM Classroom',
    'classroom/PC8.jpeg': 'Lecture Room',
    'classroom/pic2.jpeg': 'Classroom Session',
    'classroom/pic3.jpeg': 'Study Session',
    // Faculty
    'faculty/PIC1.jpeg': 'Faculty Member',
    'faculty/about home .jpeg': 'Our Faculty',
    'faculty/home 1.jpeg': 'Teaching Staff',
    // CAMPAIN - remap to general
    'CAMPAIN /PIC2.jpeg': 'Health Campaign',
    'CAMPAIN /PIC3.jpeg': 'Health Awareness',
    'CAMPAIN /PIC4.jpeg': 'Community Campaign',
    'CAMPAIN /PIC5.jpeg': 'Campaign Event',
    'CAMPAIN /PIC7.jpeg': 'Health Drive',
    'CAMPAIN /SLOGAN PIC.jpeg': 'Health Slogan',
    'CAMPAIN /WhatsApp Image 2024-05-30 at 8.07.06 PM.jpeg': 'Campaign Photo',
    'CAMPAIN /WhatsApp Image 2024-05-30 at 8.07.09 PM (1).jpeg': 'Campaign Event',
    'CAMPAIN /WhatsApp Image 2024-05-30 at 8.07.10 PM (1).jpeg': 'Campaign Drive',
    'CAMPAIN /VIDEO AT PARK.mp4': 'Campaign Video',
    // Testimonials
    'testimonials/BLS TRAINING.mp4': 'BLS Training Programme',
    'testimonials/BLS TRAINING PROGRAM.mp4': 'BLS Training Program',
    'testimonials/BLS VEDIO.mp4': 'BLS Demo Video',
    'testimonials/BLS vedio 2.mp4': 'BLS Training Video',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function getCategory(relative, filename) {
    const parts = relative.split(path.sep);
    if (parts.length > 1) {
        const sub = parts[0].toLowerCase().trim();
        return SUBFOLDER_CAT[sub] || 'general';
    }
    return ROOT_CAT[filename] || 'general';
}

function getTitle(relative) {
    // Normalize path separators to forward slash for lookup
    const key = relative.replace(/\\/g, '/');
    if (TITLE_OVERRIDES[key] !== undefined) return TITLE_OVERRIDES[key];
    // Fallback: clean up the filename
    const name = path.parse(relative).name;
    return name
        .replace(/[._\-]/g, ' ')
        .replace(/\(\d+\)/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

async function upload(filePath, resourceType) {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
            filePath,
            { folder: 'ldm-gallery', resource_type: resourceType },
            (err, result) => { if (err) reject(err); else resolve(result); }
        );
    });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function seed() {
    const galleryDir = path.resolve(__dirname, '../temp/Gallery');

    if (!process.env.MONGODB_URI) { console.error('MONGODB_URI not set'); process.exit(1); }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing records
    const deleted = await Gallery.deleteMany({});
    console.log(`🗑  Cleared ${deleted.deletedCount} existing Gallery records\n`);

    const files = getAllFiles(galleryDir);
    console.log(`📂 Found ${files.length} files in temp/Gallery\n`);

    const VIDEO_EXT = new Set(['.mp4', '.mov', '.avi', '.webm']);
    const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

    let order = 1, succeeded = 0, skipped = 0;

    for (const { full, relative } of files) {
        // Normalize to forward slashes for consistent comparisons
        const relFwd = relative.replace(/\\/g, '/');
        const relNative = relative;
        const filename = path.basename(relative);
        const ext = path.extname(filename).toLowerCase();

        // Skip duplicates
        if (SKIP.has(relNative)) {
            console.log(`⏭  Skip duplicate: ${relative}`);
            skipped++;
            continue;
        }

        const isVideo = VIDEO_EXT.has(ext);
        const isImage = IMAGE_EXT.has(ext);
        if (!isVideo && !isImage) { skipped++; continue; }

        const title = getTitle(relFwd);
        // Title = null means explicitly skip
        if (title === null) {
            console.log(`⏭  Skip (null title): ${relative}`);
            skipped++;
            continue;
        }

        const category = getCategory(relNative, filename);
        const resourceType = isVideo ? 'video' : 'image';

        console.log(`[${order}] ${relative}`);
        console.log(`     title: "${title}"  category: ${category}`);

        try {
            const result = await upload(full, resourceType);
            const imageUrl = result.secure_url;
            const thumbnailUrl = isVideo
                ? result.secure_url.replace('/video/upload/', '/video/upload/so_0,f_jpg/').replace(/\.\w+$/, '.jpg')
                : imageUrl;

            await Gallery.create({ title, imageUrl, thumbnailUrl, category, displayOrder: order, isActive: true });
            console.log(`     ✓ Cloudinary → ${imageUrl.substring(0, 70)}...`);
            order++;
            succeeded++;
        } catch (err) {
            console.error(`     ✗ FAILED: ${err.message}`);
        }
    }

    console.log(`\n✅ Done! Seeded ${succeeded} gallery records (skipped ${skipped}).`);
    await mongoose.disconnect();
    process.exit(0);
}

seed().catch(err => { console.error('Fatal:', err); process.exit(1); });
