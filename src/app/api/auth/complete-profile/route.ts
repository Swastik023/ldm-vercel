import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { StudentDocuments } from '@/models/StudentDocuments';
import { Batch } from '@/models/Academic';
import { Class } from '@/models/Class';
import cloudinary from '@/lib/cloudinary';

const PHOTO_TYPES = ['jpg', 'jpeg', 'png', 'webp'];
const DOC_TYPES = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
const MAX_SIZE_MB = 5;

async function uploadToCloudinary(
    buffer: Buffer,
    folder: string,
    publicId: string,
    resourceType: 'image' | 'raw'
): Promise<{ secure_url: string }> {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { resource_type: resourceType, folder, public_id: publicId },
            (error, result) => {
                if (error || !result) reject(error || new Error('Upload failed'));
                else resolve({ secure_url: result.secure_url });
            }
        ).end(buffer);
    });
}

const extOf = (f: File) => f.name.split('.').pop()?.toLowerCase() || '';

// POST — initial submission OR re-upload of rejected fields
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const userId = session.user.id;
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    const formData = await req.formData();
    const isReupload = formData.get('isReupload') === 'true';

    // Academic fields
    const mobileNumber = formData.get('mobileNumber') as string | null;
    const batchId = formData.get('batchId') as string | null;
    const sessionFrom = formData.get('sessionFrom') as string | null;
    const sessionTo = formData.get('sessionTo') as string | null;
    const rollNumber = formData.get('rollNumber') as string | null;

    // Standard docs
    const passportPhoto = formData.get('passportPhoto') as File | null;
    const marksheet10 = formData.get('marksheet10') as File | null;
    const marksheet12 = formData.get('marksheet12') as File | null;
    const aadhaarId = formData.get('aadhaarId') as File | null;
    const familyId = formData.get('familyId') as File | null;

    // Custom docs (title0, file0, title1, file1, ...)
    const customDocs: { title: string; file: File }[] = [];
    let i = 0;
    while (formData.get(`customTitle${i}`) && formData.get(`customFile${i}`)) {
        customDocs.push({
            title: formData.get(`customTitle${i}`) as string,
            file: formData.get(`customFile${i}`) as File,
        });
        i++;
    }

    const folder = `ldm-student-docs/${userId}`;
    const ts = Date.now();

    // ── Re-upload flow ─────────────────────────────────────────────────────────
    if (isReupload) {
        const docUpdates: Record<string, unknown> = {};
        type UploadJob = { key: string; file: File; ext: string; allowedTypes: string[] };
        const jobs: UploadJob[] = [];

        const push = (key: string, file: File | null, allowed: string[]) => {
            if (!file) return;
            const ext = extOf(file);
            if (!allowed.includes(ext))
                throw new Error(`${key}: invalid file type`);
            if (file.size / (1024 * 1024) > MAX_SIZE_MB)
                throw new Error(`${key} exceeds ${MAX_SIZE_MB}MB`);
            jobs.push({ key, file, ext, allowedTypes: allowed });
        };

        try {
            push('passportPhoto', passportPhoto, PHOTO_TYPES);
            push('marksheet10', marksheet10, DOC_TYPES);
            push('marksheet12', marksheet12, DOC_TYPES);
            push('aadhaarId', aadhaarId, DOC_TYPES);
            push('familyId', familyId, DOC_TYPES);
        } catch (e: any) {
            return NextResponse.json({ success: false, message: e.message }, { status: 400 });
        }

        for (const { key, file, ext } of jobs) {
            const resourceType = ext === 'pdf' ? 'raw' as const : 'image' as const;
            const result = await uploadToCloudinary(Buffer.from(await file.arrayBuffer()), folder, `${ts}-${key}`, resourceType);
            docUpdates[`${key}Url`] = result.secure_url;
            docUpdates[`${key}Type`] = ext;
        }

        if (Object.keys(docUpdates).length > 0)
            await StudentDocuments.findOneAndUpdate({ userId }, docUpdates);

        await User.findByIdAndUpdate(userId, { status: 'under_review', rejectionReasons: null });
        return NextResponse.json({ success: true, message: 'Documents resubmitted for review!' });
    }

    // ── Initial submission ─────────────────────────────────────────────────────
    // Only passportPhoto + marksheet10 + marksheet12 are strictly required
    if (!passportPhoto || !marksheet10 || !marksheet12)
        return NextResponse.json({ success: false, message: 'Passport photo, 10th and 12th marksheets are required.' }, { status: 400 });

    const ppExt = extOf(passportPhoto);
    const m10Ext = extOf(marksheet10);
    const m12Ext = extOf(marksheet12);
    const aaExt = aadhaarId ? extOf(aadhaarId) : null;
    const fiExt = familyId ? extOf(familyId) : null;

    if (!PHOTO_TYPES.includes(ppExt))
        return NextResponse.json({ success: false, message: 'Passport photo must be JPG/PNG/WEBP.' }, { status: 400 });
    if (!DOC_TYPES.includes(m10Ext))
        return NextResponse.json({ success: false, message: '10th Marksheet must be PDF or image.' }, { status: 400 });
    if (!DOC_TYPES.includes(m12Ext))
        return NextResponse.json({ success: false, message: '12th Marksheet must be PDF or image.' }, { status: 400 });
    if (aaExt && !DOC_TYPES.includes(aaExt))
        return NextResponse.json({ success: false, message: 'Aadhaar ID must be PDF or image.' }, { status: 400 });
    if (fiExt && !DOC_TYPES.includes(fiExt))
        return NextResponse.json({ success: false, message: 'Family ID must be PDF or image.' }, { status: 400 });

    // Size checks
    for (const [label, file] of [
        ['Passport Photo', passportPhoto], ['10th Marksheet', marksheet10], ['12th Marksheet', marksheet12],
        ...(aadhaarId ? [['Aadhaar ID', aadhaarId]] : []),
        ...(familyId ? [['Family ID', familyId]] : []),
    ] as [string, File][]) {
        if (file.size / (1024 * 1024) > MAX_SIZE_MB)
            return NextResponse.json({ success: false, message: `${label} exceeds ${MAX_SIZE_MB}MB limit.` }, { status: 400 });
    }

    // ── Academic fields (Google users) ─────────────────────────────────────────
    const updateFields: Record<string, unknown> = { isProfileComplete: true, status: 'under_review', rejectionReasons: null };

    if (batchId && sessionFrom && sessionTo && rollNumber) {
        const sfInt = parseInt(sessionFrom);
        const stInt = parseInt(sessionTo);
        if (isNaN(sfInt) || isNaN(stInt) || sfInt >= stInt)
            return NextResponse.json({ success: false, message: 'Session From must be earlier than Session To.' }, { status: 400 });

        const batch = await Batch.findOne({ _id: batchId, is_active: true });
        if (!batch) return NextResponse.json({ success: false, message: 'Selected batch is invalid.' }, { status: 400 });

        const roll = String(rollNumber).trim();
        const className = `${batch.name} (${sfInt}-${stInt})`;
        let classDoc = await Class.findOne({ batchId, sessionFrom: sfInt, sessionTo: stInt });
        if (!classDoc) classDoc = await Class.create({ batchId, sessionFrom: sfInt, sessionTo: stInt, className });

        const existingRoll = await User.findOne({ classId: classDoc._id, rollNumber: roll, _id: { $ne: userId } });
        if (existingRoll)
            return NextResponse.json({ success: false, message: `Roll Number "${roll}" is already taken in ${className}.` }, { status: 409 });

        updateFields.batch = batchId;
        updateFields.classId = classDoc._id;
        updateFields.rollNumber = roll;
        updateFields.sessionFrom = sfInt;
        updateFields.sessionTo = stInt;
    }

    if (mobileNumber && /^\d{10}$/.test(mobileNumber)) updateFields.mobileNumber = mobileNumber;

    // ── Upload standard docs ───────────────────────────────────────────────────
    const uploads: Promise<{ secure_url: string }>[] = [
        uploadToCloudinary(Buffer.from(await passportPhoto.arrayBuffer()), folder, `${ts}-passport-photo`, 'image'),
        uploadToCloudinary(Buffer.from(await marksheet10.arrayBuffer()), folder, `${ts}-marksheet-10`, m10Ext === 'pdf' ? 'raw' : 'image'),
        uploadToCloudinary(Buffer.from(await marksheet12.arrayBuffer()), folder, `${ts}-marksheet-12`, m12Ext === 'pdf' ? 'raw' : 'image'),
    ];
    if (aadhaarId && aaExt) uploads.push(uploadToCloudinary(Buffer.from(await aadhaarId.arrayBuffer()), folder, `${ts}-aadhaar-id`, aaExt === 'pdf' ? 'raw' : 'image'));
    if (familyId && fiExt) uploads.push(uploadToCloudinary(Buffer.from(await familyId.arrayBuffer()), folder, `${ts}-family-id`, fiExt === 'pdf' ? 'raw' : 'image'));

    const results = await Promise.all(uploads);

    // ── Upload custom docs ─────────────────────────────────────────────────────
    const uploadedCustomDocs = [];
    for (let j = 0; j < customDocs.length; j++) {
        const { title, file } = customDocs[j];
        const ext = extOf(file);
        if (!DOC_TYPES.includes(ext)) continue;
        if (file.size / (1024 * 1024) > MAX_SIZE_MB) continue;
        const resourceType = ext === 'pdf' ? 'raw' as const : 'image' as const;
        const r = await uploadToCloudinary(Buffer.from(await file.arrayBuffer()), folder, `${ts}-custom-${j}`, resourceType);
        uploadedCustomDocs.push({ title, fileUrl: r.secure_url, fileType: ext, uploadedAt: new Date() });
    }

    // ── Save docs to DB ────────────────────────────────────────────────────────
    const docData: Record<string, unknown> = {
        userId,
        passportPhotoUrl: results[0].secure_url, passportPhotoType: ppExt,
        marksheet10Url: results[1].secure_url, marksheet10Type: m10Ext,
        marksheet12Url: results[2].secure_url, marksheet12Type: m12Ext,
        uploadedAt: new Date(),
    };
    let ri = 3;
    if (aadhaarId && aaExt) { docData.aadhaarIdUrl = results[ri].secure_url; docData.aadhaarIdType = aaExt; ri++; }
    if (familyId && fiExt) { docData.familyIdUrl = results[ri].secure_url; docData.familyIdType = fiExt; }
    if (uploadedCustomDocs.length > 0) docData.customDocuments = uploadedCustomDocs;

    await StudentDocuments.findOneAndUpdate({ userId }, docData, { upsert: true, new: true });
    await (User.findByIdAndUpdate as any)(userId, updateFields);

    return NextResponse.json({ success: true, message: 'Documents submitted for review! Admin will approve shortly.' });
}
