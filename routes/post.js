const mongoose  = require("mongoose");

const postSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  title: String,
  description: String,
  image: {
    data: Buffer,
    contentType: String
  },
});

module.exports = mongoose.model("post", postSchema);
