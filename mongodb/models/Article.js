const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ArticleSchema = new Schema(
  {
    index: { type: Number },
    text: { type: String },
  },
  {
    collections: "articles",
  }
);

module.exports = mongoose.model("articles", ArticleSchema);
