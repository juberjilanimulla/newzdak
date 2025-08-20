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
    const { _id, ...updatedData } = req.body;
    if (!_id) {
      return errorResponse(res, 404, "advertisement _id is required");
    }
    const options = { new: true };
    if (
      !updatedData.companyname ||
      !updatedData.adtype ||
      !updatedData.size ||
      !updatedData.position
    ) {
      return errorResponse(res, 400, "some params are missing");
    }
    const advertise = await advertisementmodel.findByIdAndUpdate(
      _id,
      updatedData,
      options
    );
    successResponse(res, "successResponse updated", advertise);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function deleteadvertisementHandler(req, res) {
  try {
    const { _id } = req.body;
    if (!_id) {
      return errorResponse(res, 400, "photo ID (_id) is required");
    }

    // Find the article
    const photoday = await photodaymodel.findById(_id);
    if (!photoday) {
      return errorResponse(res, 404, "photoday not found");
    }

    // Extract S3 keys from image array
    const s3Keys = (photoday.photo || [])
      .filter(
        (url) => typeof url === "string" && url.includes(".amazonaws.com/")
      )
      .map((url) => url.split(".amazonaws.com/")[1]);

    // Delete from S3 if keys exist
    if (s3Keys.length > 0) {
      await s3.send(
        new DeleteObjectsCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Delete: {
            Objects: s3Keys.map((key) => ({ Key: key })),
          },
        })
      );
    }

    // Finally delete the article from DB
    await photodaymodel.findByIdAndDelete(_id);

    return successResponse(
      res,
      "PhotoofDay and associated photo deleted successfully"
    );
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
