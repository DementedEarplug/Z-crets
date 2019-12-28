
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const encrypt = require('mongoose-encryption')

// App config
app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))
app.set('view engine', 'ejs')

// DB config
mongoose.connect('mongodb://localhost:27017/zcretsDB', {useNewUrlParser: true, useUnifiedTopology: true})

// Schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

// Setup encryption
const secret = 'SomeSuperLongSecretFoo'
userSchema.plugin(encrypt,{secret: secret, encryptedFields: ['password']})

// Model
const User = mongoose.model('User', userSchema)

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
    const email = req.body.username
    const password = req.body.password

    User.findOne({email: email},(err, foundUser)=>{
        if(!err){
            if(foundUser.password === password)
            {
                res.render('secrets')
            }else{
                console.log("Inccorrect email or password.")
                res.redirect("/login")
            }
        }else{
            console.log(err)
        }
    })
})

// Register route
app.get("/register", (req, res)=>{
    
    res.render("register")
})

app.post("/register",(req,res)=>{
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    })

    newUser.save((err)=>{
        if(!err){
            res.render('secrets')
        }
        else{
            console.log(err)
        }
    })

})

// LogoutRoute
app.get("/logout", (req,res)=>{
    res.render('home')
})