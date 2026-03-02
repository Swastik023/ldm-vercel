import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { StudentDocuments } from '@/models/StudentDocuments';
import { Program, Batch, Session } from '@/models/Academic';
import '@/models/Academic';
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
        const stream = cloudinary.uploader.upload_stream(
            { folder, public_id: publicId, resource_type: resourceType },
            (error: any, result: any) => {
                if (error) reject(error);
                else resolve({ secure_url: result.secure_url });
            }
        );
        stream.end(buffer);
    });
}

function extOf(f: File) { return f.name.split('.').pop()?.toLowerCase() ?? ''; }

function computeCourseEndDate(joiningMonth: 'January' | 'July', joiningYear: number, durationYears: number): Date {
    if (joiningMonth === 'January') {
        return new Date(joiningYear + durationYears - 1, 11, 31);
    }
    return new Date(joiningYear + durationYears, 5, 30);
}

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
    const programId = formData.get('programId') as string | null;
    const joiningMonth = formData.get('joiningMonth') as string | null;
    const joiningYear = formData.get('joiningYear') as string | null;
    const rollNumber = formData.get('rollNumber') as string | null;

    // Standard docs
    const passportPhoto = formData.get('passportPhoto') as File | null;
    const marksheet10 = formData.get('marksheet10') as File | null;
    const marksheet12 = formData.get('marksheet12') as File | null;
    const aadhaarFront = formData.get('aadhaarFront') as File | null;
    const aadhaarBack = formData.get('aadhaarBack') as File | null;
    const familyId = formData.get('familyId') as File | null;

    // Document metadata (JSON string)
    const docMetaRaw = formData.get('documentMeta') as string | null;
    let documentMeta: { docType: string; docNumber?: string; docRollNumber?: string; docPercentage?: string }[] = [];
    if (docMetaRaw) {
        try { documentMeta = JSON.parse(docMetaRaw); } catch { /* ignore parse errors */ }
    }

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
            push('aadhaarFront', aadhaarFront, DOC_TYPES);
            push('aadhaarBack', aadhaarBack, DOC_TYPES);
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

        if (documentMeta.length > 0) docUpdates.documentMeta = documentMeta;

        if (Object.keys(docUpdates).length > 0)
            await StudentDocuments.findOneAndUpdate({ userId }, docUpdates);

        await User.findByIdAndUpdate(userId, { status: 'under_review', rejectionReasons: null });
        return NextResponse.json({ success: true, message: 'Documents resubmitted for review!' });
    }

    // ── Initial submission ─────────────────────────────────────────────────────
    // Required: passportPhoto + marksheet10 + marksheet12 + aadhaarFront + aadhaarBack
    if (!passportPhoto || !marksheet10 || !marksheet12 || !aadhaarFront || !aadhaarBack)
        return NextResponse.json({
            success: false,
            message: 'Passport photo, 10th marksheet, 12th marksheet, and Aadhaar Card (front + back) are all required.'
        }, { status: 400 });

    // Validate Aadhaar number from metadata
    const aadhaarMeta = documentMeta.find(m => m.docType === 'Aadhaar');
    if (!aadhaarMeta?.docNumber || !/^\d{4}[\s-]?\d{4}[\s-]?\d{4}$/.test(aadhaarMeta.docNumber.trim())) {
        return NextResponse.json({
            success: false,
            message: 'Aadhaar Card Number is required and must be 12 digits (format: 1234 5678 9012).'
        }, { status: 400 });
    }

    // Validate 10th metadata
    const meta10 = documentMeta.find(m => m.docType === '10th');
    if (!meta10?.docRollNumber || !meta10?.docPercentage) {
        return NextResponse.json({
            success: false,
            message: '10th Marksheet: Roll Number and Percentage are required.'
        }, { status: 400 });
    }

    // Validate 12th metadata
    const meta12 = documentMeta.find(m => m.docType === '12th');
    if (!meta12?.docRollNumber || !meta12?.docPercentage) {
        return NextResponse.json({
            success: false,
            message: '12th Marksheet: Roll Number and Percentage are required.'
        }, { status: 400 });
    }

    const ppExt = extOf(passportPhoto);
    const m10Ext = extOf(marksheet10);
    const m12Ext = extOf(marksheet12);
    const afExt = extOf(aadhaarFront);
    const abExt = extOf(aadhaarBack);
    const fiExt = familyId ? extOf(familyId) : null;

    if (!PHOTO_TYPES.includes(ppExt))
        return NextResponse.json({ success: false, message: 'Passport photo must be JPG/PNG/WEBP.' }, { status: 400 });
    if (!DOC_TYPES.includes(m10Ext))
        return NextResponse.json({ success: false, message: '10th Marksheet must be PDF or image.' }, { status: 400 });
    if (!DOC_TYPES.includes(m12Ext))
        return NextResponse.json({ success: false, message: '12th Marksheet must be PDF or image.' }, { status: 400 });
    if (!DOC_TYPES.includes(afExt))
        return NextResponse.json({ success: false, message: 'Aadhaar Front must be PDF or image.' }, { status: 400 });
    if (!DOC_TYPES.includes(abExt))
        return NextResponse.json({ success: false, message: 'Aadhaar Back must be PDF or image.' }, { status: 400 });
    if (fiExt && !DOC_TYPES.includes(fiExt))
        return NextResponse.json({ success: false, message: 'Family ID must be PDF or image.' }, { status: 400 });

    // Size checks
    for (const [label, file] of [
        ['Passport Photo', passportPhoto], ['10th Marksheet', marksheet10], ['12th Marksheet', marksheet12],
        ['Aadhaar Front', aadhaarFront], ['Aadhaar Back', aadhaarBack],
        ...(familyId ? [['Family ID', familyId]] : []),
    ] as [string, File][]) {
        if (file.size / (1024 * 1024) > MAX_SIZE_MB)
            return NextResponse.json({ success: false, message: `${label} exceeds ${MAX_SIZE_MB}MB limit.` }, { status: 400 });
    }

    // ── Academic fields (Google users) ─────────────────────────────────────────
    const updateFields: Record<string, unknown> = { isProfileComplete: true, status: 'under_review', rejectionReasons: null };

    if (programId && joiningMonth && joiningYear && rollNumber) {
        if (!['January', 'July'].includes(joiningMonth))
            return NextResponse.json({ success: false, message: 'Joining month must be January or July.' }, { status: 400 });

        const jyInt = parseInt(joiningYear);
        if (isNaN(jyInt) || jyInt < 2020 || jyInt > 2040)
            return NextResponse.json({ success: false, message: 'Joining year is invalid.' }, { status: 400 });

        const program = await Program.findOne({ _id: programId, is_active: true });
        if (!program) return NextResponse.json({ success: false, message: 'Selected program is invalid.' }, { status: 400 });

        const roll = String(rollNumber).trim();
        const existingRoll = await User.findOne({ rollNumber: roll, _id: { $ne: userId } });
        if (existingRoll)
            return NextResponse.json({ success: false, message: `Roll Number "${roll}" is already taken.` }, { status: 409 });

        const courseEndDate = computeCourseEndDate(joiningMonth as 'January' | 'July', jyInt, program.duration_years);

        // ── Determine Auto-Batch ──
        const batchName = joiningMonth === 'January' ? `${jyInt}${program.code}` : `${jyInt + 2}${program.code}`;

        let batch = await Batch.findOne({ name: batchName, program: program._id });
        if (!batch) {
            let sessionDoc = await Session.findOne({ is_active: true }).sort({ start_date: -1 });
            if (!sessionDoc) sessionDoc = await Session.findOne().sort({ start_date: -1 });

            if (!sessionDoc) {
                sessionDoc = await Session.create({
                    name: `Session ${jyInt}-${jyInt + program.duration_years}`,
                    start_date: new Date(jyInt, 0, 1),
                    end_date: new Date(jyInt + program.duration_years, 11, 31),
                    is_active: true
                });
            }
            batch = await Batch.create({
                name: batchName,
                program: program._id,
                session: sessionDoc._id,
                intakeMonth: joiningMonth,
                joiningYear: jyInt,
                courseDurationYears: program.duration_years,
                startDate: joiningMonth === 'January' ? new Date(jyInt, 0, 1) : new Date(jyInt, 6, 1),
                expectedEndDate: courseEndDate,
                status: 'upcoming',
                capacity: 60,
                current_students: 0,
                current_semester: 1,
                is_active: true
            });
        }

        updateFields.programId = programId;
        updateFields.joiningMonth = joiningMonth;
        updateFields.joiningYear = jyInt;
        updateFields.courseEndDate = courseEndDate;
        updateFields.rollNumber = roll;
        updateFields.username = roll.toLowerCase(); // Roll number = username
        updateFields.batch = batch._id;
        updateFields.session = batch.session;
    }

    if (mobileNumber && /^\d{10}$/.test(mobileNumber)) updateFields.mobileNumber = mobileNumber;

    // ── Upload standard docs ───────────────────────────────────────────────────
    const uploads: Promise<{ secure_url: string }>[] = [
        uploadToCloudinary(Buffer.from(await passportPhoto.arrayBuffer()), folder, `${ts}-passport-photo`, 'image'),
        uploadToCloudinary(Buffer.from(await marksheet10.arrayBuffer()), folder, `${ts}-marksheet-10`, m10Ext === 'pdf' ? 'raw' : 'image'),
        uploadToCloudinary(Buffer.from(await marksheet12.arrayBuffer()), folder, `${ts}-marksheet-12`, m12Ext === 'pdf' ? 'raw' : 'image'),
        uploadToCloudinary(Buffer.from(await aadhaarFront.arrayBuffer()), folder, `${ts}-aadhaar-front`, afExt === 'pdf' ? 'raw' : 'image'),
        uploadToCloudinary(Buffer.from(await aadhaarBack.arrayBuffer()), folder, `${ts}-aadhaar-back`, abExt === 'pdf' ? 'raw' : 'image'),
    ];
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
        aadhaarFrontUrl: results[3].secure_url, aadhaarFrontType: afExt,
        aadhaarBackUrl: results[4].secure_url, aadhaarBackType: abExt,
        uploadedAt: new Date(),
    };
    let ri = 5;
    if (familyId && fiExt) { docData.familyIdUrl = results[ri].secure_url; docData.familyIdType = fiExt; }
    if (uploadedCustomDocs.length > 0) docData.customDocuments = uploadedCustomDocs;
    if (documentMeta.length > 0) docData.documentMeta = documentMeta;

    await StudentDocuments.findOneAndUpdate({ userId }, docData, { upsert: true, new: true });
    await (User.findByIdAndUpdate as any)(userId, updateFields);

    return NextResponse.json({ success: true, message: 'Documents submitted for review! Admin will approve shortly.' });
}
