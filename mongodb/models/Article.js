const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ArticleSchema = new Schema(
  {
    title: { type: String },
    abstract: { type: String, default: "" },
    content: { type: String },
    createTime: { type: Date },
    lastEditTime: { type: Date, default: Date.now() },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "tags",
      },
    ],
    isPublished: { type: Boolean, default: false },
  },
  { collection: "articles" }
);

module.exports = mongoose.model("articles", ArticleSchema);
