const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/spexncil");

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
