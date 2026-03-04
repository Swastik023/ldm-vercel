const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = 'mongodb+srv://admin:rootroot@cluster0.rokteln.mongodb.net/?appName=Cluster0';

// Define Schemas
const LibraryDocumentSchema = new mongoose.Schema({
    course_id: mongoose.Schema.Types.ObjectId,
    category_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
    content: String,
    file_type: String,
    current_version: { type: Number, default: 1 },
    is_common: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false }
}, { timestamps: true });

const DocumentVersionSchema = new mongoose.Schema({
    document_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    content: String,
    version_number: { type: Number, default: 1 },
    updated_by: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

const AuditLogSchema = new mongoose.Schema({
    action: String,
    entityType: String,
    entityId: mongoose.Schema.Types.ObjectId,
    performedBy: mongoose.Schema.Types.ObjectId,
    changes: Array,
    ipAddress: String
}, { timestamps: true });

const LibraryDocument = mongoose.models.LibraryDocument || mongoose.model('LibraryDocument', LibraryDocumentSchema);
const DocumentVersion = mongoose.models.DocumentVersion || mongoose.model('DocumentVersion', DocumentVersionSchema);
const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

async function insertDoc(courseId, categoryId, title, filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    // Delete existing to avoid duplicates
    await LibraryDocument.deleteMany({ title: title });

    const doc = await LibraryDocument.create({
        course_id: courseId,
        category_id: categoryId,
        title: title,
        content: content,
        file_type: 'md',
        current_version: 1
    });

    await DocumentVersion.create({
        document_id: doc._id,
        content: content,
        version_number: 1
    });

    await AuditLog.create({
        action: 'CREATE',
        entityType: 'LibraryDocument',
        entityId: doc._id,
        changes: [{ field: 'Automated Content Generation', old: null, new: { file_type: 'md', version: 1 } }],
        ipAddress: '127.0.0.1'
    });

    console.log(`Successfully inserted: ${title} (${wordCount} words)`);
}

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const categoryId = '69984021bcc2648f7956e225'; // Master Curriculum & Syllabus

        // 1. DMLT
        await insertDoc(
            '69a2e3b8b4b00d98cdeaee9a',
            categoryId,
            'Master Curriculum: B.Voc Medical Lab Technology (DMLT)',
            path.join(__dirname, 'dmlt_curriculum.md')
        );

        // 2. CAIM (Ayurveda)
        await insertDoc(
            '69974c2bcee1c378aabf85b5',
            categoryId,
            'Master Curriculum: Certificate in Ayurveda Infertility Management (CAIM)',
            path.join(__dirname, 'caim_curriculum.md')
        );

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

run();
