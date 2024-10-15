const express = require("express");
const userModel = require("../models/user");
const router = express.Router();
const passport = require("passport");
const {storeReturnTo} = require("../middleware");

router.route("/register")
.get(
    (req, res)=>{
    res.render("users/register.ejs");
})
.post(
    async (req, res, next)=>{
    try{
        const {email, username, password} = req.body;
        const newUser = new userModel({email, username});
        const registered = await userModel.register(newUser, password);//(user instance, password) so it can hash the password
        req.login(registered, err => {//here we are logging the user manually with req.login()
            //basically we are storing the user data in a localstorage, passport does this automatically with passport.authenticate but we are not calling it here
            if(err){
                return next(err);
            }
            req.flash("success","welcome to Aventurate!");
            res.redirect("/campgrounds");
        });
        
    }catch(err){
        req.flash("error", err.message);
        res.redirect("/register");
        //next(err) this works too but it looks better with the flash message
        //this would take you to a blank page with just the message on a corner 
    }
});

router.route("/login")
.get(
    (req, res)=>{
    res.render("users/login.ejs");
})
//passport has its own integrated middleware
//here is atomatically hashing the password and comparing it with the original
//its also validating that there isnt any repeated data
//you practiced this step by step without using passport in your AuthHash project
//btw here it stores data in session (like localstorage) so it simulates that you are logged in
.post(storeReturnTo , passport.authenticate("local", {failureFlash: true, failureRedirect: "/login"}), 
async (req, res)=>{
    req.flash("success", "welcome back!");
    const redirectUrl = res.locals.returnTo || "/campgrounds";//here we used to use sessions instead of locals but passport now clears sessions everytime you log in
    delete req.session.returnTo;//we delete whatever was in the returnTo variable, yeap weird sintax
    res.redirect(redirectUrl);
})
 



router.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Goodbye!');
        res.redirect('/campgrounds');
    });
}); 

module.exports = router;