import { Router } from "express";
import advertisementmodel from "../../model/advertisementmodel.js";
import { successResponse, errorResponse } from "../../helper/serverResponse.js";

const useradvertisementRouter = Router();

export default useradvertisementRouter;

useradvertisementRouter.get("/footer", getfooteradvertiseHandler);
useradvertisementRouter.get("/herosection", getherosectionadvertiseHandler);
useradvertisementRouter.get("/photosection", getphotosectionadvertiseHandler);

async function getfooteradvertiseHandler(req, res) {
  try {
    const advertise = await advertisementmodel.find({ adtype: "footer" });
    if (!advertise) {
      return errorResponse(res, 404, "some footer advertisement not found");
    }
    successResponse(res, "success", advertise);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function getherosectionadvertiseHandler(req, res) {
  try {
    const advertise = await advertisementmodel.find({ adtype: "herosection" });
    if (!advertise) {
      return errorResponse(
        res,
        404,
        "some hero-section advertisement not found"
      );
    }
    successResponse(res, "success", advertise);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function getphotosectionadvertiseHandler(req, res) {
  try {
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function getinsidehorizontalHandler(req, res) {
  try {
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function getinsideverticalHandler(req, res) {
  try {
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
