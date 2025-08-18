import { Router } from "express";
import { errorResponse, successResponse } from "../../helper/serverResponse.js";
import articlemodel from "../../model/articlemodel.js";
import adminuploadarticleRouter from "./adminuploadarticleRouter.js";
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

const adminarticleRouter = Router();

adminarticleRouter.post("/", getallartilesHandler);
adminarticleRouter.post("/create", createarticleHandler);
adminarticleRouter.put("/update", updatearticleHandler);
adminarticleRouter.delete("/delete", deletearticleHandler);
adminarticleRouter.use("/upload", adminuploadarticleRouter);
adminarticleRouter.delete("/singleimage", deletesinglearticleHandler);

export default adminarticleRouter;

async function getallartilesHandler(req, res) {
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
        { metadescription: { $regex: searchRegex } },
        { keywords: { $regex: searchRegex } },
        { content: { $regex: searchRegex } },
        { category: { $regex: searchRegex } },
        { metatitle: { $regex: searchRegex } },
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

    // Fetch paginated article
    const article = await articlemodel
      .find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    const totalCount = await articlemodel.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    successResponse(res, "successfully", {
      article,
      totalPages,
    });
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function createarticleHandler(req, res) {
  try {
    const {
      title,
      metatitle,
      metadescription,
      content,
      city,
      keywords,
      categoryname,
      authorid,
    } = req.body;
    if (
      !title ||
      !metatitle ||
      !metadescription ||
      !content ||
      !city ||
      !keywords ||
      !categoryname ||
      !authorid
    ) {
      return errorResponse(res, 400, "some params are missing");
    }
    const params = {
      title,
      metatitle,
      metadescription,
      content,
      city,
      keywords,
      categoryname,
      authorid,
    };
    const articles = await articlemodel.create(params);
    await articles.populate({
      path: "authorid",
      select: "firstname lastname designation _id",
    });
    successResponse(res, "successfully added", articles);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function updatearticleHandler(req, res) {
  try {
    const { _id, ...updatedData } = req.body;
    if (!_id) {
      return errorResponse(res, 400, "Blog ID (_id) is required");
    }

    const existingarticle = await articlemodel.findById(_id);
    if (!existingarticle) {
      return errorResponse(res, 404, "article is not exist");
    }

    const options = { new: true };
    if (
      !updatedData.title ||
      !updatedData.metatitle ||
      !updatedData.categoryname ||
      !updatedData.metadescription ||
      !updatedData.keywords ||
      !updatedData.content ||
      !updatedData.city ||
      !updatedData.authorid
    ) {
      errorResponse(res, 404, "Some params are missing");
      return;
    }
    const article = await articlemodel.findByIdAndUpdate(
      _id,
      updatedData,
      options
    );
    await article.populate({
      path: "authorid",
      select: "firstname lastname designation _id",
    });
    successResponse(res, "successfully updated", article);
  } catch (error) {
    consolelog("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function deletearticleHandler(req, res) {
  try {
    const { _id } = req.body;
    if (!_id) {
      return errorResponse(res, 400, "Article ID (_id) is required");
    }

    // Find the article
    const article = await articlemodel.findById(_id);
    if (!article) {
      return errorResponse(res, 404, "Article not found");
    }

    // Extract S3 keys from image array
    const s3Keys = (article.image || [])
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
    await articlemodel.findByIdAndDelete(_id);

    return successResponse(
      res,
      "Article and associated images deleted successfully"
    );
  } catch (error) {
    console.error("Delete failed:", error);
    return errorResponse(res, 500, "Internal server error");
  }
}

async function deletesinglearticleHandler(req, res) {
  try {
    const { _id, imageurl } = req.body;
    if (!_id || !imageurl) {
      return errorResponse(
        res,
        400,
        "Article ID (_id) and imageUrl are required"
      );
    }

    // Find the article
    const article = await articlemodel.findById(_id);
  
    if (!article) {
      return errorResponse(res, 404, "Article not found");
    }

    // Extract S3 key from URL
    const parts = imageurl.split(".amazonaws.com/");
    if (parts.length < 2) {
      return errorResponse(res, 400, "Invalid image URL");
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
    article.image = (article.image || []).filter((url) => url !== imageurl);
    await article.save();

    return successResponse(res, "Image deleted successfully", article);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
