const mongoose = require('mongoose');  // keep this if you define schemas or models here
// Remove mongoose.connect() from this file

const plm = require("passport-local-mongoose");



const userSchema = new mongoose.Schema({
  username: String, // used by passport-local-mongoose
  name: String,
  email: String,
  // password: String,  <--- REMOVE this, plm handles it internally
  profileImage: String,
  contact: Number,
  boards: {
    type: Array,
    default: [],
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
    },
  ],
  likedPosts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
    },
  ],
});

// plugin passport-local-mongoose to handle username and hashed password
userSchema.plugin(plm);

module.exports = mongoose.model("user", userSchema);
