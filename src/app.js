const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const flash = require('connect-flash');
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables

const app = express(); // Initialize express app

// Debug log to check MONGODB_URI
console.log("Mongo URI:", process.env.MONGODB_URI);

// Connect to MongoDB using environment variable
const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Import Mongoose models and routes
const User = require('../src/models/user'); // Make sure path is correct
// DO NOT import post routes here unless needed directly
// const Post = require('../routes/post'); // Optional - usually used in route file

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// Static files
app.use(express.static(path.join(__dirname, '..', 'public'))); // Ensure '..' because you're inside /src

// Middleware
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'your-secret', // Change this to a secure value
  resave: false,
  saveUninitialized: false,
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Passport config
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Custom middleware for flash messages and user info
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  res.locals.nav = typeof res.locals.nav !== 'undefined' ? res.locals.nav : true;
  res.locals.currentPage = res.locals.currentPage || '';
  next();
});

// Routes
const indexRouter = require('../routes/index'); // Main route file
app.use('/', indexRouter);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
