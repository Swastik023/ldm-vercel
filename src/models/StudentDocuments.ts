import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomDoc {
    title: string;
    fileUrl: string;
    fileType: string; // extension: jpg, png, pdf, etc.
    uploadedAt: Date;
}

export interface IDocumentMeta {
    docType: string;         // '10th', '12th', 'Aadhaar', 'Other'
    docNumber?: string;      // e.g. Aadhaar number, ID number
    docRollNumber?: string;  // e.g. 10th/12th roll number
    docPercentage?: string;  // e.g. 10th/12th percentage
}

export interface IStudentDocuments extends Document {
    userId: mongoose.Types.ObjectId;
    passportPhotoUrl: string;
    passportPhotoType: string;
    marksheet10Url: string;
    marksheet10Type: string;
    marksheet12Url: string;
    marksheet12Type: string;
    // Aadhaar — front + back (mandatory for new registrations)
    aadhaarFrontUrl?: string;
    aadhaarFrontType?: string;
    aadhaarBackUrl?: string;
    aadhaarBackType?: string;
    // Legacy single aadhaar field (kept for old records)
    aadhaarIdUrl?: string;
    aadhaarIdType?: string;
    // Family ID
    familyIdUrl?: string;
    familyIdType?: string;
    // Document metadata (roll numbers, percentages, aadhaar number)
    documentMeta?: IDocumentMeta[];
    // Custom documents uploaded by student
    customDocuments?: ICustomDoc[];
    uploadedAt: Date;
    updatedAt: Date;
}

const DocumentMetaSchema = new Schema<IDocumentMeta>({
    docType: { type: String, required: true },  // '10th', '12th', 'Aadhaar', 'Other'
    docNumber: { type: String },                 // Aadhaar number, ID number
    docRollNumber: { type: String },             // 10th/12th roll number
    docPercentage: { type: String },             // 10th/12th percentage
}, { _id: false });

const CustomDocSchema = new Schema<ICustomDoc>({
    title: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
}, { _id: true });

const StudentDocumentsSchema = new Schema<IStudentDocuments>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        passportPhotoUrl: { type: String, required: true },
        passportPhotoType: { type: String, required: true },
        marksheet10Url: { type: String, required: true },
        marksheet10Type: { type: String, required: true },
        marksheet12Url: { type: String, required: true },
        marksheet12Type: { type: String, required: true },
        // Aadhaar — front + back (mandatory for new registrations)
        aadhaarFrontUrl: { type: String },
        aadhaarFrontType: { type: String },
        aadhaarBackUrl: { type: String },
        aadhaarBackType: { type: String },
        // Legacy single aadhaar field (kept for old records)
        aadhaarIdUrl: { type: String },
        aadhaarIdType: { type: String },
        // Family ID
        familyIdUrl: { type: String },
        familyIdType: { type: String },
        // Document metadata
        documentMeta: { type: [DocumentMetaSchema], default: [] },
        // Custom additional docs
        customDocuments: { type: [CustomDocSchema], default: [] },
        uploadedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export const StudentDocuments: Model<IStudentDocuments> =
    mongoose.models.StudentDocuments ||
    mongoose.model<IStudentDocuments>('StudentDocuments', StudentDocumentsSchema);
