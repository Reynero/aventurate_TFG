const campgroundModel = require("./models/campground");
const reviewModel = require("./models/review");

const puppeteer = require("puppeteer");

const getPipeline = async () => {//HERE FINALLY A SOLUTION WHEN USING REQUIRE AND IMPORT!!!!!!!!!!!!!!!!
    const { pipeline } = await import('@xenova/transformers');
    return pipeline("sentiment-analysis", 'Xenova/bert-base-multilingual-uncased-sentiment');
  };

module.exports.isLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()){//this is another integrated function of passport
        //basically it makes sure there is data in session (like localstorage)
        req.session.returnTo = req.originalUrl;//req.original gets the complete Url in which you were before
        req.flash("error", "you must be signed in!");
        
        return res.redirect("/login");
    }
    next();
}
//IN THE NEWEST VERSION OF PASSPORT IT CLEARS ALL THE DATA ONCE IT COMPARES THE DATA WHEN YOU ARE LOGGING IN
//THIS IS WHY YOU COULDNT ENTER TO SOME ADDRESS BECAUSE THE DATA WAS BEING ERASED
/**By using the storeReturnTo middleware function, we can save the returnTo value to res.locals 
 * before passport.authenticate() clears the session and deletes req.session.returnTo. */
module.exports.storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }
    next();
}


//middleware that verifies that the currentuser is equal to campground's user
//so only the camp's user can edit and delete it  
module.exports.isAuthor = async (req, res, next) =>{
    const {id} = req.params;
    const userFound = await campgroundModel.findById(id);
    //console.log(idFound.author._id + " " + req.user._id);
    if(!userFound.author.equals(req.user._id)){// i dunno why it only works with equals and not ===
        req.flash("error", "you dont have permission to do that!");
        return res.redirect("/campgrounds/"+id);
    }
    next();
}

module.exports.isReviewAuthor = async (req, res, next) =>{
    const {id, reviewId} = req.params;
    const userFound = await reviewModel.findById(reviewId);
    //console.log(idFound.author._id + " " + req.user._id);
    if(!userFound.author.equals(req.user._id)){// i dunno why it only works with equals and not ===
        req.flash("error", "you dont have permission to do that!");
        return res.redirect("/campgrounds/"+id);
    }
    next();
}

module.exports.sentiAnalysis = async (reviews) => {
    if(reviews === null || reviews === undefined){
        return "1 star";
    }
    const pipe = await getPipeline();
    const result = await pipe(reviews);//this return [{label, score}}]
    console.log(result[0].label);
    return result[0].label;
}

module.exports.scrape = async (url)=>{
    const browser = await puppeteer.launch({
        executablePath: await puppeteer.executablePath(),    
        headless: "new"//this config makes sure to do everything as a background process
    });
    const googleFormatUrl = url.split(' ').join('+');//you need to replace all the spaces with a +
    const page = await browser.newPage();//this opens a new instance in the browser
    //await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36');
    //the code from above may solve some blocking problems from webpages
    page.setDefaultNavigationTimeout(90000);
    
    
    try {
        
        await page.goto(`https://www.google.com/maps/search/${googleFormatUrl}`);
        
        //const content = await page.content();
        //console.log(content); run this code to debug
        
        
        // this only extracts the first html elements of its kind
        const firstElement = await page.$('div.Nv2PK a.hfpxzc');
        if(firstElement){
            await firstElement.click();
        }
        
        
        await page.screenshot({path:"examp.png"});//apparently this has to go before evaluate so you can retrieve the data
        
        await page.waitForSelector('.MyEned', {timeout:60000});
        const result = await page.evaluate(() => {
            let elements = [];
            document.querySelectorAll(".MyEned span:nth-child(1)").forEach((e) => {//span[class='review-snippet'] previous html attribute
                elements.push(e.textContent);
            });
            return elements;
        });
        console.log(result);
        return result;
    } catch (error) {
        console.error('Error scraping reviews:', error);
        return ["Try Again"];
    } finally {
        await browser.close();//this will run regardless an error ocurred or not
    }
   
}