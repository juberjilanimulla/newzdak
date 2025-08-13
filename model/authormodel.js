import { Schema, model } from "mongoose";

const authorSchema = new Schema(
  {
    firstname: String,
    lastname: String,
    email: String,
    mobile: String,
    designation: String,
  },
  { versionKey: false, timestamps: true }
);

function currentLocalTimePlusOffset() {
  const offset = 5.5 * 60 * 60 * 1000;
  const now = new Date();
  return new Date(now.getTime() + offset);
}

authorSchema.pre("save", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.createdAt = currentTime;
  this.updatedAt = currentTime;
  next();
});

authorSchema.pre("findOneAndUpdate", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.set({ updatedAt: currentTime });
  next();
});

const authormodel = model("author", authorSchema);
export default authormodel;
