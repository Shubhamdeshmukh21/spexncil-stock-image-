const express = require('express');
const router = express.Router();
const multer = require('multer');
const passport = require('passport');
const User = require('../src/models/user');
const Post = require('../src/models/post');

// Multer setup to handle in-memory image uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Auth check middleware
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.flash('error', 'You must be logged in.');
  res.redirect('/login');
}

// HOME - Login page if not authenticated
router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/feed');
  } else {
    res.render('index', { nav: false, error: req.flash('error') });
  }
});

// LOGIN PAGE
router.get('/login', (req, res) => {
  res.render('index', {
    nav: false,
    error: req.flash('error'),
    success: req.flash('success')
  });
});

// LOGIN HANDLER (custom callback to preserve flash on failure)
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('error', 'Wrong username or password');
      return res.redirect('/login');
    }
    req.logIn(user, err => {
      if (err) return next(err);
      return res.redirect('/feed');
    });
  })(req, res, next);
});

// REGISTER
router.get('/register', (req, res) => {
  res.render('register', { nav: false, error: req.flash('error') });
});

router.post('/register', async (req, res, next) => {
  try {
    const newUser = new User({
      username: req.body.username,
      name: req.body.fullname,
      contact: req.body.contact,
    });
    const registeredUser = await User.register(newUser, req.body.password);
    req.login(registeredUser, err => {
      if (err) return next(err);
      req.flash('success', 'Welcome!');
      res.redirect('/profile');
    });
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/register');
  }
});

// LOGOUT
router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.flash('success', 'Logged out successfully');
    res.redirect('/');
  });
});

// PROFILE VIEW
router.get('/profile', isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('posts')
      .populate('likedPosts');
    res.render('profile', { user, nav: true, currentPage: 'profile' });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Failed to load profile');
    res.redirect('/');
  }
});

// PROFILE IMAGE UPLOAD
router.post('/fileupload', isLoggedIn, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error', 'No image uploaded');
      return res.redirect('/profile');
    }

    const user = await User.findById(req.user._id);
    user.profileImage.data = req.file.buffer;
    user.profileImage.contentType = req.file.mimetype;
    await user.save();

    req.flash('success', 'Profile image updated!');
    res.redirect('/profile');
  } catch (e) {
    console.error(e);
    req.flash('error', 'Failed to upload image');
    res.redirect('/profile');
  }
});

// FEED - All posts
router.get('/feed', isLoggedIn, async (req, res) => {
  try {
    const posts = await Post.find().populate('user');
    res.render('feed', { user: req.user, posts, nav: true, currentPage: 'feed' });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Failed to load feed');
    res.redirect('/');
  }
});

// ADD POST PAGE
router.get('/add', isLoggedIn, (req, res) => {
  res.render('add', { nav: true, currentPage: 'add' });
});

// CREATE NEW POST
router.post('/createpost', isLoggedIn, upload.single('postimage'), async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error', 'No image uploaded');
      return res.redirect('/add');
    }

    const newPost = new Post({
      user: req.user._id,
      title: req.body.title,
      description: req.body.description,
      image: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      },
    });

    await newPost.save();

    req.user.posts.push(newPost._id);
    await req.user.save();

    req.flash('success', 'Post created!');
    res.redirect('/profile');
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error creating post');
    res.redirect('/add');
  }
});

// GET POST IMAGE
router.get('/image/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post || !post.image.data) {
      return res.status(404).send('Image not found');
    }
    res.contentType(post.image.contentType);
    res.send(post.image.data);
  } catch (e) {
    console.error(e);
    res.status(500).send('Error fetching image');
  }
});

router.get('/post/:id', isLoggedIn, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('user');
    if (!post) return res.status(404).send('Post not found');

    res.render('postDetail', { post, user: req.user, currentPage: 'postDetail' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// LIKE / UNLIKE TOGGLE
router.post('/like/:postId', isLoggedIn, async (req, res) => {
  try {
    const postId = req.params.postId;
    const user = await User.findById(req.user._id);

    const likedIndex = user.likedPosts.findIndex(id => id.equals(postId));

    if (likedIndex !== -1) {
      user.likedPosts.splice(likedIndex, 1);
    } else {
      user.likedPosts.push(postId);
    }

    await user.save();
    res.redirect('/post/' + postId);
  } catch (e) {
    console.error(e);
    res.status(500).send('Error toggling like');
  }
});

router.get('/show/posts', isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('posts');
    res.render('show', { user, nav: true, currentPage: 'profile' });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Failed to load posts');
    res.redirect('/profile');
  }
});

router.get('/show/liked', isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('likedPosts');
    res.render('liked', {
      user,
      nav: true,
      currentPage: 'liked'
    });
  } catch (err) {
    console.error('Error fetching liked posts:', err);
    req.flash('error', 'Failed to load liked posts');
    res.redirect('/profile');
  }
});

// Route to download image
router.get('/image/:id/download', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || !post.image || !post.image.data) {
      return res.status(404).send('Image not found');
    }

    res.set({
      'Content-Type': post.image.contentType,
      'Content-Disposition': `attachment; filename="image_${post._id}.jpg"`
    });

    res.send(post.image.data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
