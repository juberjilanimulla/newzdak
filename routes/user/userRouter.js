import { Router } from "express";
import userarticleRouter from "./userarticleRouter.js";
import userreadervoiceRouter from "./userreadervoiceRouter.js";

const userRouter = Router();

userRouter.use("/article", userarticleRouter);
userRouter.use("/readervoice", userreadervoiceRouter);

export default userRouter;
