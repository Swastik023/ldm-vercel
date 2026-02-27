import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomDoc {
    title: string;
    fileUrl: string;
    fileType: string; // extension: jpg, png, pdf, etc.
    uploadedAt: Date;
}

export interface IStudentDocuments extends Document {
    userId: mongoose.Types.ObjectId;
    passportPhotoUrl: string;
    passportPhotoType: string;
    marksheet10Url: string;
    marksheet10Type: string;
    marksheet12Url: string;
    marksheet12Type: string;
    // Split from aadhaarFamilyId:
    aadhaarIdUrl?: string;
    aadhaarIdType?: string;
    familyIdUrl?: string;
    familyIdType?: string;
    // Custom documents uploaded by student
    customDocuments?: ICustomDoc[];
    uploadedAt: Date;
    updatedAt: Date;
}

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
        // Separate Aadhaar and Family ID (both optional individually)
        aadhaarIdUrl: { type: String },
        aadhaarIdType: { type: String },
        familyIdUrl: { type: String },
        familyIdType: { type: String },
        // Custom additional docs
        customDocuments: { type: [CustomDocSchema], default: [] },
        uploadedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export const StudentDocuments: Model<IStudentDocuments> =
    mongoose.models.StudentDocuments ||
    mongoose.model<IStudentDocuments>('StudentDocuments', StudentDocumentsSchema);
