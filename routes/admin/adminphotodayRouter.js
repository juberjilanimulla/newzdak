import { Router } from "express";
import photodaymodel from "../../model/photodaymodel.js";
import { successResponse, errorResponse } from "../../helper/serverResponse.js";
import adminuploadphotodayRouter from "./adminuploadphotodayRouter.js";
import {
  S3Client,
  DeleteObjectsCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const adminphotodayRouter = Router();

adminphotodayRouter.post("/", getallphotodayHandler);
adminphotodayRouter.post("/create", createphotodayHandler);
adminphotodayRouter.put("/update", updatephotodayHandler);
adminphotodayRouter.delete("/delete", deletephotodayHandler);
adminphotodayRouter.use("/upload-photo", adminuploadphotodayRouter);
adminphotodayRouter.delete("/singlephoto", deletesinglephotodayHandler);

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

async function deletesinglephotodayHandler(req, res) {
  try {
    const { _id, photourl } = req.body;
    if (!_id || !photourl) {
      return errorResponse(
        res,
        400,
        "Photo ID (_id) and photourl are required"
      );
    }

    // Find the photoday
    const photoday = await photodaymodel.findById(_id);

    if (!photoday) {
      return errorResponse(res, 404, "Photo not found");
    }

    // Extract S3 key from URL
    const parts = photourl.split(".amazonaws.com/");
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
    photoday.photo = (photoday.photo || []).filter((url) => url !== photourl);
    await photoday.save();

    return successResponse(res, "Image deleted successfully", photoday);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
