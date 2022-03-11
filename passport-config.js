// from library - see package.json
const localStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt'); // compare stored pw to entered pw

// separating concerns - calling this function in server.js
function initialize (passport, getUserByEmail, getUserById) {
    const authenticateUser = async (email, password, done) => {
       const user = getUserByEmail(email)
       if(user == null){
           return done(null, false, { message: 'No user with that email' })
       } 
       try {
           if(await bcrypt.compare(passport, user.password)){ // we have an authenticated user
            return done(null, user)
           } else {
            return done(null, false, { message: 'Password incorrect' })
           }
       } catch (e) {
           return done(e)
       }
    }

    // no need to pass in 'password'. Defaults are username and password but we want email and password is already there by default
    passport.use(new localStrategy ({ usernameField: 'email' }, authenticateUser))
    passport.serializeUser((user, done) => done(null,  user.id))
    passport.deserializeUser((id, done) => {
        return done(null,  getUserById(id))
    }) // serializing user as a single ID
}

module.exports = initialize // so I can call it by requiring in our passport-config