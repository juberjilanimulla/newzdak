import { Router } from "express";
import advertisementmodel from "../../model/advertisementmodel.js";
import { successResponse, errorResponse } from "../../helper/serverResponse.js";

const useradvertisementRouter = Router();

export default useradvertisementRouter;

useradvertisementRouter.get("/footer", getfooteradvertiseHandler);

async function getfooteradvertiseHandler(req, res) {
  try {
    const advertise = await advertisementmodel.find({ adtype: "footer" });
    successResponse(res, "success", advertise);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
