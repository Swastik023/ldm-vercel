
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const CategorySchema = new mongoose.Schema({ name: String, semester_or_module: Number });
const LibraryCategory = mongoose.models.LibraryCategory || mongoose.model('LibraryCategory', CategorySchema);

async function seedCategories() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Connected to DB');

    const categories = [
        'Previous Year Question Papers',
        'Study Notes',
        'Master Syllabus'
    ];

    for (const name of categories) {
        const existing = await LibraryCategory.findOne({ name });
        if (!existing) {
            await LibraryCategory.create({ name });
            console.log(`✅ Created Category: ${name}`);
        } else {
            console.log(`⏩ Category already exists: ${name}`);
        }
    }

    process.exit(0);
}

seedCategories().catch(console.error);
