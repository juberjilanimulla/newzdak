import { Router } from "express";
import userarticleRouter from "./userarticleRouter.js";
import userreadervoiceRouter from "./userreadervoiceRouter.js";
import useradvertisementRouter from "./useradvertisementRouter.js";
import usercontactusRouter from "./usercontactusRouter.js";
import usertermandconditionRouter from "./usertermsandconditiionRouter.js";

const userRouter = Router();

userRouter.use("/article", userarticleRouter);
userRouter.use("/readervoice", userreadervoiceRouter);
userRouter.use("/advertisement", useradvertisementRouter);
userRouter.use("/contactus", usercontactusRouter);
userRouter.use("/termsandcondition", usertermandconditionRouter);

export default userRouter;
