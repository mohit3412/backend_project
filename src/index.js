// require('dotenv').config({path: './env'})

import dotenv from "dotenv"

import mongoose, { mongo } from "mongoose";
import connectDB from "./db/database.js";

dotenv.config({
    path: './env'
})


connectDB()






























// const app = express()

// ( async () => {
//     try {
//         await mongoose.connect(`${process.env.
//             MONGODB_URI}/${DB_NAME}`)
//             app.on("error", (error) => {
//                 console.log("Error: ", error)
//                 throw error
//             })

//             app.listen(process.env.PORT, () => {
//                 console.log(`App is listening on port ${process.env.PORT}`);
//             })
//     } catch (error) {
//         console.log("ERROR: ",error)
//     }
// })()