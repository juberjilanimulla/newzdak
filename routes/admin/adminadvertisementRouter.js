import { Router } from "express";
import { errorResponse, successResponse } from "../../helper/serverResponse.js";
import advertisementmodel from "../../model/advertisementmodel.js";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import adminuploadadvertisementRouter from "./adminuploadadvertisementRouter.js";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const adminadvertisementRouter = Router();

adminadvertisementRouter.post("/", getalladvertisementHandler);
adminadvertisementRouter.post("/create", createadvertisementHandler);
adminadvertisementRouter.put("/update", updateadvertisementHandler);
adminadvertisementRouter.delete("/delete", deleteadvertisementHandler);
adminadvertisementRouter.delete(
  "/singledelete",
  singledeleteadvertisementHandler
);
adminadvertisementRouter.post("/isactive", isactiveadvertisementHandler);
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
      return errorResponse(res, 400, "advertise ID (_id) is required");
    }

    // Find the advertisement
    const advertise = await advertisementmodel.findById(_id);
    if (!advertise) {
      return errorResponse(res, 404, "advertisement not found");
    }

    let s3Key = null;
    if (advertise.imageurl && advertise.imageurl.includes(".amazonaws.com/")) {
      s3Key = advertise.imageurl.split(".amazonaws.com/")[1];
    }

    // Delete image from S3
    if (s3Key) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: s3Key,
        })
      );
    }

    // Delete advertisement from DB
    await advertisementmodel.findByIdAndDelete(_id);

    return successResponse(res, "advertise and image deleted successfully");
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function singledeleteadvertisementHandler(req, res) {
  try {
    const { _id, imageurl } = req.body;
    if (!_id || !imageurl) {
      return errorResponse(
        res,
        400,
        "advertisement ID (_id) and imageurl are required"
      );
    }

    // Find the advertisement
    const advertise = await advertisementmodel.findById(_id);

    if (!advertise) {
      return errorResponse(res, 404, "advertise not found");
    }

    // Extract S3 key from URL
    const parts = imageurl.split(".amazonaws.com/");
    if (parts.length < 2) {
      return errorResponse(res, 400, "Invalid photo URL");
    }
    const s3Key = parts[1];

    // Delete from S3
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key,
      })
    );

    // Remove image from DB array
    if (advertise.image === imageurl) {
      advertise.image = ""; // or null if you prefer
      await advertise.save();
    }

    return successResponse(res, "Image deleted successfully", advertise);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function isactiveadvertisementHandler(req, res) {
  try {
    const { advertiseid, isactive } = req.body;
    if (!advertiseid) {
      return errorResponse(res, 400, "some params are missing");
    }
    const advertise = await advertisementmodel.findById({ _id: advertiseid });
    if (!advertise) {
      return errorResponse(res, 404, "advertise not found");
    }

    if (typeof isactive !== "boolean") {
      return errorResponse(res, 400, "isactive must be a boolean (true/false)");
    }

    const updateadvertise = await advertisementmodel.findByIdAndUpdate(
      advertiseid,
      { isactive },
      { new: true }
    );
    if (!updateadvertise) {
      return errorResponse(res, 404, "advertise not found");
    }

    return successResponse(
      res,
      `Photoofday published status set to ${isactive}`,
      updateadvertise
    );
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
