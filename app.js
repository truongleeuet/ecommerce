const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const engine = require('ejs-mate');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const mongoStore = require('connect-mongo/es5')(session);
const User = require('./models/user');
const app = express();
const mainRoute = require('./routes/main');
const userRoute = require('./routes/user');
const secret = require('./config/secret');

mongoose.connect(secret.database, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log('Connected to the database');
    }

});
console.log(__dirname + '/public');
app.use('/public', express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: secret.secretKey,
    store: new mongoStore({url: secret.database, autoReconnect: true})
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next) {
    res.locals.user = req.user;
    next();
})
app.engine('ejs', engine);
app.set('view engine', 'ejs');

app.use(mainRoute);
app.use(userRoute);


app.listen(secret.port, (err) => {
    console.log('Server listening port ', secret.port);
});