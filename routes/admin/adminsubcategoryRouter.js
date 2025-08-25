import { Router } from "express";
import { errorResponse, successResponse } from "../../helper/serverResponse.js";
import subcategorymodel from "../../model/subcategorymodel.js";

const adminsubcategoryRouter = Router();

adminsubcategoryRouter.get("/", getallsubcategoryHandler);
adminsubcategoryRouter.post("/create", createsubcategoryHandler);
adminsubcategoryRouter.put("/update", updatesubcategoryHandler);
adminsubcategoryRouter.delete("/delete", deletesubcategoryHandler);

export default adminsubcategoryRouter;

// Get all subcategories
async function getallsubcategoryHandler(req, res) {
  try {
    const subcategories = await subcategorymodel
      .find({})
      .populate("categoryid", "categoryname")
      .sort({ createdAt: -1 }); // show category info
    successResponse(res, "success", subcategories);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

// Create subcategory
async function createsubcategoryHandler(req, res) {
  try {
    const { subcategoryname, categoryid, slug } = req.body;
    if (!subcategoryname || !categoryid || !slug) {
      return errorResponse(res, 400, "some params are missing");
    }

    const exists = await subcategorymodel.findOne({
      subcategoryname,
      categoryid,
    });
    if (exists) {
      return errorResponse(
        res,
        404,
        "Subcategory already exists in this category"
      );
    }

    const params = { subcategoryname, categoryid, slug };
    const subcategory = await subcategorymodel.create(params);

    successResponse(res, "subcategory created successfully", subcategory);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

// Update subcategory
async function updatesubcategoryHandler(req, res) {
  try {
    const { _id, ...updatedData } = req.body;
    if (!_id) {
      return errorResponse(res, 404, "subcategory_id is required");
    }

    if (
      !updatedData.subcategoryname ||
      !updatedData.categoryid ||
      !updatedData.slug
    ) {
      return errorResponse(res, 400, "some params are missing");
    }
    const subcategoryid = await subcategorymodel.findById({ _id: _id });
    if (!subcategoryid) {
      return errorResponse(res, 404, "subcategory id not found");
    }
    const options = { new: true };
    const subcategory = await subcategorymodel.findByIdAndUpdate(
      _id,
      updatedData,
      options
    );

    successResponse(res, "subcategory updated successfully", subcategory);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

// Delete subcategory
async function deletesubcategoryHandler(req, res) {
  try {
    const { _id } = req.body;
    if (!_id) {
      return errorResponse(res, 400, "subcategory _id is required");
    }

    const subcategory = await subcategorymodel.findById(_id);
    if (!subcategory) {
      return errorResponse(res, 404, "subcategory not found");
    }

    await subcategorymodel.findByIdAndDelete({ _id });
    successResponse(res, "subcategory deleted successfully");
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
