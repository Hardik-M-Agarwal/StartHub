const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/authMiddleware'); // ADD THIS

// Public routes
router.get('/blogs', blogController.getAllBlogs);
router.get('/blogs/:id', blogController.getBlog);
router.get('/user/blogs/:authorId', blogController.getUserBlogs);

// Blog actions - ADD AUTHENTICATION
router.post('/blogs', protect, authorize('admin', 'investor'), upload.array('media', 5), blogController.createBlog);
router.post('/blogs/:id/like', protect, blogController.toggleLike);
router.post('/blogs/:id/comment', protect, blogController.addComment);
router.delete('/blogs/:id/comment/:commentId', protect, blogController.deleteComment);
router.delete('/blogs/:id', protect, blogController.deleteBlog);

module.exports = router;