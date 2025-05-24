const express = require('express');
const router = express.Router();

const usermodel = require('./users');    // your user model
const postmodel = require('./post');     // your post model
const passport = require('passport');
const LocalStrategy = require('passport-local');
const upload = require('./multer');


mongoose.connect('mongodb+srv://username:password@cluster.mongodb.net/myDB')


// Passport config
passport.use(new LocalStrategy(usermodel.authenticate()));

router.get('/', (req, res) => {
  res.render('index', { nav: false });
});

router.get('/register', (req, res) => {
  res.render('register', { nav: false });
});

// ✅ PROFILE ROUTE
router.get('/profile', isLoggedIn, async (req, res) => {
  try {
    const user = await usermodel
      .findOne({ username: req.session.passport.user })
      .populate('posts')
      .populate('likedPosts');

    res.render('profile', { user, nav: true, currentPage: 'profile' }); // Pass currentPage
  } catch (err) {
    console.error('Profile load error:', err);
    res.status(500).send('Something went wrong.');
  }
});

router.get('/show/posts', isLoggedIn, async (req, res) => {
  try {
    const user = await usermodel
      .findOne({ username: req.session.passport.user })
      .populate('posts');

    res.render('show', { user, nav: true, currentPage: '' });

  } catch (err) {
    console.error('Show posts error:', err);
    res.status(500).send('Something went wrong.');
  }
});

// ✅ FEED ROUTE
router.get('/feed', isLoggedIn, async (req, res) => {
  try {
    const user = await usermodel.findOne({ username: req.session.passport.user });
    const posts = await postmodel.find().populate('user');

    res.render('feed', { user, posts, nav: true, currentPage: 'feed' }); // Pass currentPage
  } catch (err) {
    console.error('Feed error:', err);
    res.status(500).send('Something went wrong.');
  }
});

router.get('/post/:id', isLoggedIn, async (req, res) => {
  try {
    const post = await postmodel.findById(req.params.id).populate('user');
    const posts = await postmodel.find(); // for background images
    const user = await usermodel
      .findOne({ username: req.session.passport.user })
      .populate('likedPosts');

res.render('postDetail', { post, posts, user, nav: true, currentPage: '' });
  } catch (err) {
    console.error('Post detail error:', err);
    res.status(500).send('Post not found');
  }
});

router.get('/add', isLoggedIn, async (req, res) => {
  try {
    const user = await usermodel.findOne({ username: req.session.passport.user });
    res.render('add', { user, nav: true, currentPage: '' });

  } catch (err) {
    console.error('Add post page error:', err);
    res.status(500).send('Something went wrong.');
  }
});

router.post('/createpost', isLoggedIn, upload.single('postimage'), async (req, res) => {
  try {
    const user = await usermodel.findOne({ username: req.session.passport.user });

    if (!req.file) {
      return res.status(400).send('❌ No file uploaded.');
    }

    const post = await postmodel.create({
      user: user._id,
      title: req.body.title,
      description: req.body.description,
      image: req.file.filename,
    });

    user.posts.push(post._id);
    await user.save();

    res.redirect('/profile');
  } catch (err) {
    console.error('Post creation failed:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/fileupload', isLoggedIn, upload.single('image'), async (req, res) => {
  try {
    const user = await usermodel.findOne({ username: req.session.passport.user });
    user.profileImage = req.file.filename;
    await user.save();
    res.redirect('/profile');
  } catch (err) {
    console.error('Profile image upload error:', err);
    res.status(500).send('Something went wrong.');
  }
});

router.post('/register', (req, res) => {
  const data = new usermodel({
    username: req.body.username,
    contact: req.body.contact,
    name: req.body.fullname,
  });

  usermodel.register(data, req.body.password)
    .then(() => {
      passport.authenticate('local')(req, res, () => {
        res.redirect('/profile');
      });
    })
    .catch(err => {
      console.error('Registration Error:', err);
      res.redirect('/register');
    });
});

router.post('/login', passport.authenticate('local', {
  failureRedirect: '/',
  successRedirect: '/feed',
}));

router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/');
  });
});

router.post('/like/:postId', isLoggedIn, async (req, res) => {
  try {
    const user = await usermodel.findOne({ username: req.session.passport.user });
    const postId = req.params.postId;

    const isLiked = user.likedPosts.includes(postId);

    if (isLiked) {
      user.likedPosts.pull(postId);
    } else {
      user.likedPosts.push(postId);
    }

    await user.save();
    res.redirect('/post/' + postId);
  } catch (err) {
    console.error('Error toggling like:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/show/liked', isLoggedIn, async (req, res) => {
  try {
    const user = await usermodel
      .findOne({ username: req.session.passport.user })
      .populate('likedPosts');

    res.render('liked', { user, nav: true, currentPage: '' });


  } catch (err) {
    console.error('Show liked posts error:', err);
    res.status(500).send('Something went wrong.');
  }
});

// Middleware to check authentication
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}

module.exports = router;
