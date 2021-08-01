const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const InfoSchema = new Schema(
  {
    index: { type: Number },
    title: { type: String },
    date: { type: String },
    edit_date: { type: String },
    tag: { type: String },
    classify: { type: String },
    status: { type: String },
  },
  {
    collection: "infos",
  }
);

module.exports = mongoose.model("infos", InfoSchema);
