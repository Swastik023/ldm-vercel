import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { StudentDocuments } from '@/models/StudentDocuments';
import { Batch } from '@/models/Academic';
import { Class } from '@/models/Class';
import cloudinary from '@/lib/cloudinary';

// Allowed file types
const PHOTO_TYPES = ['jpg', 'jpeg', 'png', 'webp'];
const DOC_TYPES = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
const MAX_SIZE_MB = 5;

async function uploadToCloudinary(
    buffer: Buffer,
    folder: string,
    publicId: string,
    resourceType: 'image' | 'raw'
): Promise<{ secure_url: string; public_id: string }> {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { resource_type: resourceType, folder, public_id: publicId },
            (error, result) => {
                if (error || !result) reject(error || new Error('Upload failed'));
                else resolve({ secure_url: result.secure_url, public_id: result.public_id });
            }
        ).end(buffer);
    });
}

// POST — initial submission OR re-upload of rejected fields
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const userId = session.user.id;
    const user = await User.findById(userId);
    if (!user) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const isReupload = formData.get('isReupload') === 'true';

    // Academic fields (required for Google users who didn't fill them at registration)
    const mobileNumber = formData.get('mobileNumber') as string | null;
    const batchId = formData.get('batchId') as string | null;
    const sessionFrom = formData.get('sessionFrom') as string | null;
    const sessionTo = formData.get('sessionTo') as string | null;
    const rollNumber = formData.get('rollNumber') as string | null;

    // Documents
    const passportPhoto = formData.get('passportPhoto') as File | null;
    const marksheet10 = formData.get('marksheet10') as File | null;
    const marksheet12 = formData.get('marksheet12') as File | null;
    const aadhaarFamilyId = formData.get('aadhaarFamilyId') as File | null;

    const extOf = (f: File) => f.name.split('.').pop()?.toLowerCase() || '';

    // ── Re-upload flow: only validate & upload the fields that were rejected ──
    if (isReupload) {
        const folder = `ldm-student-docs/${userId}`;
        const ts = Date.now();
        const docUpdates: Record<string, unknown> = {};
        const filesToUpload: { key: string; file: File; ext: string }[] = [];

        // Collect only the files that were re-submitted
        if (passportPhoto) {
            const ext = extOf(passportPhoto);
            if (!PHOTO_TYPES.includes(ext))
                return NextResponse.json({ success: false, message: 'Passport photo must be an image.' }, { status: 400 });
            if (passportPhoto.size / (1024 * 1024) > MAX_SIZE_MB)
                return NextResponse.json({ success: false, message: `Passport Photo exceeds ${MAX_SIZE_MB}MB.` }, { status: 400 });
            filesToUpload.push({ key: 'passportPhoto', file: passportPhoto, ext });
        }
        if (marksheet10) {
            const ext = extOf(marksheet10);
            if (!DOC_TYPES.includes(ext))
                return NextResponse.json({ success: false, message: '10th Marksheet must be PDF or image.' }, { status: 400 });
            if (marksheet10.size / (1024 * 1024) > MAX_SIZE_MB)
                return NextResponse.json({ success: false, message: `10th Marksheet exceeds ${MAX_SIZE_MB}MB.` }, { status: 400 });
            filesToUpload.push({ key: 'marksheet10', file: marksheet10, ext });
        }
        if (marksheet12) {
            const ext = extOf(marksheet12);
            if (!DOC_TYPES.includes(ext))
                return NextResponse.json({ success: false, message: '12th Marksheet must be PDF or image.' }, { status: 400 });
            if (marksheet12.size / (1024 * 1024) > MAX_SIZE_MB)
                return NextResponse.json({ success: false, message: `12th Marksheet exceeds ${MAX_SIZE_MB}MB.` }, { status: 400 });
            filesToUpload.push({ key: 'marksheet12', file: marksheet12, ext });
        }
        if (aadhaarFamilyId) {
            const ext = extOf(aadhaarFamilyId);
            if (!DOC_TYPES.includes(ext))
                return NextResponse.json({ success: false, message: 'Aadhaar/Family ID must be PDF or image.' }, { status: 400 });
            if (aadhaarFamilyId.size / (1024 * 1024) > MAX_SIZE_MB)
                return NextResponse.json({ success: false, message: `Aadhaar/Family ID exceeds ${MAX_SIZE_MB}MB.` }, { status: 400 });
            filesToUpload.push({ key: 'aadhaarFamilyId', file: aadhaarFamilyId, ext });
        }

        // Upload re-submitted files
        for (const { key, file, ext } of filesToUpload) {
            const resourceType = ext === 'pdf' ? 'raw' as const : 'image' as const;
            const keyMap: Record<string, string> = {
                passportPhoto: 'passport-photo',
                marksheet10: 'marksheet-10',
                marksheet12: 'marksheet-12',
                aadhaarFamilyId: 'aadhaar-family-id',
            };
            const result = await uploadToCloudinary(
                Buffer.from(await file.arrayBuffer()),
                folder,
                `${ts}-${keyMap[key]}`,
                resourceType
            );
            docUpdates[`${key}Url`] = result.secure_url;
            docUpdates[`${key}Type`] = ext;
        }

        // Update documents in DB
        if (Object.keys(docUpdates).length > 0) {
            await StudentDocuments.findOneAndUpdate({ userId }, docUpdates);
        }

        // Clear rejection reasons and set back to under_review
        await User.findByIdAndUpdate(userId, {
            status: 'under_review',
            rejectionReasons: null,
        });

        return NextResponse.json({ success: true, message: 'Documents resubmitted for review!' });
    }

    // ── Initial submission: All 4 docs mandatory ──────────────────────────────
    if (!passportPhoto || !marksheet10 || !marksheet12 || !aadhaarFamilyId) {
        return NextResponse.json({
            success: false,
            message: 'All 4 documents are required.'
        }, { status: 400 });
    }

    // Validate file types
    const ppExt = extOf(passportPhoto);
    const m10Ext = extOf(marksheet10);
    const m12Ext = extOf(marksheet12);
    const aaExt = extOf(aadhaarFamilyId);

    if (!PHOTO_TYPES.includes(ppExt))
        return NextResponse.json({ success: false, message: `Passport photo must be an image (${PHOTO_TYPES.join(', ')}).` }, { status: 400 });
    if (!DOC_TYPES.includes(m10Ext))
        return NextResponse.json({ success: false, message: `10th Marksheet must be PDF or image.` }, { status: 400 });
    if (!DOC_TYPES.includes(m12Ext))
        return NextResponse.json({ success: false, message: `12th Marksheet must be PDF or image.` }, { status: 400 });
    if (!DOC_TYPES.includes(aaExt))
        return NextResponse.json({ success: false, message: `Aadhaar/Family ID must be PDF or image.` }, { status: 400 });

    // Size validation
    for (const [label, file] of [
        ['Passport Photo', passportPhoto], ['10th Marksheet', marksheet10],
        ['12th Marksheet', marksheet12], ['Aadhaar/Family ID', aadhaarFamilyId],
    ] as [string, File][]) {
        if (file.size / (1024 * 1024) > MAX_SIZE_MB)
            return NextResponse.json({ success: false, message: `${label} exceeds ${MAX_SIZE_MB}MB limit.` }, { status: 400 });
    }

    // ── Handle academic fields for Google users ────────────────────────────────
    const updateFields: Record<string, unknown> = {
        isProfileComplete: true,
        status: 'under_review', // After docs submitted → waiting for admin review
        rejectionReasons: null,
    };

    if (batchId && sessionFrom && sessionTo && rollNumber) {
        const sfInt = parseInt(sessionFrom);
        const stInt = parseInt(sessionTo);

        if (isNaN(sfInt) || isNaN(stInt) || sfInt >= stInt) {
            return NextResponse.json({ success: false, message: 'Session From must be earlier than Session To.' }, { status: 400 });
        }

        const batch = await Batch.findOne({ _id: batchId, is_active: true });
        if (!batch) {
            return NextResponse.json({ success: false, message: 'Selected batch is invalid.' }, { status: 400 });
        }

        const roll = String(rollNumber).trim();

        // Find or create Class
        const className = `${batch.name} (${sfInt}-${stInt})`;
        let classDoc = await Class.findOne({ batchId, sessionFrom: sfInt, sessionTo: stInt });
        if (!classDoc) {
            classDoc = await Class.create({ batchId, sessionFrom: sfInt, sessionTo: stInt, className });
        }

        // Check roll number uniqueness within class (excluding current user)
        const existingRoll = await User.findOne({ classId: classDoc._id, rollNumber: roll, _id: { $ne: userId } });
        if (existingRoll) {
            return NextResponse.json({
                success: false,
                message: `Roll Number "${roll}" is already taken in ${className}.`
            }, { status: 409 });
        }

        updateFields.batch = batchId;
        updateFields.classId = classDoc._id;
        updateFields.rollNumber = roll;
        updateFields.sessionFrom = sfInt;
        updateFields.sessionTo = stInt;
    }

    if (mobileNumber && /^\d{10}$/.test(mobileNumber)) {
        updateFields.mobileNumber = mobileNumber;
    }

    // ── Upload all 4 documents to Cloudinary ─────────────────────────────────
    const folder = `ldm-student-docs/${userId}`;
    const ts = Date.now();

    const [ppResult, m10Result, m12Result, aaResult] = await Promise.all([
        uploadToCloudinary(Buffer.from(await passportPhoto.arrayBuffer()), folder, `${ts}-passport-photo`, 'image'),
        uploadToCloudinary(Buffer.from(await marksheet10.arrayBuffer()), folder, `${ts}-marksheet-10`, m10Ext === 'pdf' ? 'raw' : 'image'),
        uploadToCloudinary(Buffer.from(await marksheet12.arrayBuffer()), folder, `${ts}-marksheet-12`, m12Ext === 'pdf' ? 'raw' : 'image'),
        uploadToCloudinary(Buffer.from(await aadhaarFamilyId.arrayBuffer()), folder, `${ts}-aadhaar-family-id`, aaExt === 'pdf' ? 'raw' : 'image'),
    ]);

    // Save documents
    await StudentDocuments.findOneAndUpdate(
        { userId },
        {
            userId,
            passportPhotoUrl: ppResult.secure_url, passportPhotoType: ppExt,
            marksheet10Url: m10Result.secure_url, marksheet10Type: m10Ext,
            marksheet12Url: m12Result.secure_url, marksheet12Type: m12Ext,
            aadhaarFamilyIdUrl: aaResult.secure_url, aadhaarFamilyIdType: aaExt,
            uploadedAt: new Date(),
        },
        { upsert: true, new: true }
    );

    // Mark profile complete + update academic fields
    await (User.findByIdAndUpdate as any)(userId, updateFields);

    return NextResponse.json({ success: true, message: 'Documents submitted for review! Admin will approve shortly.' });
}
