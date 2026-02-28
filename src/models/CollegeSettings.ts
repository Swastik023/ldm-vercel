import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICollegeSettings extends Document {
    academicSession: string;       // e.g. "2024-25"
    intakeMonths: string[];        // e.g. ["January", "July"]
    collegeName: string;
    updatedAt: Date;
}

const CollegeSettingsSchema = new Schema<ICollegeSettings>(
    {
        academicSession: { type: String, required: true, default: '2024-25' },
        intakeMonths: { type: [String], default: ['January', 'July'] },
        collegeName: { type: String, default: 'LDM College' },
    },
    { timestamps: true }
);

// Singleton helper — always returns the single settings document
CollegeSettingsSchema.statics.getSingleton = async function () {
    let doc = await this.findOne();
    if (!doc) {
        doc = await this.create({
            academicSession: '2024-25',
            intakeMonths: ['January', 'July'],
            collegeName: 'LDM College',
        });
    }
    return doc;
};

export interface CollegeSettingsModel extends Model<ICollegeSettings> {
    getSingleton(): Promise<ICollegeSettings>;
}

export const CollegeSettings: CollegeSettingsModel =
    (mongoose.models.CollegeSettings as CollegeSettingsModel) ||
    mongoose.model<ICollegeSettings, CollegeSettingsModel>('CollegeSettings', CollegeSettingsSchema);
