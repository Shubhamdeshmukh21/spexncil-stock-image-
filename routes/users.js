const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  contact: String,
  profileImage: {
    data: Buffer,
    contentType: String,
  },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  likedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
});

UserSchema.plugin(passportLocalMongoose); // adds username, hash, salt, authenticate etc.

module.exports = mongoose.model('User', UserSchema);
