const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    name: { type: String },
    password: { type: String },
  },
  {
    collection: "users",
  }
);

module.exports = mongoose.model("users", UserSchema);
