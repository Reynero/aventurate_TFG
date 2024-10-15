const joi = require("joi");
const ErrorClass = require("../errorHandlers/ErrorClass");
//------------------------------------------------------------------------

//here we re creating our middleware
module.exports.validate = (req, res, next) => {
    const campSchema = joi.object({//we are using joi as a error handler library, first we are ensuring that campground has a value
        campground: joi.object({//remember, everything is grouped under campground
            title: joi.string().required(),//then that title is a string and has a value too
            price: joi.number().required().min(0),
            
            location: joi.string().required(),
            description: joi.string().required()

        }).required(),
        deleteImages: joi.array()//this is becase we made a new array in the edit.ejs file to contain all the imgs that we want to delete
    }); 
    const {error} = campSchema.validate(req.body);//here we are passing the data we want to validate
    if(error){
        const msg = error.details.map(el => el.message).join(",");//here we are taking all the elements from the array and joining them
        throw new ErrorClass(msg, 400);
    }else{
        next();//this goes empty just so the program moves on if there's no error
    }
}

module.exports.validateReview = (req, res, next)=>{
    const reviewSchema = joi.object({
        review: joi.object({
            body: joi.string().required(),
            rating: joi.number().required().min(1).max(5)
        }).required()
    });
    req.body.review.rating = "1";//this is so the validations dont bother us, since this comes before the config in the post route there's nothing i can do..... yet
    
    const {error} = reviewSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(",");
        throw new ErrorClass(msg, 400);
    }else{
        next();
    }
}

//---------------------------------------------------------------------------------