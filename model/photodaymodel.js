import { monogoose, Schema, model } from "mongoose";

const photodaySchema = new Schema(
  {
    photo: {
      type: String,
      default: "",
    },
    title: String,
    description: String,
  },
  { timestamps: true, versionKey: false }
);

function currentLocalTimePlusOffset() {
  const offset = 5.5 * 60 * 60 * 1000;
  const now = new Date();
  return new Date(now.getTime() + offset);
}

photodaySchema.pre("save", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.createdAt = currentTime;
  this.updatedAt = currentTime;
  next();
});

photodaySchema.pre("findOneAndUpdate", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.set({ updatedAt: currentTime });
  next();
});

const photodaymodel = model("photoday", photodaySchema);
export default photodaymodel;
