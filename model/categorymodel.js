import { Schema, model } from "mongoose";

const categorySchema = new Schema(
  {
    categoryname: { type: String },
    slug: { type: String },
    description: String,
    order: { type: Number },
  },
  { timestamps: true, versionKey: false }
);

function currentLocalTimePlusOffset() {
  const offset = 5.5 * 60 * 60 * 1000;
  const now = new Date();
  return new Date(now.getTime() + offset);
}

categorySchema.pre("save", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.createdAt = currentTime;
  this.updatedAt = currentTime;
  next();
});

categorySchema.pre("findOneAndUpdate", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.set({ updatedAt: currentTime });
  next();
});

const categorymodel = model("category", categorySchema);
export default categorymodel;
