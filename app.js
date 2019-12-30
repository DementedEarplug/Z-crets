
require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const findOrCreate = require('mongoose-findorcreate')

// App config
app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))
app.set('view engine', 'ejs')
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}))

// Initialize passport and use passport to deal with sessions
app.use(passport.initialize())
app.use(passport.session())

// DB config
mongoose.connect('mongodb://localhost:27017/zcretsDB', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})

// Schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String,
})

// Add passport local mongoose plugin for password hashing/salting
userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

// Model
const User = mongoose.model('User', userSchema)

// Passport local config
passport.use(User.createStrategy())
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
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// App listen
app.listen(3000, () => {
    console.log("Server started on port 3000...")
})

// Home route
app.get("/", (req, res)=>{
    res.render("home")
})

// Login route
app.get("/login", (req, res)=>{
    res.render("login")
})

app.post("/login",(req,res)=>{
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, (err)=>{
        if(!err){
            passport.authenticate('local')(req,res,()=>{
                res.redirect('/secrets')
            })
        }else{
            console.log(err)
            res.redirect('/login')
        }
    })
})

// Register route
app.get("/register", (req, res)=>{
    
    res.render("register")
})

app.post("/register",(req,res)=>{
    User.register({username: req.body.username}, req.body.password,(err, user)=>{
        if(!err){
            passport.authenticate('local')(req,res,()=>{
                res.redirect('/secrets')
            })
        }else{
            console.log(err)
            res.redirect('/register')
        }
    })
})

// LogoutRoute
app.get("/logout", (req,res)=>{
    req.logout()
    res.redirect('/')
})

// Secrets route
app.get('/secrets',(req,res)=>{
   User.find({secret: {$ne: null}},(err, foundSecrets)=>{
       if(err){
           console.log(err)
       }else{
           res.render("secrets", { secrets:foundSecrets})
       }
   })
})

// Oauth google route
app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);


app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });

//   Sumbit secret route
app.get("/submit",(req,res)=>{
    // Check is user is logged in and authenticated
    if(req.isAuthenticated()){
        res.render('submit')
    } else {
        res.redirect('/login')
    }
})

//   Sumbit secret route
app.post("/submit",(req,res)=>{
    const newSecret = req.body.secret
    console.log(req.user)
    User.findById(req.user._id,(err, foundUser)=>{
        if(!err){
            foundUser.secret= newSecret
            foundUser.save(()=>{
                res.redirect('/secrets')
            })
        }else{
            console.log(err)
        }
    })
})