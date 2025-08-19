import { Router } from "express";
import photodaymodel from "../../model/photodaymodel.js";
import { successResponse, errorResponse } from "../../helper/serverResponse.js";
import adminuploadphotodayRouter from "./adminuploadphotodayRouter.js";

const adminphotodayRouter = Router();

adminphotodayRouter.post("/", getallphotodayHandler);
adminphotodayRouter.post("/create", createphotodayHandler);
adminphotodayRouter.put("/update", updatephotodayHandler);
adminphotodayRouter.delete("/delete", deletephotodayHandler);
adminphotodayRouter.use("/upload-photo", adminuploadphotodayRouter);

export default adminphotodayRouter;

async function getallphotodayHandler(req, res) {
  try {
    const { pageno = 0, filterBy = {}, sortby = {}, search = "" } = req.body;
    const limit = 10;
    const skip = pageno * limit;

    let query = {};

    // Apply search
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
      ];
    }

    // Apply filters
    if (filterBy && Object.keys(filterBy).length > 0) {
      query = {
        ...query,
        ...filterBy,
      };
    }

    // Sorting logic
    const sortBy =
      Object.keys(sortby).length !== 0
        ? Object.keys(sortby).reduce((acc, key) => {
            acc[key] = sortby[key] === "asc" ? 1 : -1;
            return acc;
          }, {})
        : { createdAt: -1 };

    // Fetch paginated blogs
    const photoday = await photodaymodel
      .find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    const totalCount = await photodaymodel.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    successResponse(res, "successfully", {
      photoday,
      totalPages,
    });
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function createphotodayHandler(req, res) {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return errorResponse(res, 400, "some params are missing");
    }
    const params = { title, description };
    const photoday = await photodaymodel.create(params);
    successResponse(res, "success", photoday);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function updatephotodayHandler(req, res) {
  try {
    const { _id, ...updatedData } = req.body;
    if (!_id) {
      return errorResponse(res, 404, "photoday _id is required");
    }
    const options = { new: true };
    if (!updatedData.title || !updatedData.description) {
      return errorResponse(res, 400, "some params are missing");
    }
    const photoday = await photodaymodel.findByIdAndUpdate(
      _id,
      updatedData,
      options
    );
    successResponse(res, "successResponse updated", photoday);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function deletephotodayHandler(req, res) {
  try {
    const { _id } = req.body;
    if (!_id) {
      return errorResponse(res, 400, "photoday _id is required");
    }
    const photoday = await photodaymodel.findById(_id);
    if (!photoday) {
      return errorResponse(res, 404, "photoday not found");
    }
    const deleted = await photodaymodel.findByIdAndDelete({ _id: _id });
    successResponse(res, "successfully deleted ");
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
