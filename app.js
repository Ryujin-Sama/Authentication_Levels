
// Requiring Module
// For lvl- 3 Authentication using environment variables
// For lvl -4 Authentication using Hashing with md5
// Lvl-5 Authentication using Hashing and salting with bcrypt

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");
const bcrypt = require("bcrypt");
const saltRounds = 10  // On increasing the no of rounds the cpu usage is higher inorder to generate the hashes

// For Lvl 2 Authentication using Mongoose encryption

//const encrypt = require("mongoose-encryption");


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

// Connecting mongoose

mongoose.connect("mongodb://localhost:27017/userDB");

//Creating Schema

const userSchema = new mongoose.Schema({
  email : String,
  password : String
});

// Mongoose encryption plugin



//Creating ModelDB

const User = new mongoose.model("User", userSchema);


// Get files

app.get("/", function(req,res){
  res.render("home");
});

app.get("/login", function(req,res){
  res.render("login");
});

app.get("/register", function(req,res){
  res.render("register");
});


// Creating Register file

app.post("/register", function(req,res){

  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
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
  });
});

//Creating Login file

app.post("/login", function(req, res){
  const username = req.body.username;
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
});

// Server starting at port 3000

app.listen(3000, function(){
  console.log("Server started on port 3000");
});
