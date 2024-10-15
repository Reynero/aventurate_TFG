if(process.env.NODE_ENV !== "production"){
    require("dotenv").config();
}


const express = require("express");
const { default: mongoose } = require("mongoose");
const app = express();
const path = require("path");
const campgroundModel = require("./models/campground");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ErrorClass = require("./errorHandlers/ErrorClass");
const session = require("express-session");
const reviews = require("./models/review");

const campgroundsRoute = require("./routes/campground");
const userRoutes = require("./routes/users");
const reviewsRoute = require("./routes/reviews");
const flash = require("connect-flash");
const passport = require("passport")
const localStrategy = require("passport-local");
const userModel = require("./models/user");
const mongoSanitize = require("express-mongo-sanitize");
const mongoStore = require("connect-mongo");//this is necessary for production phase

const dbUrl = process.env.DB_URL;
//const dbUrl = "mongodb://localhost:27017/aventurate";//if you dont remember the prod address check the url in your github
//"mongodb://localhost:27017/aventurate" localhost
mongoose.connect(dbUrl)
.then(()=>{
    console.log("DATBASE CONNECTED!");
})
.catch((err)=>{
    console.error("Connection error: " + err);
});

//USERNAME: rey
//PASSWORD: 123

//https://cloud.maptiler.com/account/keys/ this is the website for the maps API
//https://cloudinary.com/ this is what we use to store the pictures since mongo space is too limited
//it was deployed on render.com

const store = mongoStore.create({
    mongoUrl: dbUrl,
    crypto:{
        secret:"secret"
    },
    touchAfter: 24 * 60 * 60
});

store.on("error", (e)=>{
    console.log("SESSION STORE ERROR", e);
});

const sessionConfig = {
    store,
    name:"blah",
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    cookie:{
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,//expires in one week
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};
//this is like using localstorage, its a easy way to use browser memory
//and for cookies
app.use(session(sessionConfig));
app.use(flash());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
//here you are saying that the 'ejs' files will be inside the folder views
//therefore the program will only search inside that folder
app.use(express.urlencoded({extended: true}));//this lets you manage the data sent through post requests
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);

app.use(passport.session());//it works with sessions too
app.use(passport.initialize());//you were too lazy to pay attention this day, passport is just about security and passwords
passport.use(new localStrategy(userModel.authenticate()));
passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());

//another middleware
app.use((req, res, next)=>{//FOR THIS TO WORK IT HAS TO GO BEFORE CALLING THE ROUTER ADDRESSES
    //whatever is stored in flash("success") will be assign to res.locals
    res.locals.success = req.flash("success");//with this you can use the variable 'success' in the boilerplate
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;//here you are storing the logged in or logged out user 
    //req.isAuthenticated(); returns true if you are logged in, this means if you have stored a cookie in session with the user data
    //req.user returns the actual user data that is stored
    
    next();
});

//ALWAYS CALL THE ROUTES AT LAST, ALWAYS!!!!
app.use("/", userRoutes);
app.use("/campgrounds", campgroundsRoute);//to call all the addresses from this route they must have /campgrunds first
app.use("/", reviewsRoute);
app.use(express.static(path.join(__dirname, "public")));//this is for express to recognize the public file named index.js inside public folder which you are calling in boilerplate.ejs
//btw here you have yo put the same name as your public folder name, since here the name is 'public' you just put typed public 
app.use(mongoSanitize());//this is to prohibit delicate characters to avoid mongo injection (such as $ or .)

app.get("/", (req, res)=>{
    res.render("home.ejs");
});

app.all("*", (req, res, next) =>{
    
    next(new ErrorClass("PAGE NOT FOUND", 404));//this will only run if nothing else has matched, the order is very important
});


//this is the error handler
app.use((err, req, res, next) => {
    const {status = 501, message, stack} = err;//here you'll get the variable you passed in any of the next functions
    //btw you are also giving them default values
    if(process.env.NODE_ENV !== "production"){
        res.status(status).send(message + " " + stack);//stack tells you where your error is in the code
        //this will be shown everytime a try/catch catches an error because of the func next()
    }else{
        res.status(status).send(message);
    }
});

app.listen(3000, () =>{
    console.log("RUNNING ON PORT 3000");
});