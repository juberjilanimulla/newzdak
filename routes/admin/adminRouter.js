import { Router } from "express";
import adminauthorRouter from "./adminauthorRouter.js";

const adminRouter = Router();

export default adminRouter;

adminRouter.use("/author", adminauthorRouter);
