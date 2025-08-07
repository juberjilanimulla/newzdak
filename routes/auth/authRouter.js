import { Router } from "express";
import { errorResponse, successResponse } from "../../helper/serverResponse.js";
import usermodel from "../../model/usermodel.js";
import {
  comparePassword,
  generateAccessToken,
} from "../../helper/helperFunction.js";

const authRouter = Router();

authRouter.post("/signin", signinHandler);

export default authRouter;

async function signinHandler(req, res) {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const users = await usermodel.findOne({ email });

    if (!users) {
      return errorResponse(res, 404, "email not found");
    }
    const comparepassword = comparePassword(password, users.password);

    if (!comparepassword) {
      return errorResponse(res, 404, "invalid password");
    }

    const userid = users._id.toString();

    const { encoded_token, public_token } = generateAccessToken(
      userid,
      users.email,
      users.role
    );

    successResponse(res, "SignIn successfully", {
      encoded_token,
      public_token,
    });
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
