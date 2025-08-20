import { Router } from "express";
import { errorResponse } from "../../helper/serverResponse";

const adminadvertisementRouter = Router();

adminadvertisementRouter.post("/", getalladvertisementHandler);
adminadvertisementRouter.post("/", createadvertisementHandler);
adminadvertisementRouter.post("/", updateadvertisementHandler);
adminadvertisementRouter.post("/", deleteadvertisementHandler);

export default adminadvertisementRouter;

async function getalladvertisementHandler(req, res) {
  try {
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function createadvertisementHandler(req, res) {
  try {
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function updateadvertisementHandler(req, res) {
  try {
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function deleteadvertisementHandler(req, res) {
  try {
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
