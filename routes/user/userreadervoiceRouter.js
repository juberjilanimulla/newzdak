import { Router } from "express";
import readervoicemodel from "../../model/readervoicemodel.js";
import { successResponse, errorResponse } from "../../helper/serverResponse.js";

const userreadervoiceRouter = Router();

userreadervoiceRouter.post("/create", createreadervoiceHandler);
userreadervoiceRouter.get("/", getreadervoiceHandler);

export default userreadervoiceRouter;

async function createreadervoiceHandler(req, res) {
  try {
    const { name, email, topic, message } = req.body;
    if (!name || !email || !topic || !message) {
      return errorResponse(res, 400, "some params are missing");
    }
    const params = { name, email, topic, message };
    const readervoice = await readervoicemodel.create(params);
    return successResponse(res, "success", readervoice);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function getreadervoiceHandler(req, res) {
  try {
    const readervoice = await readervoicemodel
      .find({ published: true })
      .sort({ createdAt: -1 });
    successResponse(res, "success", readervoice);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
