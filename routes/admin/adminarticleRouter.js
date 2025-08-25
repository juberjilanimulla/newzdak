import { Router } from "express";
import { errorResponse, successResponse } from "../../helper/serverResponse.js";
import articlemodel from "../../model/articlemodel.js";
import adminuploadarticleRouter from "./adminuploadarticleRouter.js";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

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
adminarticleRouter.post("/editorspicks", editorspicksarticleHandler);
adminarticleRouter.post("/breaking", breakingarticleHandler);
adminarticleRouter.post("/featured", featuredarticleHandler);
adminarticleRouter.post("/published", publishedarticleHandler);
adminarticleRouter.post("/videofeatured", videofeaturedHandler);
adminarticleRouter.post("/breakingvideo", breadkingvideoHandler);
adminarticleRouter.get("/singlearticle/:id", singlearticleHandler);

export default adminarticleRouter;

async function getallartilesHandler(req, res) {
  try {
    const {
      pageno = 0,
      filterBy = {},
      sortby = {},
      search = "",
      categoryid = "",
      subcategoryid = "",
      authorid = "",
    } = req.body;
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
        { category: { $regex: searchRegex } },
        { metatitle: { $regex: searchRegex } },
        { tags: { $regex: searchRegex } },
      ];
    }

    if (categoryid) {
      query.categoryid = categoryid;
    }

    // Apply subcategory filter if provided
    if (subcategoryid) {
      query.subcategoryid = subcategoryid;
    }

    // Apply author filter if provided
    if (authorid) {
      query.authorid = authorid;
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
      .populate("authorid", "firstname lastname designation _id")
      .populate("categoryid", "categoryname  _id")
      .populate("subcategoryid", "subcategoryname  _id")
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
      keywords,
      categoryid,
      subcategoryid,
      authorid,
      tags,
      video,
    } = req.body;
    if (
      !title ||
      !metatitle ||
      !metadescription ||
      !content ||
      !keywords ||
      !categoryid ||
      !authorid ||
      !tags
    ) {
      return errorResponse(res, 400, "some params are missing");
    }
    const params = {
      title,
      metatitle,
      metadescription,
      content,
      keywords,
      categoryid,
      subcategoryid: subcategoryid || null,
      authorid,
      tags,
      video,
    };
    const articles = await articlemodel.create(params);
    await articles.populate("authorid", "firstname lastname designation _id");
    await articles.populate("categoryid", "categoryname description _id");
    (await articles.populate(
      "subcategoryid",
      "subcategoryname description _id"
    )) || " ";

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
      !updatedData.categoryid ||
      !updatedData.subcategoryid ||
      !updatedData.metadescription ||
      !updatedData.keywords ||
      !updatedData.content ||
      !updatedData.authorid ||
      !updatedData.tags
    ) {
      errorResponse(res, 404, "Some params are missing");
      return;
    }
    const article = await articlemodel.findByIdAndUpdate(
      _id,
      updatedData,
      options
    );
    await article.populate("authorid", "firstname lastname designation _id");
    await article.populate("categoryid", "name description _id");
    await article.populate("subcategoryid", "name description _id");

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
    const article = await articlemodel.findById(_id);

    if (!article) {
      return errorResponse(res, 404, "article not found");
    }

    let s3Key = null;
    if (
      typeof article.image === "string" &&
      article.image.includes(".amazonaws.com/")
    ) {
      s3Key = article.image.split(".amazonaws.com/")[1];
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
    await articlemodel.findByIdAndDelete(_id);

    return successResponse(
      res,
      "PhotoofDay and associated photo deleted successfully"
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
        "Article ID (_id) and imageurl are required"
      );
    }

    const article = await articlemodel.findById(_id);

    if (!article) {
      return errorResponse(res, 404, "article not found");
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

    if (article.image === imageurl) {
      article.image = ""; // or null if you prefer
      await article.save();
    }

    return successResponse(res, "Image deleted successfully", article);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function editorspicksarticleHandler(req, res) {
  try {
    const { editorspicks, articleid } = req.body;

    if (!articleid) {
      return errorResponse(res, 400, "article ID is missing in URL params");
    }

    const existingArticle = await articlemodel.findById({ _id: articleid });
    if (!existingArticle) {
      return errorResponse(res, 404, "Article not found");
    }

    if (typeof editorspicks !== "boolean") {
      return errorResponse(
        res,
        400,
        "editorspicks must be a boolean (true/false)"
      );
    }

    if (editorspicks === true) {
      // Count how many articles are already marked as editorspicks
      const pickedArticles = await articlemodel
        .find({ editorspicks: true })
        .sort({ updatedAt: 1 }); // oldest first

      if ((pickedArticles.length = 3)) {
        // Unset the oldest one
        const oldest = pickedArticles[0];
        await articlemodel.findByIdAndUpdate(oldest._id, {
          $set: { editorspicks: false },
        });
      }
    }

    // Update the requested article
    const updatedArticle = await articlemodel.findByIdAndUpdate(
      articleid,
      { editorspicks },
      { new: true }
    );

    return successResponse(
      res,
      "Article approval status updated successfully",
      updatedArticle
    );
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function breakingarticleHandler(req, res) {
  try {
    const { breaking, articleid } = req.body;

    if (!articleid) {
      return errorResponse(res, 400, "article ID is missing in URL params");
    }

    const existingArticle = await articlemodel.findById({ _id: articleid });
    if (!existingArticle) {
      return errorResponse(res, 404, "Article not found");
    }

    if (typeof breaking !== "boolean") {
      return errorResponse(res, 400, "breaking must be a boolean (true/false)");
    }

    if (breaking === true) {
      // Step 1: Set all other blogs to featured = false
      await articlemodel.updateMany(
        { breaking: true },
        { $set: { breaking: false } }
      );
    }
    const updatedArticle = await articlemodel.findByIdAndUpdate(
      articleid,
      { breaking },
      { new: true }
    );
    if (!updatedArticle) {
      return errorResponse(res, 404, "Article not found");
    }

    return successResponse(
      res,
      `Article breaking status set to ${breaking}`,
      updatedArticle
    );
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function featuredarticleHandler(req, res) {
  try {
    const { featured, articleid } = req.body;

    if (!articleid) {
      return errorResponse(res, 400, "article ID is missing in URL params");
    }

    const existingArticle = await articlemodel.findById({ _id: articleid });
    if (!existingArticle) {
      return errorResponse(res, 404, "Article not found");
    }

    if (typeof featured !== "boolean") {
      return errorResponse(res, 400, "featured must be a boolean (true/false)");
    }

    const updatedArticle = await articlemodel.findByIdAndUpdate(
      articleid,
      { featured },
      { new: true }
    );
    if (!updatedArticle) {
      return errorResponse(res, 404, "Article not found");
    }

    return successResponse(
      res,
      "Article featured status updated successfully",
      updatedArticle
    );
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function publishedarticleHandler(req, res) {
  try {
    const { published, articleid } = req.body;

    if (!articleid) {
      return errorResponse(res, 400, "article ID is missing in URL params");
    }

    const existingArticle = await articlemodel.findById({ _id: articleid });
    if (!existingArticle) {
      return errorResponse(res, 404, "Article not found");
    }

    if (typeof published !== "boolean") {
      return errorResponse(
        res,
        400,
        "published must be a boolean (true/false)"
      );
    }

    const updatedArticle = await articlemodel.findByIdAndUpdate(
      articleid,
      { published },
      { new: true }
    );

    if (!updatedArticle) {
      return errorResponse(res, 404, "Article not found");
    }

    return successResponse(
      res,
      "Article approval status updated successfully",
      updatedArticle
    );
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function videofeaturedHandler(req, res) {
  try {
    const { videofeatured, articleid } = req.body;

    if (!articleid) {
      return errorResponse(res, 400, "article ID is missing in URL params");
    }

    const existingArticle = await articlemodel.findById({ _id: articleid });
    if (!existingArticle) {
      return errorResponse(res, 404, "Article not found");
    }

    if (typeof videofeatured !== "boolean") {
      return errorResponse(
        res,
        400,
        "videofeatured must be a boolean (true/false)"
      );
    }

    if (videofeatured === true) {
      // Count how many articles already have videofeatured = true
      const featuredArticles = await articlemodel
        .find({ videofeatured: true })
        .sort({ updatedAt: 1 }); // oldest first (based on updatedAt)

      if (featuredArticles.length >= 3) {
        // Unset the oldest one (first in the sorted array)
        const oldestArticle = featuredArticles[0];
        await articlemodel.findByIdAndUpdate(oldestArticle._id, {
          videofeatured: false,
        });
      }
    }

    const updatedArticle = await articlemodel.findByIdAndUpdate(
      articleid,
      { videofeatured },
      { new: true }
    );
    if (!updatedArticle) {
      return errorResponse(res, 404, "Article not found");
    }

    return successResponse(
      res,
      "Article featured status updated successfully",
      updatedArticle
    );
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function breadkingvideoHandler(req, res) {
  try {
    const { breakingvideo, articleid } = req.body;

    if (!articleid) {
      return errorResponse(res, 400, "article ID is missing in URL params");
    }

    const existingArticle = await articlemodel.findById({ _id: articleid });
    if (!existingArticle) {
      return errorResponse(res, 404, "Article not found");
    }

    if (typeof breakingvideo !== "boolean") {
      return errorResponse(
        res,
        400,
        "breakingvideo must be a boolean (true/false)"
      );
    }
    if (breakingvideo === true) {
      // Step 1: Reset all other breakingvideo to false
      await articlemodel.updateMany(
        { breakingvideo: true },
        { $set: { breakingvideo: false } }
      );
    }

    const updatedArticle = await articlemodel.findByIdAndUpdate(
      articleid,
      { breakingvideo },
      { new: true }
    );
    if (!updatedArticle) {
      return errorResponse(res, 404, "Article not found");
    }

    return successResponse(
      res,
      "Article breakingvideo status updated successfully",
      updatedArticle
    );
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function singlearticleHandler(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, 400, "Article ID is required");
    }

    // Fetch article with relations
    const article = await articlemodel
      .findById(id)
      .populate("authorid", "firstname lastname designation _id") // author details
      .populate("categoryid", "categoryname ") // category details
      .populate("subcategoryid", "subcategoryname "); // subcategory details

    if (!article) {
      return errorResponse(res, 404, "Article not found");
    }
    return successResponse(res, "success", article);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "intenal server error");
  }
}
