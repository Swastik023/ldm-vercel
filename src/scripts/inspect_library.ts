
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const DocumentSchema = new mongoose.Schema({
    title: String,
    content: String,
    current_version: Number,
    is_deleted: Boolean
});

const LibraryDocument = mongoose.models.LibraryDocument || mongoose.model('LibraryDocument', DocumentSchema);

async function inspectDocs() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const docs = await LibraryDocument.find({ is_deleted: { $ne: true } }).select('title current_version content').lean();

    console.log('--- DATABASE INSPECTION ---');
    docs.forEach(d => {
        console.log(`Title: ${d.title}`);
        console.log(`Version: ${d.current_version}`);
        console.log(`Content Length: ${d.content?.length || 0}`);
        console.log(`Snippet: ${d.content?.substring(0, 100)}...`);
        console.log('---');
    });

    process.exit(0);
}

inspectDocs().catch(console.error);
