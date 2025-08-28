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
userarticleRouter.post(
  "/subcategory/:subcategoryid/articles",
  getallarticlebysubcategoryHandler
);
userarticleRouter.get("/photoofday", getphotodayHandler);
userarticleRouter.get("/videofeatured", getfeaturedvideoHandler);
userarticleRouter.get("/brandconnect/:id", getbrandconnectHandler);
userarticleRouter.get("/singlearticle/:id", singlearticleHandler);
userarticleRouter.get("/breakingvideo", breadkingvideoHandler);
userarticleRouter.get("/allcategory", getcategorieswithsubcategoriesHandler);
userarticleRouter.post(
  "/category/:categoryid/articles",
  getallarticlesportcategoryHandler
);

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
      .find({ published: true })
      .populate({
        path: "subcategoryid",
        match: { subcategoryname: "Editors Picks" }, // match directly
        select: "subcategoryname slug _id", // only required fields
      })
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
    const nationalCategory = await categorymodel.findOne({
      categoryname: "National",
    });

    if (!nationalCategory) {
      return errorResponse(res, 404, "National category not found");
    }

    // 2. Get all articles under National category, grouped by subcategory
    const articles = await articlemodel
      .find({
        categoryid: nationalCategory._id,
        published: true,
      })
      .limit(5)
      .populate("authorid", "firstname lastname designation _id")
      .populate("subcategoryid", "subcategoryname _id")
      .sort({ createdAt: -1 });

    return successResponse(res, "National category fetched", {
      articles,
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
    const { pageno = 0, filterBy = {}, sortby = {}, search = "" } = req.body;

    const limit = 20;
    const skip = pageno * limit;

    if (!subcategoryid) {
      return errorResponse(res, 400, "subcategory ID is missing");
    }

    let query = { subcategoryid, published: true };

    //
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { content: { $regex: searchRegex } }, // optional if you have article content field
      ];
    }

    //
    if (filterBy && Object.keys(filterBy).length > 0) {
      query = {
        ...query,
        ...filterBy,
      };
    }

    let sortBy = { featured: -1 }; // put featured:true articles first

    if (Object.keys(sortby).length !== 0) {
      sortBy = {
        featured: -1, // ensures featured always comes first
        ...Object.keys(sortby).reduce((acc, key) => {
          acc[key] = sortby[key] === "asc" ? 1 : -1;
          return acc;
        }, {}),
      };
    } else {
      sortBy = { featured: -1, createdAt: -1 };
    }

    //
    const articles = await articlemodel
      .find(query)
      .populate("categoryid", "categoryname")
      .populate("subcategoryid", "subcategoryname")
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    const totalCount = await articlemodel.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    if (!articles.length) {
      return errorResponse(res, 404, "No articles found");
    }

    return successResponse(res, "Success", {
      articles,
      totalPages,
      totalCount,
    });
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
      .find({ videofeatured: true, published: true })
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
    const { id } = req.params;
    if (!id) {
      return errorResponse(res, 400, "some params are missing");
    }
    const subcategories = await subcategorymodel.find({ categoryid: id });

    if (!subcategories || subcategories.length === 0) {
      return successResponse(res, "No subcategories found", []);
    }

    // For each subcategory fetch the latest article
    const result = await Promise.all(
      subcategories.map(async (subcat) => {
        const latestArticle = await articlemodel
          .findOne({
            categoryid: id,
            subcategoryid: subcat._id,
            published: true,
          })
          .populate("authorid", "firstname lastname designation _id")
          .sort({ createdAt: -1 });

        return {
          subcategoryid: subcat._id,
          subcategoryname: subcat.name,
          articles: latestArticle ? [latestArticle] : [],
        };
      })
    );
    return successResponse(res, "success", result);
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

async function getallarticlesportcategoryHandler(req, res) {
  try {
    const { categoryid } = req.params;
    const { pageno = 0, filterBy = {}, sortby = {}, search = "" } = req.body;

    const limit = 20;
    const skip = pageno * limit;

    if (!categoryid) {
      return errorResponse(res, 400, "category ID is missing");
    }

    let query = { categoryid, published: true };

    // search
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { content: { $regex: searchRegex } },
      ];
    }

    // filters
    if (filterBy && Object.keys(filterBy).length > 0) {
      query = { ...query, ...filterBy };
    }

    // sorting
    let sortBy = { featured: -1, createdAt: -1 };
    if (Object.keys(sortby).length !== 0) {
      sortBy = {
        featured: -1,
        ...Object.keys(sortby).reduce((acc, key) => {
          acc[key] = sortby[key] === "asc" ? 1 : -1;
          return acc;
        }, {}),
      };
    }

    // fetch articles
    const articles = await articlemodel
      .find(query)
      .populate("categoryid", "categoryname")
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    const totalCount = await articlemodel.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    if (!articles.length) {
      return errorResponse(res, 404, "No articles found");
    }

    return successResponse(res, "Success", {
      articles,
      totalPages,
      totalCount,
    });
  } catch (error) {
    console.log("error", error);
    errorResponse(res, 500, "internal server error");
  }
}
