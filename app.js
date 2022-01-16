//jshint esversion:6
const dotenv = require('dotenv');
dotenv.config();

const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const encrypt = require("mongoose-encryption");


const app = express();

app.set('view engine','ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});


userSchema.plugin(encrypt, { secret: process.env.SECRET ,encryptedFields: ["password"]} );

const User = mongoose.model("User",userSchema);







app.get("/",function(req,res){
    res.render("home");
})

app.get("/register",function (req,res) {
    res.render("register");
})

app.get("/login",function (req,res) {
    res.render("login");
})





app.post("/register",function (req,res) {
    
    const email = req.body.email;
    const password = req.body.password;

    const newUser = new User ({email: email, password: password});
    newUser.save(function (err) {
        if(err){
            console.log(err);
        }else{
            res.render("secrets");
        }
    });

});

app.post("/login",function (req,res) {
    
    const email = req.body.email;
    const password = req.body.password;

    User.findOne({email: email},function (err,foundUser) {
        if(!err){
            if(foundUser){
                if(foundUser.password === password){
                    res.render("secrets");
                }else{
                    res.send("Wrong Password")
                }
                
            }else{
                res.send("User doesn't exist");
            }
        }else{
            console.log(err);
        }
    });
});












app.listen(3000,function(req,res){
    console.log("Server started at port 3000");
})