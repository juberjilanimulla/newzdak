import { Router } from "express";
import userarticleRouter from "./userarticleRouter.js";

const userRouter = Router();

userRouter.use("/article", userarticleRouter);

export default userRouter;
