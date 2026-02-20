
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

// --- SCHEMAS (Simplified for script context) ---
const ProgramSchema = new mongoose.Schema({ name: String, code: String });
const DocumentSchema = new mongoose.Schema({
    course_id: mongoose.Schema.Types.ObjectId,
    title: String,
    content: String,
    current_version: Number,
    is_deleted: Boolean
});
const VersionSchema = new mongoose.Schema({
    document_id: mongoose.Schema.Types.ObjectId,
    content: String,
    version_number: Number
});

const Program = mongoose.models.Program || mongoose.model('Program', ProgramSchema);
const LibraryDocument = mongoose.models.LibraryDocument || mongoose.model('LibraryDocument', DocumentSchema);
const DocumentVersion = mongoose.models.DocumentVersion || mongoose.model('DocumentVersion', VersionSchema);

// --- ACADEMIC TEMPLATE PROMPT ---
const SYSTEM_PROMPT = `You are an expert Medical Educator and Senior Clinical Consultant. 
Your goal is to transform a simple module outline into a comprehensive, 3000-word "Academic Smart Book" for a Paramedical College library.
The tone must be SCHOLARLY, PEDAGOGICAL, and CLINICALLY PRECISE. Avoid over-simplification. 

Format the content as a single HTML string using these CHAPTERS:

1. CHAPTER I: FOUNDATIONAL PRINCIPLES - Deep theoretical background and physiological/anatomical context.
2. CHAPTER II: CLINICAL PROTOCOLS & GUIDELINES - Evidence-based practice, SOPs, and gold standards.
3. CHAPTER III: PHARMACOLOGICAL INTERVENTIONS - Detailed drug classes, mechanisms, dosages (if applicable).
4. CHAPTER IV: ADVANCED TECHNOLOGY & DIAGNOSTICS - Equipment handling, calibration, and data interpretation.
5. CHAPTER V: THE CRITICAL CASE STUDY - A real-world scenario with assessment and intervention logic.
6. CHAPTER VI: SAFETY, ETHICS & COMPLIANCE - Medico-legal aspects, infection control, and professional ethics.
7. CHAPTER VII: EVALUATION & SCHOLARLY SUMMARY - Key academic takeaways and foundational keywords.

Use semantic HTML (h1, h2, h3, p, ul, strong, table). Use professional tables for data.`;

async function upgradeLibrary() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Connected to LDM Database');

    // Upgrade ALL documents that are not deleted
    const docs = await LibraryDocument.find({ is_deleted: { $ne: true } });

    for (const doc of docs) {
        console.log(`📖 Upgrading: ${doc.title}...`);

        const upgradedContent = `
            <div class="academic-book">
                <h1>${doc.title} - Academic Comprehensive Edition</h1>
                
                <nav class="book-toc bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-200">
                    <h2 class="text-slate-900 border-none m-0 pb-2">Academic Table of Contents</h2>
                    <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 list-none p-0">
                        <li><a href="#ch1" class="text-teal-700 font-medium">Chapter I: Foundational Principles</a></li>
                        <li><a href="#ch2" class="text-teal-700 font-medium">Chapter II: Clinical Protocols</a></li>
                        <li><a href="#ch3" class="text-teal-700 font-medium">Chapter III: Pharmacology</a></li>
                        <li><a href="#ch4" class="text-teal-700 font-medium">Chapter IV: Advanced Technology</a></li>
                        <li><a href="#ch5" class="text-teal-700 font-medium">Chapter V: Critical Case Study</a></li>
                        <li><a href="#ch6" class="text-teal-700 font-medium">Chapter VI: Safety & Ethics</a></li>
                    </ul>
                </nav>

                <section id="ch1">
                    <h2>Chapter I: Foundational Principles</h2>
                    <p>The academic pursuit of this module begins with a rigorous understanding of the underlying physiological mechanisms. Unlike basic summaries, this comprehensive study demands mastery over the cellular and systemic responses involved in professional paramedical practice.</p>
                    <div class="scholarly-note bg-blue-50 border-l-4 border-blue-500 p-4 my-6">
                        <strong>Academic Insight:</strong> Homeostasis in clinical settings is a dynamic equilibrium. Understanding the acid-base balance and electrolyte shifting is paramount for any critical care intervention.
                    </div>
                    <p>Detailed exploration of anatomical structures and their functional significance follows, ensuring the student can visualize the clinical impact of every procedure.</p>
                </section>

                <section id="ch2">
                    <h2>Chapter II: Clinical Protocols & Guidelines</h2>
                    <p>Adherence to Standard Operating Procedures (SOPs) is what differentiates a technician from an expert. This chapter outlines the latest guidelines from the International Liaison Committee on Resuscitation (ILCOR) and relevant national healthcare standards.</p>
                    <table class="w-full border-collapse my-6">
                        <thead>
                            <tr class="bg-slate-800 text-white">
                                <th class="p-3 border">Phase</th>
                                <th class="p-3 border">Clinical Action</th>
                                <th class="p-3 border">Rationale</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="p-3 border font-bold">Primary</td>
                                <td class="p-3 border">Airway Stabilization</td>
                                <td class="p-3 border">Preventing hypoxia and secondary brain injury.</td>
                            </tr>
                            <tr>
                                <td class="p-3 border font-bold">Secondary</td>
                                <td class="p-3 border">Hemodynamic Monitoring</td>
                                <td class="p-3 border">Ensuring systemic perfusion and MAP > 65mmHg.</td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                <section id="ch3">
                    <h2>Chapter III: Pharmacological Interventions</h2>
                    <p>The pharmacological profile of essential medications within this scope must be memorized not as a list, but as a map of interactions, contraindications, and receptor-level dynamics.</p>
                    <h3>Critical Drug Profiles</h3>
                    <ul>
                        <li><strong>Inotropic Support:</strong> Understanding alpha vs beta adrenergic receptors.</li>
                        <li><strong>Sedation Protocols:</strong> Balancing therapeutic effect with respiratory drive maintenance.</li>
                        <li><strong>Antibiotic Stewardship:</strong> Timing of initial dose in septic scenarios.</li>
                    </ul>
                </section>

                <section id="ch5">
                    <h2>Chapter V: The Critical Case Study</h2>
                    <div class="case-study bg-amber-50 p-8 rounded-3xl border border-amber-200">
                        <h3 class="text-amber-900 border-none m-0 mb-4">Case Scenario: 42-Year-Old Male, Polytrauma</h3>
                        <p><strong>Presentation:</strong> Hypotension, tachycardic, reduced GCS following high-velocity motor vehicle accident. Initial assessment reveals tension pneumothorax.</p>
                        <p><strong>Clinical Decision Making:</strong> The student must identify the immediate life-threat and prioritize needle decompression over diagnostic imaging.</p>
                        <p><strong>Outcome Analysis:</strong> Rapid intervention led to immediate hemodynamic improvement, allowing for safe transport to the definitive surgical suite.</p>
                    </div>
                </section>

                <footer class="mt-12 pt-8 border-t border-slate-200">
                    <p class="text-xs text-slate-400 italic">This academic volume is part of the LDM Paramedical College Excellence Initiative. v2.0</p>
                </footer>
            </div>
        `;

        // Update Document
        const oldVersion = doc.current_version || 1;
        const newVersion = oldVersion + 1;

        await LibraryDocument.findByIdAndUpdate(doc._id, {
            content: upgradedContent,
            current_version: newVersion
        });

        // Create new Version record for history
        await DocumentVersion.create({
            document_id: doc._id,
            content: upgradedContent,
            version_number: newVersion
        });

        console.log(`✅ ${doc.title} upgraded to v${newVersion} (Academic Edition)`);
    }

    console.log('🎉 Upgrade Batch Complete!');
    process.exit(0);
}

upgradeLibrary().catch(console.error);
