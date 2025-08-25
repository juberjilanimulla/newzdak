import { mongoose, Schema, model } from "mongoose";

const subcategorySchema = new Schema(
  {
    subcategoryname: { type: String }, // e.g. City News, Crime & Safety
    description: { type: String }, // small text about subcategory
    slug: { type: String, default: "" },
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
