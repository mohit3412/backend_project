import { asyncHandler } from "../utils/asynHandler.js";
import User from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";



const getUsers = asyncHandler(async (req, res) => {
    const user = await User.find().select("-password")
    console.log(user)
    
    if(!user || user.length === 0){
        throw new ApiError(404, "User Not Found!")
    }

    
    
    return res.status(201).json(
        new ApiResponse(200, user, "Success")
    )
})

const getContact = asyncHandler(async(req, res) => {
    const contactDetails =await User.find().select("-password -createdAt -updatedAt -__v -watchHistory")

    if(!contactDetails){
        throw new ApiError(404, "Contact Not Found")
    }

    return res.status(201).json(
        new ApiResponse(200,contactDetails, "Success")
    )
})

export {getUsers, getContact};