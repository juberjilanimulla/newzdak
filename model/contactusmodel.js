import { Schema, model } from "mongoose";

const contactusSchema = new Schema(
  {
    name: String,
    email: String,
    mobile: String,
    message: String,
  },
  { timestamps: true, versionKey: false }
);

function currentLocalTimePlusOffset() {
  const now = new Date();
  const offset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + offset);
}

contactusSchema.pre("save", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.createdAt = currentTime;
  this.updatedAt = currentTime;
  next();
});

const contactusmodel = model("contactus", contactusSchema);
export default contactusmodel;
