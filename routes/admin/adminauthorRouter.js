import { Router } from "express";
import authormodel from "../../model/authormodel.js";
import { successResponse, errorResponse } from "../../helper/serverResponse.js";
import articlemodel from "../../model/articlemodel.js";

const adminauthorRouter = Router();

export default adminauthorRouter;

adminauthorRouter.post("/", getallauthorHandler);
adminauthorRouter.post("/create", createauthorHandler);
adminauthorRouter.put("/update", updateauthorHandler);
adminauthorRouter.delete("/delete", deleteauthorHandler);

async function getallauthorHandler(req, res) {
  try {
    const { pageno = 0, filterBy = {}, sortby = {}, search = "" } = req.body;
    const limit = 10;
    const skip = pageno * limit;

    let query = {};

    // Apply search
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { firstname: { $regex: searchRegex } },
        { lastname: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { mobile: { $regex: searchRegex } },
        { designation: { $regex: searchRegex } },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstname", " ", "$lastname"] },
              regex: searchRegex,
            },
          },
        },
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
    const author = await authormodel
      .find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    const totalCount = await authormodel.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    successResponse(res, "successfully", {
      author,
      totalPages,
    });
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function createauthorHandler(req, res) {
  try {
    const { firstname, lastname, email, mobile, designation } = req.body;
    if (!firstname || !lastname || !email || !mobile || !designation) {
      return errorResponse(res, 400, "some params are misisng");
    }
    const author = await authormodel.findOne({ email });

    if (author) {
      return errorResponse(res, 404, "author is already present");
    }
    const params = { firstname, lastname, email, mobile, designation };
    const authors = await authormodel.create(params);
    successResponse(res, "successfully", authors);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function updateauthorHandler(req, res) {
  try {
    const { _id, ...updatedData } = req.body;
    if (!_id) {
      return errorResponse(res, 404, "author _id is required");
    }
    const options = { new: true };
    if (
      !updatedData.firstname ||
      !updatedData.lastname ||
      !updatedData.email ||
      !updatedData.mobile ||
      !updatedData.designation
    ) {
      return errorResponse(res, 400, "some params are missing");
    }
    const author = await authormodel.findByIdAndUpdate(
      _id,
      updatedData,
      options
    );
    successResponse(res, "successResponse updated", author);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function deleteauthorHandler(req, res) {
     try {
    const { _id } = req.body;
    if (!_id) {
      return errorResponse(res, 400, "article ID (_id) is required");
    }

    const article = await articlemodel.findById(_id);
    if (!article) {
      return errorResponse(res, 404, "article ID (_id) not found");
    }

   let s3Keys = [];

    // Case 1: single string
    if (typeof article.image === "string") {
      const parts = article.image.split(".amazonaws.com/");
      if (parts[1]) s3Keys.push(parts[1]);
    }

    // Case 2: array of strings
    if (Array.isArray(article.image)) {
      article.image.forEach((url) => {
        if (typeof url === "string") {
          const parts = url.split(".amazonaws.com/");
          if (parts[1]) s3Keys.push(parts[1]);
        }
      });
    }

    // Delete from S3
    if (s3Keys.length === 1) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: s3Keys[0],
        })
      );
    } else if (s3Keys.length > 1) {
      await s3.send(
        new DeleteObjectsCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Delete: {
            Objects: s3Keys.map((Key) => ({ Key })),
            Quiet: true,
          },
        })
      );
    }

    // Delete article from DB
    await articlemodel.findByIdAndDelete(_id);

    return successResponse(res, "Article and associated images deleted");
  
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
