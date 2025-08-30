import { Router } from "express";
import { errorResponse, successResponse } from "../../helper/serverResponse.js";
import privacypolicymodel from "../../model/privacypolicymodel.js";

const userprivacypolicyRouter = Router();

userprivacypolicyRouter.get("/", getprivacypolicyHandler);

export default userprivacypolicyRouter;

async function getprivacypolicyHandler(req, res) {
  try {
    const privacypolicy = await privacypolicymodel.find({});
    successResponse(res, "success", privacypolicy);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
