import { Router } from "express";
import { errorResponse, successResponse } from "../../helper/serverResponse.js";
import adminuploadadvertisementRouter from "./adminuploadphotodayRouter.js";
import advertisementmodel from "../../model/advertisementmodel.js";

const adminadvertisementRouter = Router();

adminadvertisementRouter.post("/", getalladvertisementHandler);
adminadvertisementRouter.post("/create", createadvertisementHandler);
adminadvertisementRouter.put("/update", updateadvertisementHandler);
adminadvertisementRouter.delete("/delete", deleteadvertisementHandler);
adminadvertisementRouter.use("/upload", adminuploadadvertisementRouter);

export default adminadvertisementRouter;

async function getalladvertisementHandler(req, res) {
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
    const advertise = await advertisementmodel
      .find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    const totalCount = await advertisementmodel.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    successResponse(res, "successfully", {
      advertise,
      totalPages,
    });
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function createadvertisementHandler(req, res) {
  try {
    const { companyname, adtype, size, position } = req.body;
    if (!companyname || !adtype || !size || !position) {
      return errorResponse(res, 400, "some params are missing");
    }
    const params = { companyname, adtype, size, position };
    const advertisement = await advertisementmodel.create(params);
    successResponse(res, "success", advertisement);
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
