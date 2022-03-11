//load in environment variables
if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}


// basic server set up
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');

// calling from passport-config to separate concerns
const initializePassport = require('./passport-config')
initializePassport(
    passport, 
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
) // find user based on email

const users = [] //local variable. Usually you'd use a real database. 

// telling the server that we are  using ejs - see dependency 
app.set('view-engine', 'ejs')
//tell the server we are getting info from a form. We want to be able to access the information from the forms inside our "request" variable inside our POST method.
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false, //should we resave session variables if nothing has changed? No
    saveUninitialized: false // do you want to save an empty value if there is no value? No
}))
app.use(passport.initialize()) // function inside passport to set up basics
app.use(passport.session()) // we want to store variables accorss sessions
app.use(methodOverride('_method'))

// setting up homepage route , must be logged in to get access
app.get('/', checkAuthenticated, (req, res) => {
    // render a file at this source. Stored in index.ejs (views) 
    res.render('index.ejs', { name: req.user.name })
});

//setting routes for pages in views: login and register
app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
})

// post method for login
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failRedirect: '/login',
    failureFlash: true // will display password/email incorrect message as defined at initilized function in passport-config
}))

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs')
})
//post method for register
app.post('/register', checkNotAuthenticated, async (req, res) => {
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 10) // whatever comes after body is accessing that name on the form in register.ejs
        users.push({
            id:Date.now().toString(), //unique identifyer. When using DB this is automatically generated for us
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        })
        res.redirect('/login')
    } catch {
        res.redirect('/register')
    }
    console.log(users) // this resets everytime because I am not connected to a DB. Just in memory
})


// delete request. Using method-override call delete over POST
app.delete('/logout'), (req, res) =>{
    req.logOut()
    res.redirect('/login')
}

function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next()
    }

    res.redirect('/login'); //if not authenticated redirect to log in page
}

function checkNotAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return res.redirect('/')
    }
    next()
}
// app running on port 3000
app.listen(3000);

