import { mongoose, Schema, model } from "mongoose";

const articleSchema = new Schema(
  {
    title: { type: String },
    metatitle: { type: String },
    image: { type: String, default: "" }, // cover image URL
    video: { type: String, default: "" }, // optional multiple images
    metadescription: String, // short excerpt for cards
    content: [
      {
        title: String,
        description: String,
      },
    ], // HTML/Markdown
    keywords: [{ type: String, default: "" }], // tags/SEO keywords
    categoryid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
    },
    subcategoryid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "subcategory",
      default: null,
    },
    authorid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "author",
    },
    featured: { type: Boolean, default: false },
    videofeatured: { type: Boolean, default: false },
    breaking: { type: Boolean, default: false },
    editorspicks: { type: Boolean, default: false },
    published: { type: Boolean, default: false },
    tags: String,
  },
  { timestamps: true, versionKey: false }
);

function currentLocalTimePlusOffset() {
  const offset = 5.5 * 60 * 60 * 1000;
  const now = new Date();
  return new Date(now.getTime() + offset);
}

articleSchema.pre("save", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.createdAt = currentTime;
  this.updatedAt = currentTime;
  next();
});

articleSchema.pre("findOneAndUpdate", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.set({ updatedAt: currentTime });
  next();
});

const articlemodel = model("article", articleSchema);
export default articlemodel;
