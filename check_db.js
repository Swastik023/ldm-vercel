const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://swastikp2003:t20A7Y6wS8o0rEDx@ldm-erp.g5qym.mongodb.net/ldm_college");
const Notice = mongoose.model('Notice', new mongoose.Schema({ attachmentUrl: String }, { strict: false }));
Notice.find().sort({createdAt: -1}).limit(2).then(res => {
  console.log(res);
  process.exit(0);
});
