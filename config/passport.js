const passport = require('passport');
const passportLocal = require('passport-local').Strategy;
const User = require('../models/user');

passport.serializeUser(function(user, done) {
    done(null, user._id);
})

passport.deserializeUser(function(id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    })
})

passport.use('local-login', new passportLocal({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, function(req, email, password, done) {
    User.findOne({email: email}, function(err, user) {
        if (err) return done(err);

        if (!user) {
            return done(null, false, req.flash('loginMessage', 'No user has been found'));
        }

        if (!user.comparePassword(password)) {
            return done(null, false, req.flash('loginMessage', '!Ooh Wrong password pal'));
        }
        return done(null, user);
    })
}));

exports.isAuthenticated = function(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.redirect('/login');
    }
}