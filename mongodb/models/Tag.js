const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TagSchema = new Schema(
  {
    name: { type: String, default: "" },
  },
  { collection: "tags" }
);

module.exports = mongoose.model("tags", TagSchema);
