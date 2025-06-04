const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
require('dotenv').config();

const app = express();

// MongoDB URI from environment
const mongoURI = process.env.MONGODB_URI;

// Validate MongoDB URI presence and format
if (!mongoURI || (!mongoURI.startsWith('mongodb://') && !mongoURI.startsWith('mongodb+srv://'))) {
  console.error("❌ Invalid or missing MongoDB URI in .env");
  process.exit(1);
}

// Connect to MongoDB with Mongoose
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Import User model after connection
const User = require('../src/models/user');

// Set view engine to EJS and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, '..', 'public')));

// Parse URL-encoded bodies (form data)
app.use(express.urlencoded({ extended: true }));

// Session middleware with MongoDB store
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoURI,
    // Optional: Add TTL or other config if needed
    // ttl: 14 * 24 * 60 * 60 // 14 days
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days cookie lifetime (optional)
  }
}));

// Flash messages middleware
app.use(flash());

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Passport local strategy setup using User model methods (passport-local-mongoose)
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware to set locals for all views
app.use((req, res, next) => {
  res.locals.currentUser = req.user || null;
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  // Default navigation flag - override in route if needed
  res.locals.nav = res.locals.nav !== undefined ? res.locals.nav : true;
  res.locals.currentPage = res.locals.currentPage || '';
  next();
});

// Import and use routes
const indexRouter = require('../routes/index');
app.use('/', indexRouter);

// 404 handler (optional)
app.use((req, res) => {
  res.status(404).render('404', { nav: true, currentPage: '404' });
});

// Global error handler (optional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  req.flash('error', 'Something went wrong!');
  res.status(500).redirect('/');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
