

const mongoose = require('mongoose');
var plm = require("passport-local-mongoose");

mongoose.connect("mongodb://localhost/bidvilla").then(function(){
  console.log("connected");
})

const userSchema = mongoose.Schema({
  username:String,
  lastname:String,
  email:String,
  password:String,
  city:String,
  product:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"product"
  }],
  profileimg:{
    default:"default.png",
    type:String,
  },
  bidedprd:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"product",
  }],
})

userSchema.plugin(plm);

module.exports = mongoose.model("user" , userSchema);