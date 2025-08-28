import { Router } from "express";
import { successResponse, errorResponse } from "../../helper/serverResponse.js";
import contactusmodel from "../../model/contactusmodel.js";

const admincontactusRouter = Router();

export default admincontactusRouter;

async function getallcontactusHandler(req, res) {
  try {
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
