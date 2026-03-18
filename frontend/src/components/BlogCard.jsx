import React, { useState } from 'react';
import { api } from '../api/api';

const BlogCard = ({ blog, currentUser, onUpdate }) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const isLiked = blog.likes.some(like => like.userId === currentUser?.id);

  const handleLike = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      await api.post(`/blogs/${blog._id}/like`, {
        userName: currentUser.name,
        userRole: currentUser.role,
        userId: currentUser.id
      });
      onUpdate();
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setLoading(true);
    try {
      await api.post(`/blogs/${blog._id}/comment`, {
        text: newComment,
        userName: currentUser.name,
        userRole: currentUser.role,
        userId: currentUser.id
      });
      setNewComment('');
      onUpdate();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!currentUser) return;

    setLoading(true);
    try {
      await api.delete(`/blogs/${blog._id}/comment/${commentId}`, {
        data: {
          userId: currentUser.id,
          userRole: currentUser.role,
          userName: currentUser.name 
        }
      });
      onUpdate();
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlog = async () => {
    if (!currentUser || currentUser.id !== blog.authorId) return;

    if (!window.confirm('Are you sure you want to delete this blog?')) return;

    setLoading(true);
    try {
      await api.delete(`/blogs/${blog._id}`, {
        data: { authorId: blog.authorId }
      });
      onUpdate();
    } catch (error) {
      console.error('Error deleting blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      {/* Blog Header */}
      <div className="mb-4">
        <div className="flex justify-between items-start">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{blog.title}</h2>
          {currentUser && currentUser.id === blog.authorId && (
            <button
              onClick={handleDeleteBlog}
              disabled={loading}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Delete
            </button>
          )}
        </div>
        <div className="flex items-center text-gray-600 text-sm">
          <span>By {blog.authorName} ({blog.authorRole})</span>
          <span className="mx-2">•</span>
          <span>{formatDate(blog.createdAt)}</span>
          {blog.tags.length > 0 && (
            <>
              <span className="mx-2">•</span>
              <div className="flex flex-wrap gap-1">
                {blog.tags.map(tag => (
                  <span key={tag} className="bg-gray-100 px-2 py-1 rounded text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Blog Content */}
      <div className="prose max-w-none mb-4">
        <p className="text-gray-700 whitespace-pre-wrap">{blog.content}</p>
      </div>

      {/* Media Display */}
      {blog.media && blog.media.length > 0 && (
        <div className="mb-4">
          {blog.media.map((mediaUrl, index) => (
            <div key={index} className="mb-2">
              {blog.mediaType === 'image' ? (
                <img 
                  src={`http://localhost:5001${mediaUrl}`} 
                  alt={`Blog media ${index + 1}`}
                  className="max-w-full h-auto rounded-lg"
                />
              ) : (
                <video 
                  controls 
                  className="max-w-full h-auto rounded-lg"
                >
                  <source src={`http://localhost:5001${mediaUrl}`} />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            disabled={loading || !currentUser}
            className={`flex items-center space-x-1 ${
              isLiked ? 'text-red-500' : 'text-gray-500'
            } ${!currentUser ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-600'}`}
          >
            <span>❤️</span>
            <span>{blog.likes.length} Likes</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1 text-gray-500 hover:text-blue-600"
          >
            <span>💬</span>
            <span>{blog.comments.length} Comments</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          {/* Add Comment Form */}
          {currentUser && (
            <form onSubmit={handleAddComment} className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !newComment.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Post
                </button>
              </div>
            </form>
          )}

          {/* Comments List */}
          <div className="space-y-3">
            {blog.comments.map(comment => (
              <div key={comment._id} className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {comment.userName}
                    </span>
                    <span className="text-gray-500 text-sm">
                      ({comment.userRole})
                    </span>
                    <span className="text-gray-500 text-sm">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-700 mt-1">{comment.text}</p>
                </div>
                
                {/* Delete comment button */}
                {currentUser && (
                  comment.userId === currentUser.id || 
                  blog.authorId === currentUser.id
                ) && (
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogCard;