require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://shubham:Shubham123@cluster0.g28oih5.mongodb.net/spexncilDB?retryWrites=true&w=majority')
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));



var createError = require('http-errors');
var express = require('express');
const path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const expressSession = require("express-session");


var indexRouter = require('../routes/index');
var usersRouter = require('../routes/users');
const passport = require('passport');

var app = express();

// View engine setup
app.set('view engine', 'ejs');

// Serve static files from /public
app.use(express.static(path.join(__dirname, '..', 'public')));
console.log('__dirname:', __dirname);
console.log('Serving static files from:', path.join(__dirname, '..', 'public'));


// Session setup
app.use(expressSession({
  resave: false,
  saveUninitialized: false,
  secret: "hello",
}));

// Passport config
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(usersRouter.serializeUser());
passport.deserializeUser(usersRouter.deserializeUser());

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());




// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);

// Attach user object to res.locals for EJS access
app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});

// Catch 404
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



module.exports = app;
