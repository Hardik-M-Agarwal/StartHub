const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    enum: ['admin', 'startup', 'investor'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    authorName: {
      type: String,
      required: true
    },
    authorRole: {
      type: String,
      enum: ['admin', 'investor'],
      required: true
    },
    authorId: {
      type: String,
      required: true
    },
    media: [{
      type: String, // URL to uploaded file
      required: false
    }],
    mediaType: {
      type: String,
      enum: ['image', 'video', 'none'],
      default: 'none'
    },
    likes: [{
      userName: String,
      userRole: String,
      userId: String
    }],
    comments: [commentSchema],
    tags: [String],
    isPublished: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Blog', blogSchema);