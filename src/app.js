const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const flash = require('connect-flash');

const app = express();

mongoose.connect('mongodb://localhost:27017/imageBufferDB')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));


const User = require('../src/models/user'); // ✅ correct path and filename
// ✅ Likely correct if your post logic is a route, not a model:
const Post = require('../routes/post'); // only if you're importing route logic (not schema)

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));


app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'your-secret',
  resave: false,
  saveUninitialized: false,
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  next();
});

// In app.js or server.js
app.use((req, res, next) => {
  res.locals.nav = typeof res.locals.nav !== 'undefined' ? res.locals.nav : true;
  res.locals.currentPage = res.locals.currentPage || '';
  next();
});


const indexRouter = require('../routes/index');
app.use('/', indexRouter); // ✅ correct variable


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
