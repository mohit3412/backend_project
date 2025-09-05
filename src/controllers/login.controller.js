import User from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynHandler.js";
import bcrypt from 'bcrypt'


const userLogin = asyncHandler(async(req,res) => {
    console.log(req.body);
    
    const {email, password} = req.body
    const user = await User.findOne( {email} )

    if(!user){
        throw new ApiError(404, "user not found!")
    }

    const varifiedPassword = await bcrypt.compare(password, user.password)

    if(!varifiedPassword){
        throw new ApiError(401,"incorrect password")
    }

    return res.status(200).json({
        success: true
    }
    )
})

export {userLogin}