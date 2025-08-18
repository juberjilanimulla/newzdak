import { Router } from "express";
import { errorResponse, successResponse } from "../../helper/serverResponse.js";
import articlemodel from "../../model/articlemodel.js";
import adminuploadarticleRouter from "./adminuploadarticleRouter.js";

const adminarticleRouter = Router();

adminarticleRouter.post("/", getallartilesHandler);
adminarticleRouter.post("/create", createarticleHandler);
adminarticleRouter.put("/update", updatearticleHandler);
adminarticleRouter.delete("/delete", deletearticleHandler);
adminarticleRouter.use("/upload", adminuploadarticleRouter);

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
      return errorResponse(res, 400, "article ID (_id) is required");
    }

    // Find property before deletion (to access images)
    const article = await articlemodel.findById(_id);
    if (!article) {
      return errorResponse(res, 404, "article not found");
    }

    // Delete all images from S3
    const s3Key = article.image?.split(".amazonaws.com/")[1];

    if (s3Key) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: s3Key,
        })
      );
    }

    // Delete blog from DB
    await articlemodel.findByIdAndDelete(_id);

    return successResponse(res, "article and associated images deleted");
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

