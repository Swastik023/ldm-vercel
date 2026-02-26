require('dotenv').config({ path: '.env.local' });
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
// Create a fake 10-byte PDF buffer
const buffer = Buffer.from('%PDF-1.4\n');
cloudinary.uploader.upload_stream(
  {
    folder: 'ldm_notices',
    resource_type: 'image',
    use_filename: true,
    unique_filename: true,
    filename_override: 'test_pdf.pdf'
  },
  (err, res) => {
    console.log(err ? err : res);
  }
).end(buffer);
