import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema({
    subscriber:{
        type: Schema.Types.ObjectId, // one who is sbuscribing
        ref: "User"
    },
    channel:{
        type: Schema.Types.ObjectId, // one whom sbuscriber is subscribing
        ref: "User"
    }
}, { timestamps: true })

const Subscription = mongoose.model("Subscription", subscriptionSchema)