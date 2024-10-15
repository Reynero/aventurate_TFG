const express = require("express");
const ErrorClass = require("../errorHandlers/ErrorClass");
const router = express.Router();
const campgroundModel = require("../models/campground");
const { validate } = require("../valdationMiddlewares/index");
const {isLoggedIn, isAuthor, scrape, sentiAnalysis} = require("../middleware");
const review = require("../models/review");
const {storage, cloudinary} = require("../cloudinary/index");
const multer = require("multer");//this is uSed to deal with the parse of the file format (images upload)
const upload = multer({storage});
const maptilerClient = require("@maptiler/client");
maptilerClient.config.apiKey = process.env.MAPTILER_API_KEY;



//this is a new way to group all the HTTP requests of each path
//you can do this only when you have the same path with multiple requests (get, post, put, delete)
router.route("/")
.get(
    async (req, res, next)=>{//GET, POST, PUT AND DELETE DONT HAVE ERR AS A PARAM!!!!!!!!!!
    try{
        const campgrounds = await campgroundModel.find({});
        res.render("campgrounds/index.ejs", {campgrounds});
        //btw every time you call an ejs file it will only inside the 'views' folder as you set in the code above
        //so will have to specify the folder ONLY IF YOU CREATE IT INSIDE VIEWS
    }catch(err){
        
        next(err);
    }  
})
//MIDDLEWARES CAN GO AS THE 2ND PARAM (validate) SO IT GETS EXECUTED BEFORE THE MAIN FUNC 
//FOR EXAMPLE IN THIS POST METHOD
.post(isLoggedIn, upload.array("image"), validate,
    async (req, res, next)=>{//GET, POST, PUT AND DELETE DONT HAVE ERR AS A PARAM!!!!!!!!!!
    try{
        const geoData = await maptilerClient.geocoding.forward(req.body.campground.location, { limit: 1 });//this is for the geo map, basically when you put the country in the API it returns the coordinates
        console.log(geoData);
         //if(!req.body.campground) throw new ErrorClass("invalid campground data", 400);//this also will be caought by the error handler 
        const newCamp = new campgroundModel(req.body.campground);//remember, you are using body.campground because you configured it like that in /new {"campground":{"title":"dfgdf","location":"gfdgfd"}}
        newCamp.geometry = geoData.features[0].geometry;//geometry is where the API has the coordinates
        //dont forget that requ.body is the data you sent through the form back in /new
        //req.params.id is the data you send through the URL, all the string that goes instead of :id
        newCamp.images = req.files.map((ele)=>({url:ele.path, filename: ele.filename}));//here we are getting the data sent to cloudinary and assigning it to mongo
        newCamp.author = req.user._id;
        await newCamp.save();
        console.log(req.files);
        req.flash("success", "Successfully created a route!");//flash messages appear just once 
       
        //res.redirect(`/campgrounds/${newCamp._id}`); maybe add this after your defense, it takes too long
        res.redirect("/campgrounds");
    }catch(err){
        next(err);//this will be sent to the error handler almost at the end of the file
    }
});




router.get("/new", isLoggedIn, (req, res)=>{
    
    res.render("campgrounds/new.ejs");
     
});



//hey, the order of this addresses matter, all the static addresses have to go first, then you can code the ones that have :id
router.route("/:id")
.get(
    async (req, res, next)=>{//GET, POST, PUT AND DELETE DONT HAVE ERR AS A PARAM!!!!!!!!!!
    try{
        
        const {id} = req.params;
        const found = await campgroundModel.findById(id).populate({
            path: "review",//nested populate
            populate: {
                path: "author"//here we are populating the author inside review
            }
        }).populate("author");//here we are populating the campground's author
        //use findById everytime you are using an id and NEVER use curly brackets inside the function 
        //found.title
        const googleRatings = await scrape(found.title);//here you are using the publication title to scrape 
        console.log(googleRatings);
        const sentiResponse = await sentiAnalysis(...googleRatings);
        console.log(sentiResponse);
        /*
        TRY CALING SIMPLER HTML ELEMETS TO SEE IF THEY WORK
        USE YOUR SCREENSHOT TO CHECK IF ITS GETTING IN THE <A>
        THE LAST PIC IS FROM AMBORO, IT DOESNT GET TO TAKE THE NEW PIC YET
        */ 
        let scrapeReview = 1;
        //this because xenova NPL model returns a string, example: '1 star, 2 stars....and so on'    
        if(sentiResponse.includes("2")){
            scrapeReview = 2;
        }else if(sentiResponse.includes("3")){
            scrapeReview = 3;
        }else if(sentiResponse.includes("4")){
            scrapeReview = 4;
        }else if(sentiResponse.includes("5")){
            scrapeReview = 5;
        }

        if(googleRatings[0] === "Try Again"){
            scrapeReview = 0;
        }

        if(!found){
            //in case we try somehow to go to a non-existent campground 
            req.flash("error", "Cannot find that route!");
            return res.redirect("/campgrounds");
        }
        res.render("campgrounds/show.ejs", {found, googleRatings, scrapeReview});
    }catch(err){
        next(err);
    }
     
})
//BTW for put and delete we use a post request with a fake _method
.put(isLoggedIn, isAuthor, upload.array("image"),
    async (req, res, next)=>{//we are asigning this address "/campgrounds/:id" here because is the one we've set in form's action back in edit
    try{
        const {id} = req.params;
        //const newCapm = campground.findByIdAndUpdate(id, {title: "sdfsdfs", location:"dsfsdfs"});
        //just an example
        const newCamp = await campgroundModel.findByIdAndUpdate(id, {...req.body.campground});//we are using spread operartor cuz remember everything is insde the campground array
        const geoData = await maptilerClient.geocoding.forward(req.body.campground.location, { limit: 1 });//this is for the geo map, basically when you put the country in the API it returns the coordinates
        newCamp.geometry = geoData.features[0].geometry;
        const imgs = req.files.map((ele)=>({url:ele.path, filename: ele.filename}));//we dont want to push an array inside another array so we put everthing in a variable so we can spread it later
        newCamp.images.push(...imgs);//here we are getting the data sent to cloudinary and assigning it to mongo
        await newCamp.save();
        if(req.body.deleteImages){
            for(let filename of req.body.deleteImages){//now here you are deleting the actual photo from cloudinary, below this you are deleting the url from mongo
                await cloudinary.uploader.destroy(filename);
            }
            await newCamp.updateOne({$pull: {images: {filename: {$in:req.body.deleteImages}}}});
            //pull out from 'images' all images that have filenames equals to the filenames IN deleteImages
            //this is how you read the code from above, btw here you are only removing the URLs from mongo
        }
        req.flash("success", "Successfully updated a route!");//flash messages appear just once 
        res.redirect("/campgrounds/" + newCamp._id);
    }catch(err){
        next(err);
    }
})
.delete(isLoggedIn, isAuthor, 
    async (req, res, next)=>{//GET, POST, PUT AND DELETE DONT HAVE ERR AS A PARAM!!!!!!!!!!
    try{
        const {id} = req.params;
        await campgroundModel.findByIdAndDelete(id);
        req.flash("success", "Successfully deleted a route!");//flash messages appear just once 
        res.redirect("/campgrounds");
    }catch(err){
        next(err);
    }
});



router.get("/:id/edit", isLoggedIn, isAuthor, async (req, res, next) => {//GET, POST, PUT AND DELETE DONT HAVE ERR AS A PARAM!!!!!!!!!!
    try{
        const {id} = req.params;
        const found = await campgroundModel.findById(id);
        res.render("campgrounds/edit.ejs", {found});
    }catch(err){
        next(err);
    }
});

module.exports = router;