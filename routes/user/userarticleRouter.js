import { Router } from "express";
import articlemodel from "../../model/articlemodel.js";
import { successResponse, errorResponse } from "../../helper/serverResponse.js";

const userarticleRouter = Router();

userarticleRouter.post("/getall", getallarticlesHandler);

export default userarticleRouter;

async function getallarticlesHandler(req, res) {
  try {
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
