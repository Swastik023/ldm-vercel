import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const schema = new mongoose.Schema({ name: String, course_type: String });
const Program = mongoose.models.Program || mongoose.model('Program', schema);

async function main() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const programs = await Program.find().lean();
    console.log(JSON.stringify(programs.map(p => ({
        id: p._id.toString(),
        name: p.name,
        type: p.course_type || 'diploma'
    })), null, 2));
    process.exit(0);
}

main().catch(console.error);
