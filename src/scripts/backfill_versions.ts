/**
 * Backfill Script: Create V1 DocumentVersion records for all existing
 * LibraryDocuments that were seeded before the seed script was updated.
 * 
 * Run once with: npx -y tsx src/scripts/backfill_versions.ts
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const LibraryDocumentSchema = new mongoose.Schema({
    content: String, file_path: String, file_type: String, current_version: Number
}, { timestamps: true });

const DocumentVersionSchema = new mongoose.Schema({
    document_id: mongoose.Schema.Types.ObjectId,
    file_path: String, content: String,
    version_number: Number, updated_by: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

const LibraryDocument = mongoose.models.LibraryDocument || mongoose.model('LibraryDocument', LibraryDocumentSchema);
const DocumentVersion = mongoose.models.DocumentVersion || mongoose.model('DocumentVersion', DocumentVersionSchema);

async function backfill() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Connected');

    const docs = await LibraryDocument.find({ is_deleted: { $ne: true } }).lean();
    let created = 0, skipped = 0;

    for (const doc of docs) {
        const existingV1 = await DocumentVersion.findOne({ document_id: doc._id, version_number: 1 });
        if (existingV1) { skipped++; continue; }

        await DocumentVersion.create({
            document_id: doc._id,
            content: (doc as any).content,
            file_path: (doc as any).file_path,
            version_number: 1,
            // No updated_by (seeded data, not admin action)
        });
        created++;
        console.log(`✅ Created V1 for: ${(doc as any)._id}`);
    }

    console.log(`\n🎉 Backfill complete! Created: ${created} | Skipped (already had V1): ${skipped}`);
    process.exit(0);
}

backfill().catch(console.error);
