const router = require('express').Router();
const async = require('async');
const User = require('../models/user');
const passport = require('passport');
const passportConf = require('../config/passport');

router.get('/login', (req, res, next) => {
    if (req.user) res.redirect('/');
    res.render('accounts/login', {
        message: req.flash('loginMessage')
    })
});

router.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
}));

router.get('/profile', (req, res, next) => {
    User.findOne({_id: req.user._id}, function (err, user) {
        if (err) return next(err);
        res.render('accounts/profile', {user: user})
    })
})

router.get('/signup', (req, res, next) => {
    res.render('accounts/signup', {
        errors: req.flash('errors')
    });
})
router.post('/signup', function (req, res, next) {
    async.waterfall([function(callback) {
        var user = new User();

        user.profile.name = req.body.name;
        user.email = req.body.email;
        user.password = req.body.password;
        user.profile.picture = user.gravatar();

        User.findOne({email: req.body.email}, function (err, exitsUser) {
            if (exitsUser) {
                req.flash('errors', 'Account with that email adress already exists');
                // console.log('Email ' + req.body.email + ' is already exist');
                return res.redirect('/signup');
            } else {
                user.save(function (err) {
                    if (err) next(err);
                    // res.json('Successfully created new user');
                    req.logIn(user, function(err) {
                        if (err) next(err);
                        res.redirect('/profile');
                    })

                })
            }
        })
    }, function(user) {

    }], function(err) {

    })

});

function saveUser(req, res, next) {
    return new Promise()
}
router.get('/logout', (req, res, next) => {
    req.logout();
    res.redirect('/');
});

router.get('/edit-profile', function(req, res, next) {
    res.render('accounts/edit-profile', {message: req.flash('success'), });
});

router.post('/edit-profile', function(req, res, next) {
    User.findOne({_id: req.user._id}, function(err, user) {
        if (err) next(err);
        if (req.body.name) user.profile.name = req.body.name;
        if (req.body.address) user.address = req.body.address;

        user.save(function(err) {
            if (err) next(err);
            req.flash('success', 'Successfully Edited your profile');
            res.redirect('/edit-profile');
        })
    })
})

module.exports = router;