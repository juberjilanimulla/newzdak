import { Router } from "express";
import { errorResponse, successResponse } from "../../helper/serverResponse.js";
import readervoicemodel from "../../model/readervoicemodel.js";

const adminreadervoiceRouter = Router();

adminreadervoiceRouter.post("/", getallreadervoiceHandler);
adminreadervoiceRouter.post("/published", publishedreadervoiceHandler);

export default adminreadervoiceRouter;

async function getallreadervoiceHandler(req, res) {
  try {
    const { pageno = 0, filterBy = {}, sortby = {}, search = "" } = req.body;
    const limit = 10;
    const skip = pageno * limit;

    let query = {};

    // Apply search
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { message: { $regex: searchRegex } },
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

    // Fetch paginated reader voice
    const readervoice = await readervoicemodel
      .find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    const totalCount = await readervoicemodel.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    successResponse(res, "successfully", {
      readervoice,
      totalPages,
    });
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function publishedreadervoiceHandler(req, res) {
  try {
    const { published, readervoiceid } = req.body;
    if (!published || !readervoiceid) {
      return errorResponse(res, 400, "some params are missing");
    }
    const readervoice = await readervoicemodel.find({ _id: readervoiceid });
    if (!readervoice) {
      return errorResponse(res, 404, "reader voice id not found");
    }
    if (typeof published !== "boolean") {
      return errorResponse(
        res,
        400,
        "published must be a boolean (true/false)"
      );
    }

    const updatedReader = await readervoicemodel.findByIdAndUpdate(
      readervoiceid,
      { published },
      { new: true }
    );

    if (!updatedReader) {
      return errorResponse(res, 404, "Reader voice  not found");
    }

    return successResponse(
      res,
      "Reader voice approval status updated successfully",
      updatedReader
    );
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
