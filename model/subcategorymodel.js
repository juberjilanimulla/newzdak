import { mongoose, Schema, model } from "mongoose";

const subcategorySchema = new Schema(
  {
    name: { type: String }, // e.g. City News, Crime & Safety
    slug: { type: String }, // seo-friendly url: city-news
    description: { type: String, default: "" }, // small text about subcategory
    categoryid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category", // linked to category model
    },
  },
  { timestamps: true, versionKey: false }
);

function currentLocalTimePlusOffset() {
  const offset = 5.5 * 60 * 60 * 1000;
  const now = new Date();
  return new Date(now.getTime() + offset);
}

subcategorySchema.pre("save", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.createdAt = currentTime;
  this.updatedAt = currentTime;
  next();
});

subcategorySchema.pre("findOneAndUpdate", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.set({ updatedAt: currentTime });
  next();
});

const subcategorymodel = model("subcategory", subcategorySchema);
export default subcategorymodel;
