import { Router } from "express";
import { getContact, getUsers } from "../controllers/admin.controller.js";


const adminRouter  = Router()

adminRouter.route('/users').get(getUsers)
adminRouter.route('/contact').get(getContact)

export default adminRouter;