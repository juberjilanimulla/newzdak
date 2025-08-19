import { Router } from "express";

import adminauthorRouter from "./adminauthorRouter.js";
import adminarticleRouter from "./adminarticleRouter.js";
import admincategoryRouter from "./admincategoryRouter.js";
import adminsubcategoryRouter from "./adminsubcategoryRouter.js";
import adminphotodayRouter from "./adminphotodayRouter.js";

const adminRouter = Router();

export default adminRouter;

adminRouter.use("/author", adminauthorRouter);
adminRouter.use("/article", adminarticleRouter);
adminRouter.use("/category", admincategoryRouter);
adminRouter.use("/subcategory", adminsubcategoryRouter);
adminRouter.use("/photoday", adminphotodayRouter);
