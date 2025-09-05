import { Router } from "express";
import { userLogin } from "../controllers/login.controller.js";


const loginRouter = Router()

loginRouter.route("/user").post(userLogin)

export {loginRouter}