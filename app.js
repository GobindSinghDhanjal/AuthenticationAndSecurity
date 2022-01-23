//jshint esversion:6
const dotenv = require('dotenv');
dotenv.config();

const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const { redirect } = require('express/lib/response');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');





const app = express();

app.set('view engine','ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret: 'This is a secret',
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    googleId: String
});

userSchema.plugin(findOrCreate);
userSchema.plugin(passportLocalMongoose, {usernameField : "email"});


const User = mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
});


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));










app.get("/",function(req,res){
    res.render("home");
});



app.get('/auth/google',
    passport.authenticate("google", { scope: ["profile"] })
);

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
});






app.get("/register",function (req,res) {
    res.render("register");
});

app.get("/login",function (req,res) {
    res.render("login");
});

app.get("/secrets",function (req,res) {
    if (req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
});

app.get("/logout",function (req,res) {

    req.logout();
    res.redirect("/");
});





app.post("/register",function (req,res) {

    User.register({email: req.body.email}, req.body.password, function (err,user) {
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            
            passport.authenticate("local")(req,res,function () {
                res.redirect("/secrets");
            });
        }
    });
});

app.post("/login",function (req,res) {

    const user = new User({
        email: req.body.email,
        password: req.body.password
    });

    req.login(user,function (err) {

        if(err){
            console.log(err);
            res.redirect("/");
        }else{
            console.log("running");
            passport.authenticate("local")(req,res,function (err) {
                console.log(err);
                res.redirect("/secrets");
            });
        }
    })

});












app.listen(3000,function(req,res){
    console.log("Server started at port 3000");
})