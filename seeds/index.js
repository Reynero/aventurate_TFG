const cities = require("./cities");
const { default: mongoose } = require("mongoose");
const campground = require("../models/campground");
const {places, descriptors} = require("./seedHelpers");

mongoose.connect("mongodb://localhost:27017/aventurate")
.then(()=>{
    console.log("DATBASE CONNECTED!");
})
.catch((err)=>{
    console.error("Connection error: " + err);
});

const sample = (array) => array[Math.floor(Math.random() * 5)]; 

const seedDb = async () => {
    
    await campground.deleteMany({});
    for(let i = 0;i<50; i++){
        const random1000 = Math.floor(Math.random() * 1000);
        const newC = new campground({
            author: '66848e8f34abea2a55f05e63',
            title: `${sample(descriptors)} ${sample(places)}`,
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            geometry:{
                type: "Point",
                coordinates: [cities[random1000].longitude, cities[random1000].latitude]
            },
            images: [
                {
                    
                    url: 'https://res.cloudinary.com/do6jumhzx/image/upload/v1720471413/cld-sample-2.jpg',
                    filename: 'aventurate/qlhqipmumjsfmddeg9st'
                },
                {
                
                    url: 'https://res.cloudinary.com/do6jumhzx/image/upload/v1720471413/cld-sample-2.jpg',
                    filename: 'aventurate/aesbkomykw5ynahlycmf'
                }
            ],
            description: "Generic Description",
            price: 45
        });
        await newC.save();
    }
    
}

seedDb().then(()=>{
    mongoose.connection.close();
});