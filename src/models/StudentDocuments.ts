import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStudentDocuments extends Document {
    userId: mongoose.Types.ObjectId;
    // Explicit fileType stored alongside URL — never guessed from URL
    passportPhotoUrl: string;
    passportPhotoType: string; // e.g. 'jpg', 'png'
    marksheet10Url: string;
    marksheet10Type: string;
    marksheet12Url: string;
    marksheet12Type: string;
    aadhaarFamilyIdUrl: string;
    aadhaarFamilyIdType: string;
    uploadedAt: Date;
    updatedAt: Date;
}

const StudentDocumentsSchema = new Schema<IStudentDocuments>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        passportPhotoUrl: { type: String, required: true },
        passportPhotoType: { type: String, required: true },
        marksheet10Url: { type: String, required: true },
        marksheet10Type: { type: String, required: true },
        marksheet12Url: { type: String, required: true },
        marksheet12Type: { type: String, required: true },
        aadhaarFamilyIdUrl: { type: String, required: true },
        aadhaarFamilyIdType: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export const StudentDocuments: Model<IStudentDocuments> =
    mongoose.models.StudentDocuments ||
    mongoose.model<IStudentDocuments>('StudentDocuments', StudentDocumentsSchema);
