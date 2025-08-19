import { Router } from "express";
import authormodel from "../../model/authormodel.js";
import { successResponse, errorResponse } from "../../helper/serverResponse.js";

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
      return errorResponse(res, 400, "author _id is required");
    }
    const author = await authormodel.findById(_id);
    if (!author) {
      return errorResponse(res, 404, "author not found");
    }
    const deleted = await authormodel.findByIdAndDelete({ _id: _id });
    successResponse(res, "successfully deleted ");
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
