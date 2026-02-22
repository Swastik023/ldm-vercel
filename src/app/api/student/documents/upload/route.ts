import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { DocumentRequirement } from '@/models/DocumentRequirement';
import { DocumentSubmission } from '@/models/DocumentSubmission';
import { User } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';
import cloudinary from '@/lib/cloudinary';
import mongoose from 'mongoose';

// POST /api/student/documents/upload — Upload document + form responses
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const requirementId = formData.get('requirementId') as string;
        const formResponsesRaw = formData.get('form_responses') as string | null;

        if (!requirementId) {
            return NextResponse.json({ success: false, message: 'Requirement ID is required' }, { status: 400 });
        }

        // Get the requirement
        const requirement = await DocumentRequirement.findById(requirementId);
        if (!requirement || !requirement.is_active) {
            return NextResponse.json({ success: false, message: 'Requirement not found or inactive' }, { status: 404 });
        }

        // Check if file is required but not provided
        if (requirement.requires_file_upload && !file) {
            return NextResponse.json({ success: false, message: 'File upload is required for this document' }, { status: 400 });
        }

        // Check due date
        if (requirement.due_date && new Date(requirement.due_date) < new Date()) {
            return NextResponse.json({ success: false, message: 'Submission deadline has passed' }, { status: 400 });
        }

        // Validate primary file if provided
        let uploadResult: any = null;
        let fileExtension: string | undefined;
        if (file) {
            fileExtension = file.name.split('.').pop()?.toLowerCase();
            if (!fileExtension || !requirement.required_file_types.includes(fileExtension)) {
                return NextResponse.json({
                    success: false,
                    message: `File type "${fileExtension}" not allowed. Accepted: ${requirement.required_file_types.join(', ')}`
                }, { status: 400 });
            }

            const fileSizeMB = file.size / (1024 * 1024);
            if (fileSizeMB > requirement.max_file_size_mb) {
                return NextResponse.json({
                    success: false,
                    message: `File size (${fileSizeMB.toFixed(1)}MB) exceeds limit of ${requirement.max_file_size_mb}MB`
                }, { status: 400 });
            }
        }

        // Parse form responses
        let formResponses: Record<string, unknown> = {};
        if (formResponsesRaw) {
            try { formResponses = JSON.parse(formResponsesRaw); } catch {
                return NextResponse.json({ success: false, message: 'Invalid form_responses JSON' }, { status: 400 });
            }
        }

        // Validate required custom fields
        for (const field of requirement.custom_fields) {
            if (field.is_required && field.field_type !== 'file') {
                const value = formResponses[field.field_id];
                if (value === undefined || value === null || value === '') {
                    return NextResponse.json({
                        success: false,
                        message: `"${field.label}" is required`
                    }, { status: 400 });
                }
            }
        }

        // Verify student is in scope
        const student = await User.findById(session.user.id)
            .populate({ path: 'batch', select: 'program' })
            .lean();

        if (!student) {
            return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
        }

        const isInScope = verifyScope(requirement, student, session.user.id);
        if (!isInScope) {
            return NextResponse.json({ success: false, message: 'This requirement is not assigned to you' }, { status: 403 });
        }

        // Check existing submission
        const existingSubmission = await DocumentSubmission.findOne({
            requirement: requirementId,
            student: session.user.id
        });

        if (existingSubmission && existingSubmission.status !== 'rejected') {
            return NextResponse.json({
                success: false,
                message: 'You have already submitted this document. You can only re-upload if it was rejected.'
            }, { status: 400 });
        }

        // Upload primary file to Cloudinary
        if (file) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            uploadResult = await new Promise<any>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'raw',
                        folder: `ldm-documents/${session.user.id}`,
                        public_id: `${Date.now()}-${file.name.replace(/\s+/g, '_')}`,
                        access_mode: 'authenticated'
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(buffer);
            });
        }

        // Handle additional file fields from custom form fields
        const additionalFiles: any[] = [];
        const fileFields = requirement.custom_fields.filter(f => f.field_type === 'file');
        for (const field of fileFields) {
            const additionalFile = formData.get(`file_${field.field_id}`) as File | null;
            if (!additionalFile) {
                if (field.is_required) {
                    return NextResponse.json({
                        success: false,
                        message: `File for "${field.label}" is required`
                    }, { status: 400 });
                }
                continue;
            }

            // Validate additional file
            const ext = additionalFile.name.split('.').pop()?.toLowerCase();
            const allowedTypes = field.allowed_file_types || requirement.required_file_types;
            if (ext && !allowedTypes.includes(ext)) {
                return NextResponse.json({
                    success: false,
                    message: `File type "${ext}" not allowed for "${field.label}". Accepted: ${allowedTypes.join(', ')}`
                }, { status: 400 });
            }

            const maxSize = field.max_file_size_mb || requirement.max_file_size_mb;
            if (additionalFile.size / (1024 * 1024) > maxSize) {
                return NextResponse.json({
                    success: false,
                    message: `File "${field.label}" exceeds ${maxSize}MB limit`
                }, { status: 400 });
            }

            // Upload to Cloudinary
            const addBytes = await additionalFile.arrayBuffer();
            const addBuffer = Buffer.from(addBytes);
            const addUploadResult = await new Promise<any>((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'raw',
                        folder: `ldm-documents/${session.user.id}/fields`,
                        public_id: `${Date.now()}-${field.field_id}-${additionalFile.name.replace(/\s+/g, '_')}`,
                        access_mode: 'authenticated'
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(addBuffer);
            });

            additionalFiles.push({
                field_id: field.field_id,
                file_url: addUploadResult.secure_url,
                file_name: additionalFile.name,
                file_type: ext || '',
                file_size: additionalFile.size,
                cloudinary_public_id: addUploadResult.public_id
            });
        }

        // Create or update submission
        let submission;
        if (existingSubmission) {
            // Resubmission — archive old state
            existingSubmission.submission_history.push({
                file_url: existingSubmission.file_url,
                file_name: existingSubmission.file_name,
                cloudinary_public_id: existingSubmission.cloudinary_public_id,
                submitted_at: existingSubmission.submitted_at,
                status: existingSubmission.status,
                review_comment: existingSubmission.review?.comment,
                reviewed_by: existingSubmission.review?.reviewed_by,
                form_responses: existingSubmission.form_responses
                    ? Object.fromEntries(existingSubmission.form_responses)
                    : undefined
            });

            if (uploadResult) {
                existingSubmission.file_url = uploadResult.secure_url;
                existingSubmission.file_name = file!.name;
                existingSubmission.file_type = fileExtension;
                existingSubmission.file_size = file!.size;
                existingSubmission.cloudinary_public_id = uploadResult.public_id;
            }
            existingSubmission.form_responses = new Map(Object.entries(formResponses));
            existingSubmission.additional_files = additionalFiles;
            existingSubmission.status = 'resubmitted';
            existingSubmission.review = {};
            existingSubmission.submitted_at = new Date();

            submission = await existingSubmission.save();
        } else {
            submission = await DocumentSubmission.create({
                requirement: requirementId,
                student: session.user.id,
                file_url: uploadResult?.secure_url,
                file_name: file?.name,
                file_type: fileExtension,
                file_size: file?.size,
                cloudinary_public_id: uploadResult?.public_id,
                form_responses: formResponses,
                additional_files: additionalFiles,
                status: 'pending',
                review: {},
                submitted_at: new Date(),
                submission_history: [{
                    file_url: uploadResult?.secure_url,
                    file_name: file?.name,
                    cloudinary_public_id: uploadResult?.public_id,
                    submitted_at: new Date(),
                    status: 'pending',
                    form_responses: formResponses
                }]
            });
        }

        // Audit log
        await AuditLog.create({
            action: 'UPLOAD',
            entityType: 'DocumentSubmission',
            entityId: submission._id,
            performedBy: session.user.id,
            changes: [{
                field: 'upload',
                old: null,
                new: {
                    file_name: file?.name,
                    requirement: requirement.title,
                    form_fields: Object.keys(formResponses).length,
                    additional_files: additionalFiles.length
                }
            }],
            ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
        });

        return NextResponse.json({ success: true, submission }, { status: 201 });

    } catch (error: any) {
        console.error('Document Upload Error:', error);
        return NextResponse.json({ success: false, message: 'Upload failed', error: error.message }, { status: 500 });
    }
}

// Helper: check if a student falls within the requirement's scope
function verifyScope(requirement: any, student: any, studentId: string): boolean {
    switch (requirement.scope.type) {
        case 'all':
            return true;
        case 'program': {
            const studentProgramId = student.batch?.program?.toString() || (student.batch as any)?.program?._id?.toString();
            return studentProgramId === requirement.scope.program?.toString();
        }
        case 'batch':
            return student.batch?._id?.toString() === requirement.scope.batch?.toString();
        case 'student':
            return requirement.scope.students?.some(
                (s: mongoose.Types.ObjectId) => s.toString() === studentId
            );
        default:
            return false;
    }
}
