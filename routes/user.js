const router = require('express').Router();
const async = require('async');
const nodemailer = require('nodemailer');
const User = require('../models/user');
const Cart = require('../models/cart');
const passport = require('passport');
const passportConf = require('../config/passport');


const transporter = nodemailer.createTransport({
    service: 'SendGrid',
    auth: {
        user: process.env.SENDGRID_USER,
        pass: process.env.SENDGRID_PASSWORD
    }
})
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

router.get('/profile', passportConf.isAuthenticated, (req, res, next) => {
    User.findOne({_id: req.user._id})
        .populate('history.item')
        .exec(function(err, foundUser) {
            if (err) return next(err);

            res.render('accounts/profile', { user: foundUser})
    });
});

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

        User.findOne({email: req.body.email}, function (err, exsitingUser) {
            if (exsitingUser) {
                req.flash('errors', 'Account with that email adress already exists');
                // console.log('Email ' + req.body.email + ' is already exist');
                return res.redirect('/signup');
            } else {
                user.save(function (err, user) {
                    if (err) next(err);
                    callback(null, user);
                })
            }
        })
    }, function(user) {
        var cart = new Cart();
        cart.owner = user._id;
        cart.save(function(err) {
            if (err) return next(err);
            req.logIn(user, function(err) {
                if (err) return next(err);
                res.redirect('/profile');
            })
        })
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


router.get('/forgot', function(req, res, next) {
    res.render('accounts/forgot');
});

router.post('/forgot', function(req, res, next) {
    async.waterfall([
        function createRandomToken(done) {
            crypto.randomBytes(16, (err, buf) => {
                const token = buf.toString('hex');
                done(err, token);
            })
        }, function setRandomToken(token, done) {
            User.findOne({ email: req.body.email}, (err, user) => {
                if (err) return done(err);
                if (!user) {
                    req.flash('errors', { msg: 'Account with that emails address does not  exist. '});
                    res.redirect('/forgot');
                }
                user.passwordResetToken = token;
                user.passwordResetExpires = Date.now + 3600;
                user.save((err) => {
                  done(err, token, user);
                })
            })
        }, function sendFogotPasswordEmail(token, user, done) {
            const transporter = nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USER,
                    pass: process.env.SENDGRID_PASSWORD
                }
            });

            const mailOptions = {
                to: user.email,
                from: 'truonglee.uet@gmail.com',
                subject: 'Reset your password on ...',
                text: `You are receiving this email because you ( or someone else) have requested the reset of the password for ypur account. \n\n
                    Please click on the following link, or paste this into your browser to complete the process. \n\n 
                    http://${ req.headers.host}/reset/${token} \n\n
                    If you did not request this, please ignore this email and your password will remain unchanged .\n`
            };
            transporter.sendMail(mailOptions, (err) => {
                req.flash('info', { msg: `An e-mail has been sent to ${user.email} with further instructions,` });
                done(err)
            })
        }
    ], (err) => {
        if (err) { return next(err); }
        res.redirect('/forgot');
    })
})
module.exports = router;