import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Program } from '@/models/Academic';

// POST /api/admin/courses/migrate — populate/update all 31 known programs with full content
export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session || (session as any).user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const allCourses = [
        // ─── Original 22 courses from courseData.ts ────────────────────────────
        {
            code: 'dccm', name: 'Diploma in Critical Care Management',
            course_type: 'diploma', duration_years: 1, total_semesters: 2,
            eligibility: '12th Pass', image: '/course_img/dccm.jpeg',
            description: 'The Diploma in Critical Care Management provides comprehensive training in managing intensive care units and critical patients. Students learn advanced patient monitoring, ventilator management, emergency response protocols, and specialized care techniques. The program emphasizes hands-on training with modern ICU equipment, understanding critical care procedures, and developing quick decision-making skills in emergency situations.',
            syllabus: ['Patient monitoring techniques and equipment', 'Ventilator management and troubleshooting', 'Infection control protocols in ICU', 'Emergency and resuscitation procedures', 'ICU equipment operation and maintenance', 'Pharmacology for critical care patients'],
            career: ['ICU Technician', 'Critical Care Assistant', 'Healthcare Coordinator in Hospitals', 'Government Hospital ICU Technician', 'Critical Care Specialist in Military Hospitals', 'Emergency Care Coordinator in Government Medical Colleges'],
        },
        {
            code: 'dhm', name: 'Diploma in Hospital Management',
            course_type: 'diploma', duration_years: 1, total_semesters: 2,
            eligibility: '12th Pass', image: '/course_img/dhm.jpeg',
            description: 'The Diploma in Hospital Management is designed to prepare students for administrative and managerial roles in the healthcare sector. The program covers hospital operations, healthcare policies, quality management, medical ethics, patient services, and financial management.',
            syllabus: ['Hospital operations and workflow management', 'Quality standards and accreditation in healthcare', 'Patient care services and experience optimization', 'Finance and resource management in hospitals', 'Medical ethics and healthcare policies', 'Human resource management in healthcare'],
            career: ['Hospital Administrator', 'Healthcare Manager', 'Patient Care Coordinator', 'Hospital Operations Manager', 'Healthcare Quality Officer', 'Medical Records Manager'],
        },
        {
            code: 'dmlt', name: 'Diploma in Medical Laboratory Technology',
            course_type: 'diploma', duration_years: 1, total_semesters: 2,
            eligibility: '12th Pass (Science preferred)', image: '/course_img/dmlt.jpeg',
            description: 'The Diploma in Medical Laboratory Technology trains students in clinical laboratory procedures, diagnostic testing, and specimen analysis. Students gain hands-on experience in hematology, microbiology, biochemistry, and pathology laboratories.',
            syllabus: ['Clinical biochemistry and hematology', 'Microbiology and immunology basics', 'Blood banking and transfusion medicine', 'Histopathology and cytology techniques', 'Laboratory safety and quality control', 'Diagnostic techniques and equipment operation'],
            career: ['Medical Lab Technician', 'Clinical Laboratory Analyst', 'Hospital Lab Assistant', 'Pathology Lab Technician', 'Blood Bank Technician', 'Research Laboratory Assistant'],
        },
        {
            code: 'dott', name: 'Diploma in Operation Theatre Technology',
            course_type: 'diploma', duration_years: 1, total_semesters: 2,
            eligibility: '12th Pass', image: '/course_img/dott.jpeg',
            description: 'The Diploma in Operation Theatre Technology prepares students to assist surgical teams in operation theatres. Training covers sterilization techniques, surgical instrument handling, anesthesia assistance, and patient preparation protocols.',
            syllabus: ['Surgical anatomy and terminology', 'Sterilization and infection control in OT', 'Surgical instrument identification and handling', 'Anesthesia assistance and patient preparation', 'Post-operative care and recovery room management', 'OT equipment maintenance and safety'],
            career: ['OT Technician', 'Surgical Assistant', 'Anaesthesia Technician', 'Scrub Technician', 'Government Hospital OT Assistant', 'Private Hospital Theatre Technician'],
        },
        {
            code: 'drit', name: 'Diploma in Radiology & Imaging Technology',
            course_type: 'diploma', duration_years: 1, total_semesters: 2,
            eligibility: '12th Pass', image: '/course_img/drit.jpeg',
            description: 'The Diploma in Radiology & Imaging Technology trains students in operating diagnostic imaging equipment including X-ray, CT scan, MRI, and ultrasound machines. Students learn radiation safety, patient positioning, and image processing techniques.',
            syllabus: ['Radiological anatomy and physiology', 'X-ray physics and equipment operation', 'CT scan and MRI procedures', 'Radiation safety and protection', 'Patient positioning and image quality', 'Ultrasound and nuclear medicine basics'],
            career: ['Radiographer', 'X-ray Technician', 'CT Scan Technician', 'MRI Technician', 'Diagnostic Imaging Assistant', 'Government Radiology Technician'],
        },
        {
            code: 'dat', name: 'Diploma in Anaesthesia Technology',
            course_type: 'diploma', duration_years: 1, total_semesters: 2,
            eligibility: '12th Pass', image: '/course_img/dat.jpeg',
            description: 'The Diploma in Anaesthesia Technology trains students to assist anesthesiologists in administering anesthesia, monitoring patients during surgery, and maintaining anesthesia equipment.',
            syllabus: ['Principles of anesthesia and pharmacology', 'Anesthesia machine operation and maintenance', 'Patient monitoring during surgery', 'Airway management techniques', 'Anesthesia complications and emergency management', 'Pre and post-operative patient care'],
            career: ['Anesthesia Technician', 'OT Assistant (Anaesthesia)', 'Surgical Support Specialist', 'ICU Support Technician', 'Government Hospital Anaesthesia Assistant'],
        },
        {
            code: 'dha', name: 'Diploma in Hospital Administration',
            course_type: 'diploma', duration_years: 1, total_semesters: 2,
            eligibility: '12th Pass', image: '/course_img/dha.jpeg',
            description: 'The Diploma in Hospital Administration equips students with knowledge of healthcare administration, hospital operations, health information management, and regulatory compliance for effective hospital management.',
            syllabus: ['Hospital information systems and records management', 'Healthcare laws and regulatory compliance', 'Patient admissions and billing management', 'Human resource management in hospitals', 'Healthcare quality assurance methods', 'Healthcare finance and budget management'],
            career: ['Hospital Administrator', 'Health Information Manager', 'Medical Records Officer', 'Hospital Front Office Manager', 'Patient Affairs Coordinator', 'Healthcare Compliance Officer'],
        },
        {
            code: 'detc', name: 'Diploma in Emergency & Trauma Care Technician',
            course_type: 'diploma', duration_years: 1, total_semesters: 2,
            eligibility: '12th Pass', image: '/course_img/detc.jpeg',
            description: 'The Diploma in Emergency & Trauma Care Technician prepares students to provide immediate medical assistance in emergency situations. Training covers triage, stabilization, trauma management, and emergency response protocols.',
            syllabus: ['Emergency medical procedures and triage', 'Trauma care and stabilization techniques', 'Cardiopulmonary resuscitation (CPR) and AED', 'Wound management and fracture care', 'Emergency transport and pre-hospital care', 'Disaster management and mass casualty protocols'],
            career: ['Emergency Medical Technician', 'Trauma Care Assistant', 'Ambulance Technician', 'Disaster Response Worker', 'Emergency Room Assistant', 'First Responder'],
        },
        {
            code: 'dhwm', name: 'Diploma in Hospital Waste Management',
            course_type: 'diploma', duration_years: 1, total_semesters: 2,
            eligibility: '12th Pass', image: '/course_img/dhwm.jpeg',
            description: 'The Diploma in Hospital Waste Management trains students in biomedical waste handling, disposal, and management as per government regulations. The program focuses on infection prevention and environmental safety in healthcare settings.',
            syllabus: ['Biomedical waste classification and segregation', 'Infection control and prevention protocols', 'Government regulations for biomedical waste (BMW Rules)', 'Waste treatment technologies – incineration, autoclaving', 'Environmental impact and safety measures', 'Documentation and compliance standards'],
            career: ['Biomedical Waste Manager', 'Hospital Sanitation Supervisor', 'Environmental Health Officer', 'Infection Control Assistant', 'Waste Disposal Coordinator', 'Government Health Inspector'],
        },
        {
            code: 'dccp', name: 'Diploma in Community Care Provider',
            course_type: 'diploma', duration_years: 1, total_semesters: 2,
            eligibility: '12th Pass', image: '/course_img/dccp.jpeg',
            description: 'The Diploma in Community Care Provider trains students to provide basic healthcare services and health education in community settings. Students learn about primary health care, disease prevention, and community outreach programs.',
            syllabus: ['Primary healthcare principles and community health', 'Maternal and child health programs', 'Communicable disease prevention and control', 'Health education and community outreach', 'Nutrition and public health', 'First aid and basic life support'],
            career: ['Community Health Worker', 'Primary Health Center Assistant', 'Anganwadi Health Supervisor', 'Government Health Outreach Worker', 'NGO Health Program Coordinator', 'Village Health Guide'],
        },
        {
            code: 'dshi', name: 'Diploma in Sanitary Health Inspector',
            course_type: 'diploma', duration_years: 1, total_semesters: 2,
            eligibility: '12th Pass', image: '/course_img/dshi.jpeg',
            description: 'The Diploma in Sanitary Health Inspector trains students to inspect and monitor environmental sanitation, food safety, and public health conditions. Graduates are eligible for government health inspector positions.',
            syllabus: ['Environmental sanitation and hygiene', 'Food safety inspection and standards', 'Water quality testing and surveillance', 'Epidemic investigation and control', 'Public health laws and regulations', 'Vector control and pest management'],
            career: ['Sanitary Inspector', 'Food Safety Officer', 'Public Health Inspector', 'Municipal Health Officer', 'Environment Health Officer', 'Government Sanitation Supervisor'],
        },
        {
            code: 'dnt', name: 'Diploma in Nanny Training',
            course_type: 'diploma', duration_years: 0.5, total_semesters: 1,
            eligibility: '10th Pass', image: '/course_img/dnt.jpeg',
            description: 'The Diploma in Nanny Training prepares individuals for professional childcare roles. Students learn child development, nutrition, safety, first aid, and effective caregiving techniques for children of all ages.',
            syllabus: ['Child development and growth stages', 'Infant and toddler care techniques', 'Nutrition and feeding for children', 'Child safety and first aid basics', 'Educational activities and play therapy', 'Communication and behavior management'],
            career: ['Professional Nanny', 'Daycare Center Assistant', 'Child Caregiver', 'Creche Worker', 'Pediatric Ward Helper', 'Home Childcare Provider'],
        },
        {
            code: 'dp', name: 'Diploma in Panchkarma',
            course_type: 'diploma', duration_years: 1, total_semesters: 2,
            eligibility: '12th Pass', image: '/course_img/dp.jpeg',
            description: 'The Diploma in Panchkarma provides training in the ancient Ayurvedic therapeutic system of five cleansing procedures. Students learn traditional Ayurvedic treatments, herbal therapies, and holistic wellness techniques.',
            syllabus: ['Introduction to Ayurveda and Panchkarma', 'Abhyanga and Shirodhara techniques', 'Vamana, Virechana and Basti procedures', 'Nasya and Raktamokshana therapies', 'Herbal preparation and medicinal plants', 'Ayurvedic diet and lifestyle counseling'],
            career: ['Panchkarma Therapist', 'Ayurvedic Wellness Center Practitioner', 'Spa and Wellness Therapist', 'Ayurvedic Clinic Assistant', 'Naturopathy Center Worker', 'Ayurvedic Health Resort Staff'],
        },
        {
            code: 'nddy', name: 'Diploma in Naturopathy and Yoga',
            course_type: 'diploma', duration_years: 1, total_semesters: 2,
            eligibility: '12th Pass', image: '/course_img/nddy.jpeg',
            description: 'The Diploma in Naturopathy and Yoga trains students in natural therapeutic methods and yogic practices for health promotion and disease management. The program combines ancient wisdom with modern wellness approaches.',
            syllabus: ['Naturopathy principles and philosophy', 'Yoga asanas and pranayama techniques', 'Hydrotherapy and mud therapy', 'Fasting therapy and diet protocols', 'Meditation and stress management', 'Anatomy and physiology for yoga practitioners'],
            career: ['Yoga Instructor', 'Naturopathy Practitioner', 'Wellness Center Therapist', 'Spa Therapist', 'School Yoga Teacher', 'Corporate Wellness Trainer'],
        },
        {
            code: 'dihcp', name: 'Diploma in Home Care Provider',
            course_type: 'diploma', duration_years: 1, total_semesters: 2,
            eligibility: '12th Pass', image: '/course_img/dihcp.jpeg',
            description: 'The Diploma in Home Care Provider trains students to deliver professional healthcare services to patients in their homes. Training covers elder care, patient management, medication administration, and rehabilitation support.',
            syllabus: ['Home nursing and patient care fundamentals', 'Elderly care and geriatric management', 'Medication management and wound dressing', 'Physiotherapy exercises and mobility support', 'Palliative and terminal care basics', 'Emergency response and first aid at home'],
            career: ['Home Care Nurse', 'Elder Care Provider', 'Home Health Aide', 'Patient Companion', 'Rehabilitation Support Worker', 'Private Home Nurse'],
        },
        {
            code: 'caim', name: 'Certificate in Ayurveda Infertility Management',
            course_type: 'certificate', duration_years: 0.5, total_semesters: 1,
            eligibility: '12th Pass', image: '/course_img/caim.jpeg',
            description: 'The Certificate in Ayurveda Infertility Management covers Ayurvedic approaches to reproductive health and infertility treatment. Students learn traditional Ayurvedic diagnostics and therapeutic interventions for enhancing fertility.',
            syllabus: ['Ayurvedic physiology of reproduction', 'Causes of infertility in Ayurveda', 'Panchkarma for reproductive health', 'Herbal medicines for fertility', 'Ritucharya and diet for reproductive wellness', 'Counseling for infertile couples'],
            career: ['Ayurvedic Fertility Counselor', 'Wellness Clinic Practitioner', 'Ayurvedic Health Educator', 'Reproductive Health Assistant', 'Fertility Awareness Consultant'],
        },
        {
            code: 'cand', name: 'Certificate in Ayurveda Nutrition & Dietetics',
            course_type: 'certificate', duration_years: 0.5, total_semesters: 1,
            eligibility: '12th Pass', image: '/course_img/cand.jpeg',
            description: 'The Certificate in Ayurveda Nutrition & Dietetics trains students in Ayurvedic nutritional science, dietary planning, and food-therapy principles to promote health and manage chronic diseases naturally.',
            syllabus: ['Ayurvedic food philosophy and Ahara Vidhi', 'The six tastes and their therapeutic effects', 'Tridosha-based diet planning', 'Seasonal diet and lifestyle (Ritucharya)', 'Management of lifestyle diseases through diet', 'Ayurvedic cooking and food preparation'],
            career: ['Ayurvedic Nutritionist', 'Diet Counselor', 'Wellness Center Dietitian', 'Corporate Wellness Advisor', 'Lifestyle Coach', 'Ayurvedic Food Consultant'],
        },
        {
            code: 'cap', name: 'Certificate in Ayurveda Parasurgery',
            course_type: 'certificate', duration_years: 0.5, total_semesters: 1,
            eligibility: '12th Pass', image: '/course_img/cap.jpeg',
            description: 'The Certificate in Ayurveda Parasurgery covers Ayurvedic surgical techniques including Ksharsutra therapy, leech therapy, and other minimally invasive Ayurvedic procedures for management of anorectal and skin disorders.',
            syllabus: ['Introduction to Shalya Tantra (Ayurvedic Surgery)', 'Ksharsutra therapy techniques', 'Leech therapy (Raktamokshana)', 'Agnikarma and Shastra Karma', 'Management of anorectal disorders', 'Post-operative Ayurvedic wound care'],
            career: ['Ayurvedic Parasurgery Assistant', 'Ksharsutra Therapist', 'Ayurvedic Clinic Technical Assistant', 'Wellness Practitioner', 'Panchakarma Therapist'],
        },
        {
            code: 'cacsbc', name: 'Certificate in Ayurvedic Cosmetology, Skin & Beauty Care',
            course_type: 'certificate', duration_years: 0.5, total_semesters: 1,
            eligibility: '12th Pass', image: '/course_img/cacsbc.jpeg',
            description: 'The Certificate in Ayurvedic Cosmetology, Skin & Beauty Care covers Ayurvedic beauty treatments, herbal skincare formulations, and holistic beauty therapy techniques for skin, hair, and body care.',
            syllabus: ['Ayurvedic skin types and doshas', 'Herbal face packs and skin care formulations', 'Ayurvedic hair care and scalp treatments', 'Body massage and Abhyanga techniques', 'Udvartana (herbal body scrub) procedures', 'Natural beauty and anti-aging therapies'],
            career: ['Ayurvedic Beauty Therapist', 'Herbal Cosmetics Specialist', 'Spa Therapist', 'Beauty Salon Practitioner', 'Ayurvedic Skincare Consultant', 'Wellness Resort Beauty Expert'],
        },
        {
            code: 'mphw', name: 'Multipurpose Health Worker',
            course_type: 'diploma', duration_years: 1, total_semesters: 2,
            eligibility: '12th Pass', image: '/course_img/mphw.jpeg',
            description: 'The Multipurpose Health Worker program trains students to work as frontline health workers in rural and urban community settings. Students learn basic clinical skills, health promotion, and community outreach activities.',
            syllabus: ['Primary healthcare and community medicine', 'Maternal and child health services', 'Immunization programs and cold chain management', 'Disease surveillance and health reporting', 'Family planning and reproductive health', 'Health education and awareness programs'],
            career: ['Community Health Worker', 'Government Health Center Worker', 'ASHA/ANM Support Worker', 'Primary Health Center Technician', 'NGO Field Health Worker', 'Village Health Guide'],
        },
        {
            code: 'gda', name: 'General Duty Assistant',
            course_type: 'diploma', duration_years: 1, total_semesters: 2,
            eligibility: '10th Pass', image: '/course_img/gda.jpeg',
            description: 'The General Duty Assistant program trains students to provide basic patient care, assist nursing staff, and carry out non-clinical support duties in hospitals and healthcare facilities.',
            syllabus: ['Basic nursing care and patient hygiene', 'Vital signs monitoring and documentation', 'Patient mobility, transfer and positioning', 'Infection control and hospital housekeeping', 'Medication distribution assistance', 'Patient communication and bedside manner'],
            career: ['General Duty Assistant', 'Hospital Ward Helper', 'Patient Care Attendant', 'Nursing Home Aide', 'Geriatric Care Assistant', 'Home Patient Attendant'],
        },
        {
            code: 'mba', name: 'MBA in Hospital Admin & Healthcare Management',
            course_type: 'diploma', duration_years: 2, total_semesters: 4,
            eligibility: 'Graduation in any stream', image: '/course_img/mba.jpeg',
            description: 'The MBA in Hospital Administration & Healthcare Management is a postgraduate program that develops managerial and leadership skills for the healthcare sector. Students gain expertise in hospital strategy, healthcare finance, operations, and leadership.',
            syllabus: ['Healthcare management and strategy', 'Hospital operations and quality management', 'Healthcare finance and accounting', 'Human resource management in hospitals', 'Healthcare marketing and communications', 'Health laws, ethics and regulatory compliance', 'Healthcare information systems', 'Research methodology and project management'],
            career: ['Hospital CEO/Director', 'Healthcare Operations Manager', 'Hospital Administrator', 'Healthcare Consultant', 'Health Policy Analyst', 'Pharmaceutical Management Executive', 'Insurance and TPA Manager', 'Hospital Quality Assurance Manager'],
        },
        // ─── 9 New B.Voc Courses ──────────────────────────────────────────────────
        {
            code: 'B VOC DCCT (SU)', name: 'B Voc Diploma In Cardiac Care Technology',
            course_type: 'diploma', duration_years: 1, total_semesters: 2,
            eligibility: '12th Pass (Science)', image: '/course_img/bvoc-dcct.jpeg',
            description: 'The B.Voc Diploma in Cardiac Care Technology provides advanced training in cardiac monitoring, life support systems, and cardiovascular diagnostic procedures. Students develop expertise in ECG interpretation, cardiac catheterization assistance, and critical cardiac care management.',
            syllabus: ['Cardiac anatomy and cardiovascular physiology', 'ECG interpretation and monitoring', 'Cardiac catheterization lab assistance', 'Defibrillation and cardioversion techniques', 'Hemodynamic monitoring systems', 'Cardiac rehabilitation and patient support'],
            career: ['Cardiac Care Technician', 'Cath Lab Technician', 'ECG Technician', 'Cardiac Monitoring Assistant', 'Cardiology Department Technician', 'Government Hospital Cardiac Technician'],
        },
        {
            code: 'B VOC DMLT3', name: 'B Voc Diploma In Medical Lab Technology',
            course_type: 'diploma', duration_years: 3, total_semesters: 6,
            eligibility: '12th Pass (Science)', image: '/course_img/bvoc-dmlt.jpeg',
            description: 'The B.Voc Diploma in Medical Laboratory Technology is a comprehensive 3-year program that provides in-depth training in clinical laboratory diagnostics. Students gain advanced expertise in hematology, microbiology, biochemistry, serology, and molecular diagnostics.',
            syllabus: ['Advanced clinical biochemistry and hematology', 'Microbiology, virology and parasitology', 'Molecular diagnostics and PCR techniques', 'Immunology and serology testing', 'Blood banking and transfusion medicine', 'Histopathology and cytology', 'Laboratory management and quality assurance', 'Research in lab sciences'],
            career: ['Senior Medical Lab Technician', 'Clinical Laboratory Scientist', 'Research Lab Analyst', 'Blood Bank Supervisor', 'Molecular Diagnostics Technician', 'Pathology Lab Manager', 'Government Lab Senior Technician'],
        },
        {
            code: 'B VOC MPHW', name: 'B Voc Diploma In Multi Purpose Health Worker',
            course_type: 'diploma', duration_years: 3, total_semesters: 6,
            eligibility: '12th Pass', image: '/course_img/bvoc-mphw.jpeg',
            description: 'The B.Voc Diploma in Multi Purpose Health Worker is a 3-year vocational program that trains students for comprehensive community and primary healthcare roles. Graduates are equipped for government health schemes, rural health outreach, and community disease management.',
            syllabus: ['Community health and primary care principles', 'Maternal, infant and child health care', 'Immunization programs and disease surveillance', 'Reproductive and sexual health services', 'Rural health programs and outreach', 'Emergency and first aid response', 'Health education methodologies', 'Environmental and occupational health'],
            career: ['Senior Community Health Worker', 'Government Health Outreach Officer', 'Primary Health Center In-charge', 'ASHA Supervisor', 'Community Nurse', 'Health Program Coordinator', 'Government ANM/MPHW'],
        },
        {
            code: 'B VOC OTT', name: 'B Voc Diploma In Operation Theatre Technology',
            course_type: 'diploma', duration_years: 3, total_semesters: 6,
            eligibility: '12th Pass (Science)', image: '/course_img/bvoc-ott.jpeg',
            description: 'The B.Voc Diploma in Operation Theatre Technology is a 3-year professional program that prepares students for advanced roles in surgical and operative care. Students develop expertise in surgical assistance, anesthesia support, sterilization, and OT management.',
            syllabus: ['Advanced surgical anatomy and terminology', 'Comprehensive sterilization and infection control', 'Surgical instrument sets and specialized equipment', 'Anesthesia monitoring and airway management', 'Laparoscopic and endoscopic procedure assistance', 'OT management and team coordination', 'Emergency surgical protocols', 'Quality standards in operation theatres'],
            career: ['Senior OT Technician', 'Surgical Scrub Technician', 'Laparoscopy Assistant', 'OT Supervisor', 'Government Hospital OT In-charge', 'Surgical Center Manager', 'Specialty Surgical Technologist'],
        },
        {
            code: 'B VOC DMLT', name: 'B Voc Diploma In Radiology & Medical Imaging Technology',
            course_type: 'diploma', duration_years: 3, total_semesters: 6,
            eligibility: '12th Pass (Science)', image: '/course_img/bvoc-radiology.jpeg',
            description: 'The B.Voc Diploma in Radiology & Medical Imaging Technology is a 3-year advanced program training students in all modalities of medical imaging including X-ray, CT scan, MRI, ultrasound, mammography, and nuclear medicine imaging.',
            syllabus: ['Advanced radiological physics and imaging principles', 'X-ray technique and image processing', 'CT scan procedures and protocols', 'MRI safety and imaging techniques', 'Ultrasound and sonography fundamentals', 'Nuclear medicine and PET scan basics', 'Mammography and specialized imaging', 'Radiation protection and dosimetry'],
            career: ['Senior Radiographer', 'CT Scan Technologist', 'MRI Technologist', 'Ultrasound Technician', 'Nuclear Medicine Technologist', 'Radiology Department Supervisor', 'Medical Imaging Specialist'],
        },
        {
            code: 'DAT3', name: 'Diploma In Anesthesia',
            course_type: 'diploma', duration_years: 2, total_semesters: 4,
            eligibility: '12th Pass (Science)', image: '/course_img/dat3.jpeg',
            description: 'The Diploma in Anesthesia is a 2-year program providing in-depth training in anesthesia delivery, patient monitoring, airway management, and perioperative care. Students work alongside anesthesiologists in surgical suites, ICUs, and pain management clinics.',
            syllabus: ['Principles of general, regional and local anesthesia', 'Airway management and intubation', 'Anesthesia machine operation and maintenance', 'Perioperative patient monitoring', 'Pediatric and obstetric anesthesia basics', 'Complications management and emergency response', 'Pain management principles', 'Post-anesthesia care unit (PACU) protocols'],
            career: ['Anesthesia Technician (Senior)', 'OT Anesthesia Support Specialist', 'Pain Clinic Technician', 'Anesthesia Equipment Specialist', 'Government Hospital Anesthesia Assistant'],
        },
        {
            code: 'DMLT3', name: 'Diploma In Medical Lab Technology',
            course_type: 'diploma', duration_years: 2, total_semesters: 4,
            eligibility: '12th Pass (Science)', image: '/course_img/dmlt3.jpeg',
            description: 'The Diploma in Medical Lab Technology (2-year program) provides advanced laboratory training in clinical and research diagnostics. Students gain expertise in advanced biochemistry, hematology, microbiology, serology, and modern diagnostic techniques.',
            syllabus: ['Advanced hematology and clinical biochemistry', 'Medical microbiology and parasitology', 'Serology and immunological investigations', 'Blood banking and transfusion practice', 'Histological and cytological techniques', 'Laboratory information systems and quality management', 'Research methodology in lab sciences'],
            career: ['Medical Laboratory Technologist', 'Senior Lab Analyst', 'Clinical Research Laboratory Assistant', 'Pathology Lab Technician (Senior)', 'Blood Bank Technologist', 'Government Lab Senior Staff'],
        },
        {
            code: 'DOTT3', name: 'Diploma In Operation Theatre Technician',
            course_type: 'diploma', duration_years: 2, total_semesters: 4,
            eligibility: '12th Pass', image: '/course_img/dott3.jpeg',
            description: 'The 2-year Diploma in Operation Theatre Technician program provides advanced training in surgical support, OT management, and specialized surgical procedure assistance. Students learn to manage complex surgical cases and specialty OT setups.',
            syllabus: ['Advanced surgical anatomy and physiology', 'Complex sterilization and disinfection protocols', 'Specialty surgical instrument management', 'Laparoscopic and robotic surgery assistance', 'OT management, stock and documentation', 'Surgical emergencies and rapid response', 'Quality control in operation theatres'],
            career: ['Senior OT Technician', 'Scrub Nurse Assistant', 'Laparoscopy Tech Specialist', 'OT Supervisor', 'Specialty Surgery Assistant', 'Government Hospital OT Senior Staff'],
        },
        {
            code: 'DRIT3', name: 'Diploma in Radiology & Imaging Technology',
            course_type: 'diploma', duration_years: 2, total_semesters: 4,
            eligibility: '12th Pass (Science)', image: '/course_img/drit3.jpeg',
            description: 'The 2-year Diploma in Radiology & Imaging Technology provides advanced training in all radiological modalities. Students develop skills in CT, MRI, ultrasound, and interventional radiology procedures beyond the basic 1-year program.',
            syllabus: ['Advanced radiological anatomy and physics', 'CT scan advanced protocols and reconstruction', 'MRI safety, coils and imaging sequences', 'Interventional radiology procedures', 'Mammography and DEXA scanning', 'Radiation dosimetry and safety', 'PACS and digital imaging management'],
            career: ['Advanced Radiographer', 'CT/MRI Technologist', 'Interventional Radiology Assistant', 'Ultrasound Specialist', 'Radiology Supervisor', 'Government Radiography Senior Technician'],
        },
    ];

    let created = 0;
    let updated = 0;

    for (const c of allCourses) {
        const existing = await Program.findOne({ code: c.code });

        if (existing) {
            // Always update content fields (overwrite with proper data)
            await Program.updateOne({ _id: existing._id }, {
                $set: {
                    name: c.name,
                    description: c.description,
                    shortDescription: c.description.slice(0, 200),
                    course_type: c.course_type,
                    duration_years: c.duration_years,
                    total_semesters: c.total_semesters,
                    image: c.image,
                    eligibilitySummary: c.eligibility,
                    syllabus: c.syllabus,
                    careerOptions: c.career,
                    is_active: true,
                }
            });
            updated++;
        } else {
            await Program.create({
                name: c.name,
                code: c.code,
                description: c.description,
                shortDescription: c.description.slice(0, 200),
                course_type: c.course_type,
                duration_years: c.duration_years,
                total_semesters: c.total_semesters,
                is_active: true,
                image: c.image,
                eligibilitySummary: c.eligibility,
                syllabus: c.syllabus,
                careerOptions: c.career,
                displayOrder: created,
            });
            created++;
        }
    }

    return NextResponse.json({
        success: true,
        message: `Migration complete: ${created} created, ${updated} updated with full content.`,
    });
}
