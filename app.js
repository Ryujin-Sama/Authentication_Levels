
// Requiring Module
// For lvl- 3 Authentication using environment variables
// For lvl -4 Authentication using Hashing with md5
// Lvl-5 Authentication using Hashing and salting with bcrypt
// Lvl-6 Authentication using Passport.js & Express-Session


require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

//const bcrypt = require("bcrypt");
//const saltRounds = 10  // On increasing the no of rounds the cpu usage is higher inorder to generate the hashes

// For Lvl 2 Authentication using Mongoose encryption

//const encrypt = require("mongoose-encryption");


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

// Using Express-Session package with some default configs

app.use(session({
  secret : "Our Little secrets.",
  resave : false,
  saveUninitialized: false
}));

// Using Passport Package

app.use(passport.initialize());
app.use(passport.session());

// Connecting mongoose

mongoose.connect("mongodb://localhost:27017/userDB");

//Creating Schema

const userSchema = new mongoose.Schema({
  email : String,
  password : String,
  googleId : String,
  secret : String
});

// Passport plugin

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//Creating ModelDB

const User = new mongoose.model("User", userSchema);


passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  User.findById(id, function(err, user) {
    cb(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRETS,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// Get files

app.get("/", function(req,res){
  res.render("home");
});

app.route('/auth/google')
  .get(passport.authenticate('google', {
    scope: ['profile']
  }));
app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

app.get("/login", function(req,res){
  res.render("login");
});

app.get("/register", function(req,res){
  res.render("register");
});

// Adding SECRET page to work only when passwords are matching

app.get("/secrets", function(req,res){
  User.find({"secret" : {$ne : null}}, function(err, foundUser){
    if(err){
      console.log(err);
    }
    else{
      if(foundUser){
        res.render("secrets", {userswithSecrets : foundUser});
      }
    }
  });
});

app.get("/submit", function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  }
  else{
    res.render("login");
  }
});

app.post("/submit", function(req,res){
  const submitted = req.body.secret;
  User.findById(req.user.id, function(err, foundUser){
    if(err){
      console.log(err);
    }
    else{
      if(foundUser){
        foundUser.secret = submitted;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });

});

// Redirecting user to login Page once they Logout

app.get("/logout", function(req,res, next){
  req.logout(function(err){
    if(err){
      return next(err);
    }
    res.redirect("/");
  });

});

// Creating Register file

app.post("/register", function(req,res){

  /*bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    const newUser = new User({
      email : req.body.username,
      password : hash  //md5(req.body.password)  // using md5 for Hashing
    });
    newUser.save(function(err){
      if(!err){
        res.render("secrets");
      }
      else{
        console.log(err);
      }
    });
  });*/


// New Register Code Using Passport

  User.register({username : req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }
    else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });

});

//Creating Login file

app.post("/login", function(req, res){
  /* const username = req.body.username;
  const password =  req.body.password; //md5(req.body.password);  //using md5 for Hashing

  User.findOne({email: username}, function(err, foundUser){
    if(!err){
      if(foundUser){
        bcrypt.compare(password, foundUser.password, function(err, result) {
            if(result == true){
              res.render("secrets");
            }
        });
      }
    }
    else{
      console.log(err);
    }
  });
  */

// New Login Code using Passport


  const user = new User({
    username : req.body.username,
    password : req.body.password
  });

  req.login(user, function(err){
    if(err){
      console.log(err);
    }
    else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });

});

// Server starting at port 3000

app.listen(3000, function(){
  console.log("Server started on port 3000");
});
