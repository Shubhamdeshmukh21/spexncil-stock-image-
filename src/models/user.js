const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  username: String, // ✅ REQUIRED for passport-local-mongoose
  name: String,
  contact: String,
  posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  likedPosts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  profileImage: {
    data: Buffer,
    contentType: String,
  }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
