import { Router } from "express";
import { successResponse, errorResponse } from "../../helper/serverResponse.js";
import contactusmodel from "../../model/contactusmodel.js";

const usercontactusRouter = Router();

usercontactusRouter.post("/create", createcontactusHandler);

export default usercontactusRouter;

async function createcontactusHandler(req, res) {
  try {
    const { name, email, mobile, message } = req.body;
    if (!name || !email || !mobile || !message) {
      return errorResponse(res, 400, "some params are missing");
    }
    const params = { name, email, mobile, message };
    const contact = await contactusmodel.create(params);
    successResponse(res, "success", contact);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
