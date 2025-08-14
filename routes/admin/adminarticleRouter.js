import { Router } from "express";
import { errorResponse, successResponse } from "../../helper/serverResponse";
import articlemodel from "../../model/articlemodel";

const adminarticleRouter = Router();

adminarticleRouter.post("/", getallartilesHandler);
adminarticleRouter.post("/create", createarticleHandler);
adminarticleRouter.put("/update", updatearticleHandler);
adminarticleRouter.delete("/delete", deletearticleHandler);

export default adminarticleRouter;

async function getallartilesHandler(req, res) {
  try {
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function createarticleHandler(req, res) {
  try {
    const {
      title,
      metatitle,
      metadescription,
      content,
      city,
      keywords,
      categoryname,
      authorid,
    } = req.body;
    if (
      !title ||
      !metatitle ||
      !metadescription ||
      !content ||
      !city ||
      !keywords ||
      !categoryname ||
      !authorid
    ) {
      return errorResponse(res, 400, "some params are missing");
    }
    const params = {
      title,
      metatitle,
      metadescription,
      content,
      city,
      keywords,
      categoryname,
      authorid,
    };
    const articles = await articlemodel.create(params);
    successResponse(res, "successfully added", articles);
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
