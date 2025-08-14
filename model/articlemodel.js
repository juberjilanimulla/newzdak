import { Schema, model } from "mongoose";

const articleSchema = new Schema(
  {
    title: { type: String },
    slug: { type: String },
    heroimage: String, // cover image URL
    gallery: [String], // optional multiple images
    summary: String, // short excerpt for cards
    content: String, // HTML/Markdown
    metatitle: String,
    metadescription: String,
    keywords: [String], // tags/SEO keywords
    categoryid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
    },
    city: String, // e.g., "Hyderabad"
    authorid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "author",
    },
    featured: { type: Boolean, default: false },
    breaking: { type: Boolean, default: false },
    status: {
      type: String,
    },
    scheduledAt: Date,
    publishedAt: { type: Date, index: true },
    readTimeMin: Number,
    views: { type: Number },
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
