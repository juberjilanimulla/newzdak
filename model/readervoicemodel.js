import { model, Mongoose, Schema } from "mongoose";

const readervoiceSchema = new Schema(
  {
    name: String,
    email: String,
    topic: String,
    message: String,
    published: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

function currentLocalTimePlusOffset() {
  const offset = 5.5 * 60 * 60 * 1000;
  const now = new Date();
  return new Date(now.getTime() + offset);
}

readervoiceSchema.pre("save", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.createdAt = currentTime;
  this.updatedAt = currentTime;
  next();
});

readervoiceSchema.pre("findOneAndUpdate", function (next) {
  const currentTime = currentLocalTimePlusOffset();
  this.set({ updatedAt: currentTime });
  next();
});

const readervoicemodel = model("readervoice", readervoiceSchema);
export default readervoicemodel;
