import { Router } from "express";
import articlemodel from "../../model/articlemodel.js";
import { successResponse, errorResponse } from "../../helper/serverResponse.js";
import categorymodel from "../../model/categorymodel.js";
import subcategorymodel from "../../model/subcategorymodel.js";

const userarticleRouter = Router();

userarticleRouter.get("/breaking", getbreakingnewsHandler);
userarticleRouter.get("/editorspicks", geteditorspicksHandler);
userarticleRouter.get("/national", getnationalHandler);
userarticleRouter.get("/category", getcategoryHandler);
userarticleRouter.get("/subcategory/:categoryid", getallsubcategoryHandler);
userarticleRouter.get(
  "/subcategory/:subcategoryid/articles",
  getallarticlebysubcategoryHandler
);

export default userarticleRouter;

async function getbreakingnewsHandler(req, res) {
  try {
    const breaking = await articlemodel
      .findOne({ breaking: true })
      .populate("authorid", "firstname lastname designation _id")

      .sort({ createdAt: -1 });

    // Get all latest articles
    const query = breaking ? { _id: { $ne: breaking._id } } : {};
    const latest = await articlemodel
      .find(query)
      .populate("authorid", "firstname lastname designation _id")

      .sort({ createdAt: -1 });
    return successResponse(res, "Breaking and latest news fetched", {
      breaking,
      latest,
    });
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function geteditorspicksHandler(req, res) {
  try {
    const editorspicks = await articlemodel
      .find({ editorspicks: true })
      .populate("authorid", "firstname lastname designation _id")
      .sort({ createdAt: -1 })
      .limit(3);

    return successResponse(res, "Editors picks fetched", editorspicks);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function getnationalHandler(req, res) {
  try {
    const featured = await articlemodel
      .findOne({ featured: true })
      .populate("authorid", "firstname lastname designation _id")

      .sort({ createdAt: -1 });

    // 2. Get all articles from national category
    const nationalArticles = await articlemodel
      .find({})
      .populate("authorid", "firstname lastname designation _id")

      .sort({ createdAt: -1 });

    //  Filter to only those under category "National"
    const nationalOnly = nationalArticles.filter(
      (art) => art.categoryid?.name?.toLowerCase() === "National"
    );

    return successResponse(res, "National category fetched", {
      featured,
      all: nationalOnly,
    });
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function getcategoryHandler(req, res) {
  try {
    const category = await categorymodel.find();
    if (!category.length) {
      return errorResponse(res, 404, "no categories found ");
    }
    successResponse(res, "success", category);
  } catch (error) {
    errorResponse(res, 500, "internal server error");
  }
}

async function getallsubcategoryHandler(req, res) {
  try {
    const { categoryid } = req.params;
    const subcategory = await subcategorymodel.find({ categoryid });
    if (!subcategory.length) {
      return errorResponse(res, 404, "subcategories not found in the category");
    }
    successResponse(res, "success", subcategory);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function getallarticlebysubcategoryHandler(req, res) {
  try {
    // const article = await 
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
