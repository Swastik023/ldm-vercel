export interface CourseData {
    id: string;
    title: string;
    duration: string;
    eligibility: string;
    image: string;
    description: string;
    syllabus: string[];
    career: string[];
}

export const courseData: CourseData[] = [
    {
        id: "dccm",
        title: "Diploma in Critical Care Management",
        duration: "1 Years",
        eligibility: "12th Pass with Science",
        image: "/img1.jpeg",
        description: "The Diploma in Critical Care Management provides comprehensive training in managing intensive care units and critical patients. Students learn advanced patient monitoring, ventilator management, emergency response protocols, and specialized care techniques. The program emphasizes hands-on training with modern ICU equipment, understanding critical care procedures, and developing quick decision-making skills in emergency situations.",
        syllabus: [
            "Patient monitoring techniques and equipment",
            "Ventilator management and troubleshooting",
            "Infection control protocols in ICU",
            "Emergency and resuscitation procedures",
            "ICU equipment operation and maintenance",
            "Pharmacology for critical care patients"
        ],
        career: [
            "ICU Technician",
            "Critical Care Assistant",
            "Healthcare Coordinator in Hospitals",
            "Government Hospital ICU Technician",
            "Critical Care Specialist in Military Hospitals",
            "Emergency Care Coordinator in Government Medical Colleges",
            "Technical Officer in Government Healthcare Facilities"
        ]
    },
    {
        id: "dhm",
        title: "Diploma in Hospital Management",
        duration: "1 Year",
        eligibility: "12th Pass",
        image: "/img2.jpeg",
        description: "The Diploma in Hospital Management is designed to prepare students for administrative and managerial roles in the healthcare sector. The program covers topics such as hospital operations, healthcare policies, quality management, medical ethics, patient services, and financial management. Students learn to efficiently manage hospital infrastructure, optimize resource utilization, and ensure smooth patient care processes.",
        syllabus: [
            "Hospital operations and workflow management",
            "Quality standards and accreditation in healthcare",
            "Patient care services and experience optimization",
            "Finance and resource management in hospitals",
            "Medical ethics and healthcare policies",
            "Basics of public health administration"
        ],
        career: [
            "Hospital Manager",
            "Administrative Officer",
            "Healthcare Coordinator",
            "Government Hospital Administrator",
            "Public Health Department Manager",
            "Healthcare Project Manager in Government Schemes",
            "Medical Administrative Officer in Armed Forces"
        ]
    },
    {
        id: "dat",
        title: "Diploma in Anaesthesia Technology (DAT)",
        duration: "2.5 Years",
        eligibility: "12th Pass with Science",
        image: "/img3.jpeg",
        description: "The Diploma in Anaesthesia Technology equips students with the knowledge and technical skills to assist anesthesiologists during surgeries and medical procedures. The curriculum includes topics such as pharmacology, patient preparation, anesthetic equipment, monitoring vital signs, and managing emergencies during anesthesia administration. Graduates are trained to handle advanced machines like ventilators and monitors, ensuring patient safety.",
        syllabus: [
            "Principles of anesthesia",
            "Medical equipment operation",
            "Patient monitoring techniques",
            "Emergency response procedures",
            "Pharmacology basics",
            "Operation theatre protocols"
        ],
        career: [
            "Anesthesia Technician",
            "OT Technical Assistant",
            "Medical Equipment Specialist",
            "Government Hospital Anesthesia Technician",
            "Technical Officer in Government Medical Colleges",
            "Anesthesia Assistant in Military Hospitals",
            "Technical Specialist in Government Healthcare Programs"
        ]
    },
    {
        id: "dcp",
        title: "Diploma in Community Care Provider",
        duration: "1 Year",
        eligibility: "12th Pass",
        image: "/img4.jpeg",
        description: "The Diploma in Community Care Provider focuses on training individuals to deliver primary healthcare and social support services to communities, especially in underserved or rural areas. The curriculum includes public health education, disease prevention, health promotion, maternal and child care, and basic first aid. Graduates work closely with healthcare organizations, NGOs, and community health programs to improve the overall health and well-being of communities.",
        syllabus: [
            "Community health basics",
            "Primary healthcare delivery",
            "Health education and promotion",
            "Basic nursing care",
            "First aid and emergency care",
            "Public health awareness"
        ],
        career: [
            "Community Health Worker",
            "Healthcare Educator",
            "Primary Care Assistant",
            "Government Community Health Officer",
            "National Health Mission Worker",
            "Rural Healthcare Coordinator",
            "Public Health Program Coordinator"
        ]
    },
    {
        id: "detc",
        title: "Diploma in Emergency & Trauma Care Technician",
        duration: "1 Years",
        eligibility: "12th Pass with Science",
        image: "/img5.jpeg",
        description: "This program provides in-depth training in managing medical emergencies and trauma care. Students learn skills such as first aid, CPR, advanced life support, wound management, and handling emergency equipment. The course emphasizes rapid assessment and stabilization of critically ill or injured patients. Graduates find employment as emergency medical technicians (EMTs) in ambulance services, emergency rooms, and trauma centers, where quick decision-making is crucial.",
        syllabus: [
            "Emergency medical procedures",
            "Trauma care management",
            "Patient assessment techniques",
            "Life support protocols",
            "Medical equipment operation",
            "Disaster management"
        ],
        career: [
            "Emergency Care Technician",
            "Trauma Care Specialist",
            "Ambulance Technician",
            "Government Emergency Response Team Member",
            "Disaster Management Team Technician",
            "Emergency Medical Services Officer",
            "Trauma Care Specialist in Government Hospitals"
        ]
    },
    {
        id: "dhsi",
        title: "Diploma in Health & Sanitary Inspector",
        duration: "1 Year",
        eligibility: "12th Pass",
        image: "/img6.jpeg",
        description: "The Diploma in Health & Sanitary Inspector program focuses on maintaining public health through hygiene, sanitation, and disease prevention. Students are trained in environmental health, waste management, food safety, and water quality analysis. The course also includes legal frameworks related to sanitation and public health standards. Graduates typically work as health inspectors or environmental health officers in government health departments, municipal corporations, and private industries.",
        syllabus: [
            "Public health and hygiene",
            "Environmental sanitation",
            "Food safety standards",
            "Water quality management",
            "Disease prevention",
            "Health regulations"
        ],
        career: [
            "Health Inspector",
            "Sanitation Officer",
            "Environmental Health Specialist",
            "Municipal Health Inspector",
            "Food Safety Officer",
            "Public Health Inspector in Government Departments",
            "Environmental Health Officer in Local Bodies"
        ]
    },
    {
        id: "dhcp",
        title: "Diploma in Home Care Provider",
        duration: "1 Year",
        eligibility: "12th Pass",
        image: "/img7.jpeg",
        description: "The Diploma in Home Care Provider prepares individuals to care for patients who require assistance with daily living in their homes. Students are trained in patient hygiene, nutrition, medication administration, mobility support, and emotional well-being. This program is especially valuable for those caring for elderly, disabled, or chronically ill patients. Graduates often work as professional caregivers, offering compassionate care and improving the quality of life for their clients.",
        syllabus: [
            "Patient care fundamentals",
            "Geriatric care",
            "Nutrition and diet planning",
            "Basic nursing procedures",
            "Emergency response",
            "Mental health support"
        ],
        career: [
            "Home Care Provider",
            "Patient Care Assistant",
            "Elder Care Specialist",
            "Government Healthcare Assistant",
            "Social Welfare Department Caregiver",
            "Healthcare Provider in Government Senior Care Programs",
            "Community Healthcare Worker"
        ]
    },
    {
        id: "dha",
        title: "Diploma in Hospital Administration",
        duration: "1 Year",
        eligibility: "12th Pass",
        image: "/img8.jpeg",
        description: "The Diploma in Hospital Administration focuses on the organizational and operational aspects of healthcare facilities. Students learn about hospital operations, resource management, patient care services, healthcare policies, and medical ethics. The program also includes training in communication, leadership, and staff coordination. Graduates are well-prepared to take up roles as hospital administrators, department managers, or healthcare consultants.",
        syllabus: [
            "Healthcare management",
            "Hospital operations",
            "Medical records management",
            "Healthcare economics",
            "Quality assurance",
            "Staff management"
        ],
        career: [
            "Hospital Administrator",
            "Healthcare Manager",
            "Operations Coordinator",
            "Government Hospital Administrative Officer",
            "Healthcare Program Manager in Public Sector",
            "Medical Institution Administrator",
            "Public Health Department Coordinator"
        ]
    },
    {
        id: "dhwm",
        title: "Diploma in Hospital Waste Management",
        duration: "1 Year",
        eligibility: "12th Pass",
        image: "/img9.jpeg",
        description: "This diploma provides specialized training in the management and disposal of biomedical waste in healthcare facilities. The curriculum covers waste segregation, sterilization, disposal methods, and compliance with environmental and safety regulations. Students also learn about infection control and sustainability practices. Graduates are qualified to work as waste management officers or environmental health specialists in hospitals and healthcare organizations.",
        syllabus: [
            "Biomedical waste handling",
            "Sterilization techniques",
            "Safety protocols",
            "Environmental regulations",
            "Infection control",
            "Documentation procedures"
        ],
        career: [
            "Waste Management Officer",
            "Environmental Health Specialist",
            "Infection Control Coordinator",
            "Government Hospital Waste Management Officer",
            "Environmental Safety Officer in Public Healthcare",
            "Biomedical Waste Management Specialist",
            "Municipal Waste Management Coordinator"
        ]
    },
    {
        id: "dmlt",
        title: "Diploma in Medical Laboratory Technology (DMLT)",
        duration: "2.5 Years",
        eligibility: "12th Pass with Science",
        image: "/img10.jpeg",
        description: "The Diploma in Medical Laboratory Technology prepares students for careers in diagnostic laboratories. The program includes training in hematology, microbiology, clinical biochemistry, and pathology. Students learn to operate laboratory equipment, collect and analyze samples, and maintain accurate reports. Graduates work as lab technicians in hospitals, diagnostic centers, research labs, and blood banks, contributing to accurate diagnosis and treatment.",
        syllabus: [
            "Clinical laboratory procedures",
            "Sample collection and analysis",
            "Laboratory equipment operation",
            "Quality control protocols",
            "Pathology basics",
            "Medical terminology"
        ],
        career: [
            "Medical Lab Technician",
            "Diagnostic Specialist",
            "Laboratory Coordinator",
            "Government Hospital Lab Technician",
            "Public Health Laboratory Specialist",
            "Research Lab Technician in Government Institutions",
            "Blood Bank Technician in Government Hospitals"
        ]
    },
    {
        id: "dnt",
        title: "Diploma in Nanny Training",
        duration: "1 Year",
        eligibility: "10th Pass",
        image: "/img11.jpeg",
        description: "The Diploma in Nanny Training is tailored for individuals aspiring to work as professional nannies or childcare providers. The program covers child psychology, early childhood education, nutrition, hygiene, and safety. Students also learn first aid and techniques to handle emergencies. Graduates find opportunities in childcare centers, schools, or private households, providing expert care and support for children.",
        syllabus: [
            "Child development",
            "Nutrition and meal planning",
            "First aid for children",
            "Safety and hygiene",
            "Activity planning",
            "Behavioral management"
        ],
        career: [
            "Professional Nanny",
            "Childcare Provider",
            "Early Childhood Educator",
            "Government Daycare Center Supervisor",
            "Anganwadi Worker",
            "Child Development Project Officer",
            "Early Childhood Care Specialist in Government Programs"
        ]
    },
    {
        id: "dott",
        title: "Diploma in Operation Theatre Technology (DOTT)",
        duration: "2.5 Years",
        eligibility: "12th Pass with Science",
        image: "/img12.jpeg",
        description: "This diploma trains students to assist in surgical procedures by managing operation theater equipment, maintaining sterilized environments, and supporting surgeons during operations. The curriculum includes anatomy, surgical procedures, infection control, and anesthesia techniques. Graduates are employed as operation theater technicians in hospitals, where they play a critical role in ensuring successful surgeries.",
        syllabus: [
            "Surgical procedures",
            "OT equipment management",
            "Sterilization techniques",
            "Patient preparation",
            "Emergency protocols",
            "Surgical assistance"
        ],
        career: [
            "Operation Theatre Technician",
            "Surgical Assistant",
            "OT Equipment Specialist",
            "Government Hospital OT Technician",
            "Surgical Technology Specialist in Government Medical Colleges",
            "Technical Officer in Military Hospitals",
            "Operation Theatre Manager in Public Healthcare"
        ]
    },
    {
        id: "dp",
        title: "Diploma in Panchkarma",
        duration: "1 Year",
        eligibility: "12th Pass",
        image: "/img13.jpeg",
        description: "The Diploma in Panchkarma focuses on the principles of Ayurveda, specifically the detoxification and rejuvenation therapy known as Panchkarma. Students learn about Ayurvedic treatments, herbal medicines, massage techniques, and lifestyle counseling. This program is ideal for those interested in natural healing practices. Graduates can work in wellness centers, Ayurvedic clinics, or as independent practitioners.",
        syllabus: [
            "Ayurvedic principles",
            "Panchkarma procedures",
            "Herbal medicine",
            "Massage techniques",
            "Patient consultation",
            "Treatment planning"
        ],
        career: [
            "Panchkarma Therapist",
            "Ayurvedic Assistant",
            "Wellness Consultant",
            "Government Ayurvedic Hospital Therapist",
            "AYUSH Department Specialist",
            "Ayurvedic Treatment Officer",
            "Panchkarma Specialist in Government Wellness Centers"
        ]
    },
    {
        id: "drit",
        title: "Diploma in Radiology & Imaging Technology (DRIT)",
        duration: "2.5 Years",
        eligibility: "12th Pass with Science",
        image: "/img14.jpeg",
        description: "This program provides comprehensive training in diagnostic imaging techniques such as X-rays, CT scans, MRIs, and ultrasound. Students are taught patient positioning, radiation safety, image interpretation, and equipment maintenance. The curriculum emphasizes accuracy and attention to detail. Graduates typically work as radiology technicians in hospitals, diagnostic centers, and imaging labs.",
        syllabus: [
            "Radiological procedures",
            "Imaging equipment operation",
            "Radiation safety",
            "Patient positioning",
            "Image processing",
            "Equipment maintenance"
        ],
        career: [
            "Radiology Technician",
            "Imaging Specialist",
            "X-Ray Technologist",
            "Government Hospital Radiology Technician",
            "Medical Imaging Officer in Government Hospitals",
            "Radiography Specialist in Public Healthcare",
            "Technical Officer in Government Diagnostic Centers"
        ]
    },
    {
        id: "mphw",
        title: "Multipurpose Health Worker (MPHW)",
        duration: "2 Years",
        eligibility: "12th Pass",
        image: "/img15.jpeg",
        description: "The Multipurpose Health Worker program is designed to train individuals to provide basic healthcare services in rural and urban areas. The course covers immunization, maternal and child health, communicable disease prevention, and health education. Graduates work in government healthcare programs, NGOs, and primary health centers, delivering essential health services to communities in need.",
        syllabus: [
            "Primary healthcare",
            "Maternal and child health",
            "Immunization programs",
            "Disease prevention",
            "Health education",
            "Community outreach"
        ],
        career: [
            "Community Health Worker",
            "Primary Healthcare Provider",
            "Health Educator",
            "Government Health Worker",
            "National Health Mission Worker",
            "Rural Health Care Provider",
            "Public Health Program Coordinator"
        ]
    },
    {
        id: "caim",
        title: "Certificate in Ayurveda Infertility Management",
        duration: "6 Months",
        eligibility: "BAMS or equivalent",
        image: "/img9.jpeg",
        description: "This certification course provides comprehensive training in Ayurvedic approaches to infertility management. Students learn traditional Ayurvedic principles and modern techniques for treating infertility, including dietary recommendations, herbal remedies, and therapeutic procedures.",
        syllabus: [
            "Ayurvedic principles of reproduction",
            "Infertility diagnosis in Ayurveda",
            "Herbal medicine for fertility",
            "Therapeutic procedures",
            "Diet and lifestyle management",
            "Case studies and clinical practice"
        ],
        career: [
            "Ayurvedic Fertility Specialist",
            "Consultant in Ayurvedic Hospitals",
            "Private Practice",
            "Research in Ayurvedic Medicine",
            "Ayurvedic Health Center Manager",
            "Wellness Center Specialist"
        ]
    },
    {
        id: "cand",
        title: "Certificate in Ayurveda Nutrition & Dietetics",
        duration: "6 Months",
        eligibility: "12th Pass with Science",
        image: "/img10.jpeg",
        description: "This program focuses on Ayurvedic principles of nutrition and dietary management. Students learn about food properties, dietary recommendations for different body types, and therapeutic diet planning according to Ayurvedic principles.",
        syllabus: [
            "Basics of Ayurvedic nutrition",
            "Food properties and classifications",
            "Diet planning for different doshas",
            "Therapeutic nutrition",
            "Modern nutrition science",
            "Clinical diet counseling"
        ],
        career: [
            "Ayurvedic Nutritionist",
            "Diet Consultant",
            "Wellness Coach",
            "Health Center Nutritionist",
            "Ayurvedic Food Specialist",
            "Nutrition Educator"
        ]
    },
    {
        id: "cap",
        title: "Certificate in Ayurveda Parasurgery",
        duration: "1 Year",
        eligibility: "BAMS or equivalent",
        image: "/img11.jpeg",
        description: "This certification provides specialized training in Ayurvedic parasurgical procedures. The course covers traditional surgical techniques, wound management, and post-operative care following Ayurvedic principles.",
        syllabus: [
            "Parasurgical procedures",
            "Wound management",
            "Surgical instruments",
            "Pre and post-operative care",
            "Ayurvedic healing methods",
            "Clinical practice"
        ],
        career: [
            "Ayurvedic Surgeon",
            "Parasurgical Specialist",
            "Clinical Practitioner",
            "Surgical Assistant",
            "Wound Care Specialist",
            "Research Associate"
        ]
    },
    {
        id: "cacsbc",
        title: "Certificate in Ayurvedic Cosmetology, Skin & Beauty Care",
        duration: "6 Months",
        eligibility: "12th Pass",
        image: "/img12.jpeg",
        description: "This certification course focuses on Ayurvedic approaches to skincare and beauty treatments. Students learn about natural cosmetics, skin types according to Ayurveda, and traditional beauty enhancement techniques.",
        syllabus: [
            "Ayurvedic skin care principles",
            "Natural cosmetics preparation",
            "Beauty therapy techniques",
            "Facial treatments",
            "Hair care methods",
            "Practical training"
        ],
        career: [
            "Ayurvedic Beauty Therapist",
            "Skin Care Specialist",
            "Beauty Center Manager",
            "Natural Cosmetics Consultant",
            "Spa Therapist",
            "Wellness Center Specialist"
        ]
    }
];
