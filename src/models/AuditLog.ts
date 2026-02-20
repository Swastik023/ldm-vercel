import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE' | 'LOCK' | 'UNLOCK' | 'DOWNLOAD';
    entityType: 'FeePayment' | 'Expense' | 'Salary' | 'FeeStructure' | 'LibraryCategory' | 'LibraryDocument' | 'DocumentVersion';
    entityId: mongoose.Types.ObjectId;
    performedBy: mongoose.Types.ObjectId; // User ID
    changes: { field: string, old: any, new: any }[]; // Detailed delta
    reason?: string;
    ipAddress?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
    action: {
        type: String,
        enum: ['CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'LOCK', 'UNLOCK', 'DOWNLOAD'],
        required: true
    },
    entityType: {
        type: String,
        enum: ['FeePayment', 'Expense', 'Salary', 'FeeStructure', 'LibraryCategory', 'LibraryDocument', 'DocumentVersion'],
        required: true
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changes: [{
        field: { type: String, required: true },
        old: { type: Schema.Types.Mixed }, // Can be anything
        new: { type: Schema.Types.Mixed }
    }],
    reason: { type: String },
    ipAddress: { type: String }
}, { timestamps: true });

// Pre-hook to prevent updates (Audit logs must be immutable) // @ts-ignore
AuditLogSchema.pre('updateOne', function (this: any, next: any) {
    next(new Error('Audit logs are immutable and cannot be updated.'));
});

// Pre-hook to prevent deletions // @ts-ignore
AuditLogSchema.pre('deleteOne', function (this: any, next: any) {
    next(new Error('Audit logs are immutable and cannot be deleted.'));
});

export const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
