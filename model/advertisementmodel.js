import { Schema, model } from "mongoose";

const advertisementSchema = new Schema(
  {
    companyname: String,
    adtype: {
      type: String,
      // enum: ["banner", "sidebar", "footer", "article"],
      default: "",
    },
    image: { type: String, default: "" },
    size: {
      type: String,
      // enum: ["small", "medium", "large"],
      default: "",
    },
    position: { type: String }, // e.g., "homepage-top", "article-right", etc.
    isactive: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

function currentLocalTimePlusOffset() {
  const offset = 5.5 * 60 * 60 * 1000;
  const now = new Date();
  return new Date(now.getTime() + offset);
}

advertisementSchema.pre("save", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.createdAt = currentTime;
  this.updatedAt = currentTime;
  next();
});

advertisementSchema.pre("findOneAndUpdate", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.set({ updatedAt: currentTime });
  next();
});

const advertisementmodel = model("advertisement", advertisementSchema);
export default advertisementmodel;
