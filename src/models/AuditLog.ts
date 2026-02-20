import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE' | 'LOCK' | 'UNLOCK';
    entityType: 'FeePayment' | 'Expense' | 'Salary' | 'FeeStructure';
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
        enum: ['CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'LOCK', 'UNLOCK'],
        required: true
    },
    entityType: {
        type: String,
        enum: ['FeePayment', 'Expense', 'Salary', 'FeeStructure'],
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

// Prevent anyone from modifying an audit log once created
AuditLogSchema.pre('updateOne', function (next) {
    next(new Error('Audit logs are immutable and cannot be updated.'));
});

AuditLogSchema.pre('deleteOne', function (next) {
    next(new Error('Audit logs are immutable and cannot be deleted.'));
});

export const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
