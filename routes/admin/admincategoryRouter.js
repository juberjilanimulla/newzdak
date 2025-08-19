import { Router } from "express";
import { errorResponse, successResponse } from "../../helper/serverResponse.js";
import categorymodel from "../../model/categorymodel.js";

const admincategoryRouter = Router();

admincategoryRouter.get("/", getallcategoryHandler);
admincategoryRouter.post("/create", createcategoryHandler);
admincategoryRouter.put("/update", updatecategoryHandler);
admincategoryRouter.delete("/delete", deletecategoryHandler);

export default admincategoryRouter;

async function getallcategoryHandler(req, res) {
  try {
    const category = await categorymodel.find({});
    successResponse(res, "success", category);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function createcategoryHandler(req, res) {
  try {
    const { categoryname, description } = req.body;
    if (!categoryname || !description) {
      return errorResponse(res, 400, "some params are missing");
    }
    const existingcategory = await categorymodel.findOne({ categoryname });
    if (existingcategory) {
      return errorResponse(res, 404, "Already category is exist");
    }
    const params = { categoryname, description };
    const category = await categorymodel.create(params);
    successResponse(res, "succcess", category);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function updatecategoryHandler(req, res) {
  try {
    const { _id, ...updatedData } = req.body;
    if (!_id) {
      return errorResponse(res, 404, "category_id is required");
    }
    const options = { new: true };

    if (!updatedData.categoryname || !updatedData.description) {
      return errorResponse(res, 400, "some params are missing");
    }
    const category = await categorymodel.findByIdAndUpdate(
      _id,
      updatedData,
      options
    );
    successResponse(res, "successResponse updated", category);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function deletecategoryHandler(req, res) {
  try {
    const { _id } = req.body;
    if (!_id) {
      return errorResponse(res, 400, "category _id is required");
    }
    const category = await categorymodel.findById(_id);
    if (!category) {
      return errorResponse(res, 404, "category not found");
    }
    const deleted = await categorymodel.findByIdAndDelete({ _id: _id });
    successResponse(res, "successfully deleted ");
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
