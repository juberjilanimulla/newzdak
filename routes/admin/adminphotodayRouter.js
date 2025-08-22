import { Router } from "express";
import photodaymodel from "../../model/photodaymodel.js";
import { successResponse, errorResponse } from "../../helper/serverResponse.js";
import adminuploadphotodayRouter from "./adminuploadphotodayRouter.js";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

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
adminphotodayRouter.delete("/delete/singlephoto", deletesinglephotodayHandler);
adminphotodayRouter.post("/published", ispublishedphotoofdayHandler);

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
    const photoday = await photodaymodel.findById(_id);

    if (!photoday) {
      return errorResponse(res, 404, "Photo not found");
    }

    let s3Key = null;
    if (
      typeof photoday.photo === "string" &&
      photoday.photo.includes(".amazonaws.com/")
    ) {
      s3Key = photoday.photo.split(".amazonaws.com/")[1];
    }

    // Delete from S3 if key exists
    if (s3Key) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: s3Key,
        })
      );
    }

    // Finally delete the photoday from DB
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

    if (photoday.photo === photourl) {
      photoday.photo = ""; // or null if you prefer
      await photoday.save();
    }

    return successResponse(res, "Image deleted successfully", photoday);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function ispublishedphotoofdayHandler(req, res) {
  try {
    const { published, photoid } = req.body;

    if (!photoid) {
      return errorResponse(res, 400, "photo ID is missing in URL params");
    }

    const existingPhoto = await photodaymodel.findById({ _id: photoid });
    if (!existingPhoto) {
      return errorResponse(res, 404, "Photo not found");
    }

    if (typeof published !== "boolean") {
      return errorResponse(
        res,
        400,
        "published must be a boolean (true/false)"
      );
    }

    const updatedPhoto = await photodaymodel.findByIdAndUpdate(
      photoid,
      { published },
      { new: true }
    );
    if (!updatedPhoto) {
      return errorResponse(res, 404, "Photo not found");
    }

    return successResponse(
      res,
      `Photoofday published status set to ${published}`,
      updatedPhoto
    );
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
