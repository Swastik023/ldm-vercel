const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
// Load .env.local first
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
// Also try .env (does not overwrite existing keys)
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// --- Schemas (Simplified for seeding) ---

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'teacher', 'student'], default: 'student' },
    fullName: { type: String, required: true },
    status: { type: String, default: 'active' },
    createdAt: { type: Date, default: Date.now },
});

const ProgramSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: { type: String },
    duration_years: { type: Number, required: true },
    total_semesters: { type: Number, required: true },
    is_active: { type: Boolean, default: true },
}, { timestamps: true });

const SessionSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    is_active: { type: Boolean, default: false },
}, { timestamps: true });

const SubjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true },
    credits: { type: Number, required: true, default: 3 },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    semester: { type: Number, required: true },
    type: { type: String, enum: ['theory', 'practical', 'elective'], default: 'theory' },
    is_active: { type: Boolean, default: true },
}, { timestamps: true });

const BatchSchema = new mongoose.Schema({
    name: { type: String, required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    capacity: { type: Number, default: 60 },
    current_students: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Program = mongoose.models.Program || mongoose.model('Program', ProgramSchema);
const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);
const Subject = mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);
const Batch = mongoose.models.Batch || mongoose.model('Batch', BatchSchema);

// --- Real Data ---

const users = [
    {
        username: 'admin',
        email: 'admin@ldmcollege.com',
        password: 'admin',
        role: 'admin',
        fullName: 'System Administrator',
    },
    {
        username: 'dr.rajesh',
        email: 'dr.rajesh@ldmhospital.com',
        password: 'password',
        role: 'teacher',
        fullName: 'Dr. Rajesh Sachdeva', // Medical Director
    },
    {
        username: 'dr.sakshi',
        email: 'dr.sakshi@ldmhospital.com',
        password: 'password',
        role: 'teacher',
        fullName: 'Dr. Sakshi Sachdeva', // Chief Gynecologist
    },
    {
        username: 'dr.saurabh',
        email: 'dr.saurabh@ldmhospital.com',
        password: 'password',
        role: 'teacher',
        fullName: 'Dr. Saurabh Sachdeva', // Senior Consultant
    },
    {
        username: 'student',
        email: 'student@ldmcollege.com',
        password: 'password',
        role: 'student',
        fullName: 'Demo Student',
    },
];

// Based on src/data/courseData.ts
const courseData = [
    {
        id: "dccm",
        title: "Diploma in Critical Care Management",
        duration: 1, // Years
        syllabus: [
            "Patient monitoring techniques and equipment",
            "Ventilator management and troubleshooting",
            "Infection control protocols in ICU",
            "Emergency and resuscitation procedures",
            "ICU equipment operation and maintenance",
            "Pharmacology for critical care patients"
        ]
    },
    {
        id: "dhm",
        title: "Diploma in Hospital Management",
        duration: 1,
        syllabus: [
            "Hospital operations and workflow management",
            "Quality standards and accreditation in healthcare",
            "Patient care services and experience optimization",
            "Finance and resource management in hospitals",
            "Medical ethics and healthcare policies",
            "Basics of public health administration"
        ]
    },
    {
        id: "dat",
        title: "Diploma in Anaesthesia Technology (DAT)",
        duration: 2.5,
        syllabus: [
            "Principles of anesthesia",
            "Medical equipment operation",
            "Patient monitoring techniques",
            "Emergency response procedures",
            "Pharmacology basics",
            "Operation theatre protocols"
        ]
    },
    {
        id: "dcp",
        title: "Diploma in Community Care Provider",
        duration: 1,
        syllabus: [
            "Community health basics",
            "Primary healthcare delivery",
            "Health education and promotion",
            "Basic nursing care",
            "First aid and emergency care",
            "Public health awareness"
        ]
    },
    {
        id: "detc",
        title: "Diploma in Emergency & Trauma Care Technician",
        duration: 1,
        syllabus: [
            "Emergency medical procedures",
            "Trauma care management",
            "Patient assessment techniques",
            "Life support protocols",
            "Medical equipment operation",
            "Disaster management"
        ]
    },
    {
        id: "dhsi",
        title: "Diploma in Health & Sanitary Inspector",
        duration: 1,
        syllabus: [
            "Public health and hygiene",
            "Environmental sanitation",
            "Food safety standards",
            "Water quality management",
            "Disease prevention",
            "Health regulations"
        ]
    },
    {
        id: "dhcp",
        title: "Diploma in Home Care Provider",
        duration: 1,
        syllabus: [
            "Patient care fundamentals",
            "Geriatric care",
            "Nutrition and diet planning",
            "Basic nursing procedures",
            "Emergency response",
            "Mental health support"
        ]
    },
    {
        id: "dha",
        title: "Diploma in Hospital Administration",
        duration: 1,
        syllabus: [
            "Healthcare management",
            "Hospital operations",
            "Medical records management",
            "Healthcare economics",
            "Quality assurance",
            "Staff management"
        ]
    },
    {
        id: "dhwm",
        title: "Diploma in Hospital Waste Management",
        duration: 1,
        syllabus: [
            "Biomedical waste handling",
            "Sterilization techniques",
            "Safety protocols",
            "Environmental regulations",
            "Infection control",
            "Documentation procedures"
        ]
    },
    {
        id: "dmlt",
        title: "Diploma in Medical Laboratory Technology (DMLT)",
        duration: 2.5,
        syllabus: [
            "Clinical laboratory procedures",
            "Sample collection and analysis",
            "Laboratory equipment operation",
            "Quality control protocols",
            "Pathology basics",
            "Medical terminology"
        ]
    },
    {
        id: "dnt",
        title: "Diploma in Nanny Training",
        duration: 1,
        syllabus: [
            "Child development",
            "Nutrition and meal planning",
            "First aid for children",
            "Safety and hygiene",
            "Activity planning",
            "Behavioral management"
        ]
    },
    {
        id: "dott",
        title: "Diploma in Operation Theatre Technology (DOTT)",
        duration: 2.5,
        syllabus: [
            "Surgical procedures",
            "OT equipment management",
            "Sterilization techniques",
            "Patient preparation",
            "Emergency protocols",
            "Surgical assistance"
        ]
    },
    {
        id: "dp",
        title: "Diploma in Panchkarma",
        duration: 1,
        syllabus: [
            "Ayurvedic principles",
            "Panchkarma procedures",
            "Herbal medicine",
            "Massage techniques",
            "Patient consultation",
            "Treatment planning"
        ]
    },
    {
        id: "drit",
        title: "Diploma in Radiology & Imaging Technology (DRIT)",
        duration: 2.5,
        syllabus: [
            "Radiological procedures",
            "Imaging equipment operation",
            "Radiation safety",
            "Patient positioning",
            "Image processing",
            "Equipment maintenance"
        ]
    },
    {
        id: "mphw",
        title: "Multipurpose Health Worker (MPHW)",
        duration: 2,
        syllabus: [
            "Primary healthcare",
            "Maternal and child health",
            "Immunization programs",
            "Disease prevention",
            "Health education",
            "Community outreach"
        ]
    },
    {
        id: "caim",
        title: "Certificate in Ayurveda Infertility Management",
        duration: 0.5,
        syllabus: [
            "Ayurvedic principles of reproduction",
            "Infertility diagnosis in Ayurveda",
            "Herbal medicine for fertility",
            "Therapeutic procedures",
            "Diet and lifestyle management",
            "Case studies and clinical practice"
        ]
    },
    {
        id: "cand",
        title: "Certificate in Ayurveda Nutrition & Dietetics",
        duration: 0.5,
        syllabus: [
            "Basics of Ayurvedic nutrition",
            "Food properties and classifications",
            "Diet planning for different doshas",
            "Therapeutic nutrition",
            "Modern nutrition science",
            "Clinical diet counseling"
        ]
    },
    {
        id: "cap",
        title: "Certificate in Ayurveda Parasurgery",
        duration: 1,
        syllabus: [
            "Parasurgical procedures",
            "Wound management",
            "Surgical instruments",
            "Pre and post-operative care",
            "Ayurvedic healing methods",
            "Clinical practice"
        ]
    },
    {
        id: "cacsbc",
        title: "Certificate in Ayurvedic Cosmetology, Skin & Beauty Care",
        duration: 0.5,
        syllabus: [
            "Ayurvedic skin care principles",
            "Natural cosmetics preparation",
            "Beauty therapy techniques",
            "Facial treatments",
            "Hair care methods",
            "Practical training"
        ]
    }
];


async function seed() {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI is not defined');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // --- Clear existing data ---
        console.log('Clearing existing data...');
        await User.deleteMany({});
        await Program.deleteMany({});
        await Session.deleteMany({});
        await Subject.deleteMany({});
        await Batch.deleteMany({});

        // --- Seed Users ---
        console.log('Seeding Users...');
        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await User.create({ ...user, password: hashedPassword });
            console.log(`Created user ${user.username}`);
        }

        // --- Seed Session ---
        console.log('Seeding Session...');
        const session = await Session.create({
            name: '2024-2025',
            start_date: new Date('2024-06-01'),
            end_date: new Date('2025-05-31'),
            is_active: true
        });
        console.log(`Created session ${session.name}`);

        // --- Seed Programs, Subjects, Batches ---
        console.log('Seeding Programs and Subjects...');
        for (const course of courseData) {
            // Determine semesters (approximate based on duration)
            // 1 Year = 2 semesters, 2 Years = 4 semesters, etc.
            const totalSemesters = Math.ceil(course.duration * 2);

            const program = await Program.create({
                name: course.title,
                code: course.id.toUpperCase(),
                description: `Program for ${course.title}`,
                duration_years: course.duration,
                total_semesters: totalSemesters,
                is_active: true
            });
            console.log(`Created program ${program.name}`);

            // Create a default batch
            await Batch.create({
                name: `Batch ${new Date().getFullYear()} - ${program.code}`,
                program: program._id,
                session: session._id,
                capacity: 60,
                current_students: 0,
                is_active: true
            });

            // Create Subjects from syllabus
            // Distribute subjects across semesters evenly for simplicity
            if (course.syllabus && course.syllabus.length > 0) {
                let currentSemester = 1;
                for (let i = 0; i < course.syllabus.length; i++) {
                    const subjectName = course.syllabus[i];
                    // Cycle through semesters: 1, 2, ... totalSemesters, then repeat if more subjects
                    if (currentSemester > totalSemesters) currentSemester = 1;

                    await Subject.create({
                        name: subjectName,
                        code: `${program.code}-10${i + 1}`, // Simple code generation
                        credits: 3,
                        program: program._id,
                        semester: currentSemester,
                        type: 'theory',
                        is_active: true
                    });

                    currentSemester++;
                }
                console.log(`Created ${course.syllabus.length} subjects for ${program.name}`);
            }
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
