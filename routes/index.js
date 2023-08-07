var express = require('express');
const passport = require('passport');
var router = express.Router();
const userModel = require("./users");
const productModel = require("./product")
const localStrategy = require('passport-local');
const multer = require("multer");
const product = require('./product');
const Schedule = require('node-schedule');
const { create } = require('./users');

passport.use(new localStrategy(userModel.authenticate()));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    const unique = Date.now()+Math.floor(Math.random()*1000000)+file.originalname
    cb(null,unique)
  }
})

const upload = multer({storage:storage});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render("signup");
});

router.get("/signin", function(req,res){
  res.render("login")
});


router.get("/signup" , function(req,res){
  res.render("signup")
});


router.get("/home" , function(req,res){
  userModel.findOne({username:req.session.passport.user})
  .then(function(loggedinuser){
    productModel.find()
    .then(function(createdproducts){
  const somedate = createdproducts.date; 
  console.log(somedate);
  Schedule.scheduleJob(somedate , () => {
    createdproducts.status = "upcoming";
    console.log("ran");
  })
      res.render("home" , {createdproducts , loggedinuser})
    })
  })
})



router.post("/register" , function(req,res){
  var newUser = new userModel({
    username :req.body.username,
    lastname:req.body.lastname,
    email:req.body.email,
    city:req.body.city,
  })
  userModel.register(newUser , req.body.password)
  .then(function(u){
    passport.authenticate('local')(req,res,function(){
      res.redirect("home")
    })
  })
  .catch(function(e){
    res.send(e);
  })
});

router.post("/login" ,passport.authenticate('local' , {
  successRedirect:"/home",
  failureRedirect:"/",
}),function(req,res){ });

router.get("/logout" , function(req,res,next){
  req.logout(function(err){
    if(err){
      return next(err);
    }
    res.redirect('/');
  });
});


router.get("/createproduct" , function(req,res){
  res.render("createproduct")
})

router.post("/create" , function(req,res){
  userModel.findOne({username:req.session.passport.user})
  .then(function(foundUser){
    productModel.create({
      name:req.body.pname,
      img:req.body.image,
      price:req.body.price,
      description:req.body.description,
      date:req.body.inputdate,
      time:req.body.inputtime,
    })
    .then(function(createdProducts){
      var audate = createdProducts.date;
    
      var dtToday = new Date();
      if(audate === dtToday){
        // console.log("matched");
        createdProducts.status = "Started";
        createdProducts.save();
      }
      else{
        createdProducts.status = "Upcoming";
        createdProducts.save();
      }
      foundUser.product.push(createdProducts._id)
      foundUser.save()
      .then(function(){
        res.redirect("/home")
        // res.send(req.body.inputtime)
      })
    })
  })
})


router.get("/myproducts" , function(req,res){
  userModel.findOne({username:req.session.passport.user})
  .populate("product")
  .then(function(loggedinuser){
    // res.send(loggedinuser)
    res.render("myproducts" , {loggedinuser})
  })
})

router.get("/mybids" , function(req,res){
  userModel.findOne({username:req.session.passport.user})
  .populate("bidedprd")
  // .populate("product")
  .then(function(loggedinuser){
    // res.send(loggedinuser.bidedprd);
    res.render("mybids" , {loggedinuser});
  })
})

router.get("/product/:name" , function(req,res){
  const s = req.params.name
  // console.log(s)
  const regex = new RegExp(s,"i")
  productModel.find({name:{$regex:regex}})
  .then(function(foundproduct){
    res.json(foundproduct)
  })
})

router.get("/pro" , function(req,res){
  productModel.find()
  .then(function(foundproduct){
    res.json(foundproduct)
  })
})

router.get("/prodesc/:id" , function(req,res){
  userModel.findOne({username:req.session.passport.user})
  .then(function(founduser){ 
    // founduser.product.forEach(function(prdid){
      // if(prdid != req.params.id){
        productModel.findOne({_id:req.params.id})
      .then(function(product){
        // res.send(product);
        res.render("productDescription" , {product , founduser})
      })
    // }
    // else{
      // res.send("your cannot bid on this product as this is your product")
    // }
  // })
  })
})

router.post("/upload" , upload.single("image") , function(req,res){
  // res.send(req.body.image)
  // res.send(req.file)
  userModel.findOne({username:req.session.passport.user})
  .then(function(loggedinuser){
    loggedinuser.profileimg = req.file.filename,
    loggedinuser.save()
    .then(function(){
      res.redirect("/home")
    })
  })
})

router.post("/userbid/:id" , function(req,res){
  userModel.findOne({username:req.session.passport.user})
  .then(function(loggedinuser){
    productModel.findOne({_id:req.params.id})
    .then(function(product){
      if(loggedinuser.bidedprd.indexOf(product._id) === -1){
        loggedinuser.bidedprd.push(product._id)
      }
      loggedinuser.save();
      price = Number(req.body.price);
      product.bids.push({username:loggedinuser.username , price:price , userimg:loggedinuser.profileimg})
      product.save()
      .then(function(){
        res.redirect(req.headers.referer)
      })
    })
  }) 
})

router.get("/delete/:id" , function(req,res){
  productModel.findOneAndDelete({_id:req.params.id})
  .then(function(deletedP){
    // res.send(deletedP)
    // alert("are you sure you want to delete this product");
    res.redirect(req.headers.referer)
  })
})

router.get("/viewBid/:id" , function(req,res){
  productModel.findOne({_id:req.params.id})
  .then(function(product){
    console.log(product)
    res.render("viewBids" , {product});
  })
})


router.get("/minebid/:id" , function(req,res){
  userModel.findOne({username:req.session.passport.user})
  .then(function(loggedinuser){
  productModel.findOne({_id:req.params.id})
  .then(function(product){
    console.log(product)
    res.render("minebid" , {product,loggedinuser});
  })
})
})

router.get("/delbid/:id" , function(req,res){
  userModel.findOne({username:req.session.passport.user})
  .then(function(loggedinuser){
    product.findOne({_id:req.params.id})
    .then(function(product){
      console.log(product);
    })
  })
})

module.exports = router;



 // var x = setInterval(function() {
      // var now = new Date().getTime();
      // var t = deadline - now;
      // var days = Math.floor(t / (1000 * 60 * 60 * 24));
      // var hours = Math.floor((t%(1000 * 60 * 60 * 24))/(1000 * 60 * 60));
      // var minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
      // var seconds = Math.floor((t % (1000 * 60)) / 1000);
      // createdproducts.date = hours + "h " + minutes + "m " + seconds + "s ";
      //     if (t < 0) {
      //         clearInterval(x);
      //         // document.getElementById("demo").innerHTML = "EXPIRED";
      //         createdproducts.status = "Expired";
      //     }
      // }, 1000);
      
      // res.send(createdproducts)