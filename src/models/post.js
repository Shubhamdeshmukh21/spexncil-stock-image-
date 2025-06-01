const mongoose = require('mongoose');
const { Schema } = mongoose;

const postSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  title: String,
  description: String,
  image: {
    data: Buffer,
    contentType: String,
  },
}, { timestamps: true });

// ✅ Prevent OverwriteModelError
module.exports = mongoose.models.Post || mongoose.model('Post', postSchema);
