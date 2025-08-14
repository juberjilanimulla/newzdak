import { Router } from "express";
import adminauthorRouter from "./adminauthorRouter.js";
import adminarticleRouter from "./adminarticleRouter.js";

const adminRouter = Router();

export default adminRouter;

adminRouter.use("/author", adminauthorRouter);
adminRouter.use("/article", adminarticleRouter);
