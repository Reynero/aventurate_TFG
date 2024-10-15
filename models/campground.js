const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const review = require("./review");

const imagesSchema = new Schema({
    url: String,
    filename: String
});

//dont pay much attention to this virtual, its just to adjust the thumbnail size on the images when you are picking them to delete
//you could've done this in css but you just followed the video cuz you were in a hurry that day
imagesSchema.virtual("thumbnail").get(function(){
    //'this' refers to the particular image
    return this.url.replace("/upload", "/upload/w_200");
});

const campSchema = new Schema({
    title: String,
    price: Number,
    images: [
        imagesSchema
    ],
    geometry: {
        type: {
            type: String,
            enum: ['Point'],//type has to be specifically 'Point'
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    description: String,
    location: String,
    author: {
        type: Schema.Types.ObjectId,//here you are joining the user table with Campground
        ref: "User"
    },
    review:[//ONE CAMPGROUND CAN HAVE MANY REVIEWS (IN A VIEW POINT OF A WEB PAGE, WHEN YOU GET INTO A CAMPGROUNG YOU'LL FIND MANY REVIEWS AND NOT THE OTHER WAY AROUND)
        {
            type: Schema.Types.ObjectId,//here the same with Review
            ref: "Review"
        }
    ]
});

//remember you gotta find the right function to use here so it gets triggered by the delete functions in main.js in the review section
campSchema.post("findOneAndDelete", async (doc)=>{
    //btw doc is the deleted element since we are using a post middleware
    if(doc){
        await review.deleteMany({_id:{$in:doc.review}});
        //here says: remove all the elements whose id is the review array of the deleted campground
    }
});

//btw the name you set here will be the name of the table, mongo will automatically add an s to the word and turn all the letters to lowercase
module.exports = mongoose.model("Campground", campSchema);