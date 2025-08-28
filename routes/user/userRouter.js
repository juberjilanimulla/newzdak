import { Router } from "express";
import userarticleRouter from "./userarticleRouter.js";
import userreadervoiceRouter from "./userreadervoiceRouter.js";
import useradvertisementRouter from "./useradvertisementRouter.js";
import usercontactusRouter from "./usercontactusRouter.js";

const userRouter = Router();

userRouter.use("/article", userarticleRouter);
userRouter.use("/readervoice", userreadervoiceRouter);
userRouter.use("/advertisement", useradvertisementRouter);
userRouter.use("/contactus", usercontactusRouter);

export default userRouter;
