const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const flash = require('connect-flash');
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables

const app = express(); // Initialize express app

// Get MongoDB URI from environment variables
const mongoURI = process.env.MONGODB_URI;

// Validate MongoDB URI format
if (!mongoURI || (!mongoURI.startsWith('mongodb://') && !mongoURI.startsWith('mongodb+srv://'))) {
  console.error("❌ Invalid or missing MongoDB URI. Please check your .env or Render environment variable.");
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Import User model
const User = require('../src/models/user'); // Adjust path if needed

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Body parser middleware
app.use(express.urlencoded({ extended: true }));

// Express session middleware
app.use(session({
  secret: 'your-secret', // Replace with a secure value or environment variable
  resave: false,
  saveUninitialized: false,
}));

// Flash messages middleware
app.use(flash());

// Initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Global variables for views
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  res.locals.nav = res.locals.nav !== undefined ? res.locals.nav : true;
  res.locals.currentPage = res.locals.currentPage || '';
  next();
});

// Routes
const indexRouter = require('../routes/index');
app.use('/', indexRouter);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
