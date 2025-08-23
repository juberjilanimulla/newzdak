import { Router } from "express";
import readervoicemodel from "../../model/radervoicemodel.js";
import { successResponse, errorResponse } from "../../helper/serverResponse.js";

const userreadervoiceRouter = Router();

userreadervoiceRouter.post("/create", createreadervoiceHandler);

export default userreadervoiceRouter;

async function createreadervoiceHandler(req, res) {
  try {
    const { name, email, title, message } = req.body;
    if (!name || !email || !title || !message) {
      return errorResponse(res, 400, "some params are missing");
    }
    const params = { name, email, title, message };
    const readervoice = await readervoicemodel.create(params);
    return successResponse(res, "success", readervoice);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
