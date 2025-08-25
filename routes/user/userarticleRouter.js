import { Router } from "express";
import articlemodel from "../../model/articlemodel.js";
import { successResponse, errorResponse } from "../../helper/serverResponse.js";
import categorymodel from "../../model/categorymodel.js";
import subcategorymodel from "../../model/subcategorymodel.js";
import photodaymodel from "../../model/photodaymodel.js";

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
userarticleRouter.get("/photoofday", getphotodayHandler);
userarticleRouter.get("/videofeatured", getfeaturedvideoHandler);
userarticleRouter.get("/brandconnect", getbrandconnectHandler);
userarticleRouter.get("/singlearticle/:id", singlearticleHandler);
userarticleRouter.get("/breakingvideo", breadkingvideoHandler);
userarticleRouter.get("/allcategory", getcategorieswithsubcategoriesHandler);

export default userarticleRouter;

async function getbreakingnewsHandler(req, res) {
  try {
    const breaking = await articlemodel
      .find({ breaking: true })
      .populate("authorid", "firstname lastname designation _id")
      .sort({ createdAt: -1 });

    // Get all latest articles
    const query = breaking
      ? { _id: { $ne: breaking._id }, published: true }
      : { published: true };

    const latest = await articlemodel
      .find(query)
      .populate("authorid", "firstname lastname designation _id")
      .sort({ createdAt: -1 })
      .limit(10);
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
      .find({ editorspicks: true, published: true })
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
    const { subcategoryid } = req.params;
    if (!subcategoryid) {
      return errorResponse(res, 400, "some params missing");
    }

    const article = await articlemodel
      .find({ subcategoryid })
      .populate("categoryid", "categoryname") // Populate category name
      .populate("subcategoryid", "subcategoryname") // Populate subcategory name
      .exec();
    if (!article.length) {
      return errorResponse(res, 404, "article are not found");
    }
    successResponse(res, "Success", article);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function getphotodayHandler(req, res) {
  try {
    const photoofday = await photodaymodel
      .find({ published: true })
      .sort({ updatedAt: -1 })
      .limit(1);

    return successResponse(res, "success", photoofday);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function getfeaturedvideoHandler(req, res) {
  try {
    const featuredvideo = await articlemodel
      .find({ videofeatured: true })
      .limit(3)
      .sort({ createdAt: -1 });
    return successResponse(res, "success", featuredvideo);
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function getbrandconnectHandler(req, res) {
  try {
    const articles = await articlemodel
      .find({
        "categoryid.categoryname": "Brand Connect",
        published: true,
      })
      .populate("authorid", "firstname lastname designation _id")
      .sort({ createdAt: -1 });
    //  You can adjust limit per subcategory

    return successResponse(res, "success", articles);
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

async function breadkingvideoHandler(req, res) {
  try {
    const breakingvideo = await articlemodel
      .findOne({ breakingvideo: true, published: true })
      .populate("authorid", "firstname lastname designation _id")
      .sort({ createdAt: -1 });

    //  Send response
    return successResponse(res, "Breaking video and latest news fetched", {
      breakingvideo,
    });
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}

async function getcategorieswithsubcategoriesHandler(req, res) {
  try {
    // Fetch all categories
    const categories = await categorymodel.find();

    if (!categories.length) {
      return errorResponse(res, 404, "No categories found");
    }

    // Build category + subcategories structure
    const data = await Promise.all(
      categories.map(async (cat) => {
        const subcategories = await subcategorymodel.find({
          categoryid: cat._id,
        });

        return {
          _id: cat._id,
          category: cat.categoryname,
          slug: cat.slug,
          subcategories: subcategories.map((sub) => ({
            _id: sub._id,
            subcategoryname: sub.subcategoryname,
            slug: sub.slug,
          })),
        };
      })
    );
    return successResponse(res, "success", data);
  } catch (error) {
    console.log("error", error);
    return errorResponse(res, 500, "internal server error");
  }
}
