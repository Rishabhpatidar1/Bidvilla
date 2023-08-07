
const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
    name:String,
    img:String,
    price:Number,
    description:String,
    bids:[{
        type:mongoose.Schema.Types.Mixed
    }],
    date:Date,
    time:String,
    status:String,
    
})

module.exports = mongoose.model("product" , productSchema)