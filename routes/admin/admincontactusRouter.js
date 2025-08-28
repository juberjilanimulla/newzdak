import { Router } from "express";
import { successResponse, errorResponse } from "../../helper/serverResponse.js";
import contactusmodel from "../../model/contactusmodel.js";

const admincontactusRouter = Router();

admincontactusRouter.get("/getall", getallcontactusHandler);
admincontactusRouter.delete("/delete", deletecontactusHandler);

export default admincontactusRouter;

async function getallcontactusHandler(req, res) {
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
        { mobile: { $regex: searchRegex } },
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

    // Fetch paginated blogs
    const contact = await contactusmodel
      .find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    const totalCount = await contactusmodel.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    successResponse(res, "successfully", {
      contact,
      totalPages,
    });
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function deletecontactusHandler(req, res) {
  try {
    const { _id } = req.body;
    if (!_id) {
      return errorResponse(res, 400, "contact _id is required");
    }
    const contact = await contactusmodel.findById(_id);
    if (!contact) {
      return errorResponse(res, 404, "contact not found");
    }
    const deleted = await contactusmodel.findByIdAndDelete({ _id: _id });
    successResponse(res, "successfully deleted ");
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
