import { Router } from "express";
import { errorResponse } from "../../helper/serverResponse";

const articlesadminRouter = Router();

articlesadminRouter.post("/", getallartilesHandler);
articlesadminRouter.post("/create", createarticleHandler);
articlesadminRouter.put("/update", updatearticleHandler);
articlesadminRouter.delete("/delete", deletearticleHandler);

export default articlesadminRouter;

async function getallartilesHandler(req, res) {
  try {
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function createarticleHandler(req, res) {
  try {
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function updatearticleHandler(req, res) {
  try {
  } catch (error) {
    consolelog("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function deletearticleHandler(req, res) {
  try {
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
