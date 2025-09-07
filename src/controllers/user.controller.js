import { asyncHandler } from "../utils/asynHandler.js";
import { ApiError } from '../utils/ApiError.js'
import User from '../models/user.models.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'
import { transcode } from "buffer";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const referesToken = user.generateRefereshToken()

        user.referesToken = referesToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, referesToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and acces token")
    }

}

const registerUser = asyncHandler(async (req, res) => {
    // get userr details from frontend 
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object- create entry in db
    // remove password and refresh token field from response
    // check for user cration 
    // return response
    console.log(req.body);

    const { fullName, email, username, password } = req.body
    // console.log("email: ", email);

    // if(fullName === ""){
    //     throw new ApiError(400,"fullname is reqired")
    // }

    if ([fullName, email, username, password].some((field) =>
        field?.trim() == "")
    ) {
        throw new ApiError(400, "all fields are required")
    }

    // console.log(email)

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exist")
    }

    // console.log(existedUser);
    

    const avatarLocalPath = req.files?.avatar[0]?.path
    // console.log(avatarLocalPath);
    
    const coverImageLocalPAth = req.files?.coverImage[0]?.path;
    // console.log(avatarLocalPath, coverImageLocalPAth);
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPAth)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )


})

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie

    const { email, username, password } = req.body

    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
    }

    console.log(email, password);
    

    const user = await User.findOne({ $or: [{ email }, { username }] })

    if (!user) {
        throw new ApiError(404, "User not found")
    }
    console.log(user)

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "password Incorrect")
    }

    const { accessToken, referesToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -referesToken"
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", referesToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, referesToken
                },
                "user logged In successfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: undefined }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken
    console.log("Incoming refresh token:", incomingRefreshToken);

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or invalid");
        }

        const options = {
            httpOnly: true,
            secure: true,
        };

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(200, { accessToken, refreshToken }, "Access Token refreshed")
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const changeCurrentPassword = asyncHandler(async(req, res) => {

    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPaswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPaswordCorrect){
        throw new ApiError(400, "invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:true})

    return res.status(200).json(
        new ApiResponse(200, {}, "password changed successfully")
    )
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, "current user fetched successfully")
    )
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if(!(fullName && email)){
        throw new ApiError(400, "All fields are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true} // update hone ke baad ki information return karta hai.
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Account details updated successfully" )
    )
})

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath =  req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
          $set:{
            avatar: avatar.url
          }  
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user,  "Avatar updated successfully" )
    )
})

const updateUerCoverImage = asyncHandler(async(req, res) => {
    const coverIamgeLocalPath =  req.file?.path
    if(!coverIamgeLocalPath){
        throw new ApiError(400, "cover Image is missing")
    }

    const coverimage= await uploadOnCloudinary(coverIamgeLocalPath)

    if(!coverIamgeLocalPath.url){
        throw new ApiError(400, "Error while uploading on cover Image")
    }

    const user =  await User.findByIdAndUpdate(
        req.user?._id,
        {
          $set:{
            coverimage: coverimage.url
          }  
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user, "cover image updated successfully" )
    )
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserAvatar }