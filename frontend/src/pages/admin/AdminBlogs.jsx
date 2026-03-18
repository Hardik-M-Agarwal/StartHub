import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/api';
import BlogCard from '../../components/BlogCard';

const AdminBlogs = () => {
  const { admin_id } = useParams();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'my'

  const currentUser = {
    id: admin_id,
    name: 'Admin User',
    role: 'admin'
  };

  const fetchBlogs = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching blogs for admin:', admin_id);
      
      let blogsData = [];
      let pagesCount = 1;

      if (viewMode === 'my') {
        // Fetch only admin's blogs
        try {
          const res = await api.get(`/user/blogs/${admin_id}?page=${page}&limit=10`);
          console.log('📝 My blogs endpoint response:', res);
          
          if (res.success && Array.isArray(res.blogs)) {
            blogsData = res.blogs;
            pagesCount = res.pagination?.pages || 1;
            console.log('✅ Found my blogs:', blogsData.length);
          }
        } catch (err) {
          console.log('❌ My blogs endpoint failed:', err.message);
        }
      } else {
        // Fetch all blogs (admin can see everything)
        try {
          const res = await api.get(`/blogs?page=${page}&limit=10`);
          console.log('📝 All blogs endpoint response:', res);
          
          if (res.success && Array.isArray(res.blogs)) {
            blogsData = res.blogs;
            pagesCount = res.pagination?.pages || 1;
            console.log('✅ Found all blogs:', blogsData.length);
          }
        } catch (err) {
          console.log('❌ All blogs endpoint failed:', err.message);
        }
      }

      // Add ownership flag for UI differentiation
      blogsData = blogsData.map(blog => ({
        ...blog,
        isOwnedByCurrentUser: blog.authorId === admin_id
      }));

      console.log('🎯 Final blogs data:', blogsData);
      setBlogs(blogsData);
      setTotalPages(pagesCount);
      
    } catch (error) {
      console.error('❌ Error fetching blogs:', error);
      setError('Failed to load blogs. Please try again.');
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs(currentPage);
  }, [currentPage, viewMode]);

  // Handle blog deletion
  const handleBlogDelete = (deletedBlogId) => {
    setBlogs(prevBlogs => prevBlogs.filter(blog => blog._id !== deletedBlogId));
    // Refresh the list to ensure we have the latest data
    fetchBlogs(currentPage);
  };

  // Handle blog update
  const handleBlogUpdate = () => {
    fetchBlogs(currentPage);
  };

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setCurrentPage(1); // Reset to first page when changing view
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Blog Management</h1>
              <p className="text-gray-600">
                Manage and create blog posts for the platform
              </p>
            </div>
            <Link
              to={`/admin/${admin_id}/create-blog`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200 whitespace-nowrap"
            >
              Create New Blog
            </Link>
          </div>

          {/* View Mode Toggle */}
          <div className="mt-4 flex space-x-4">
            <button
              onClick={() => handleViewModeChange('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                viewMode === 'all'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              All Blogs
            </button>
            <button
              onClick={() => handleViewModeChange('my')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                viewMode === 'my'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              My Blogs
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        {!loading && blogs.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <span className="font-medium text-gray-700">Total Blogs:</span>
                <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  {blogs.length}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-700">My Blogs:</span>
                <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  {blogs.filter(blog => blog.isOwnedByCurrentUser).length}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-700">Other Blogs:</span>
                <span className="ml-2 bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                  {blogs.filter(blog => !blog.isOwnedByCurrentUser).length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Blogs List */}
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">
                {viewMode === 'all' ? 'Loading all blogs...' : 'Loading your blogs...'}
              </p>
            </div>
          ) : blogs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {viewMode === 'all' ? 'No blogs found' : 'No blogs created yet'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {viewMode === 'all' 
                  ? 'There are no blogs on the platform yet.' 
                  : 'Get started by creating your first blog post.'
                }
              </p>
              <div className="mt-6">
                <Link
                  to={`/admin/${admin_id}/create-blog`}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                >
                  Create Blog
                </Link>
              </div>
            </div>
          ) : (
            blogs.map(blog => (
              <div key={blog._id || blog.id} className="relative">
                {/* Ownership Badge */}
                {blog.isOwnedByCurrentUser && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                      Your Blog
                    </span>
                  </div>
                )}
                <BlogCard 
                  blog={blog}
                  currentUser={currentUser}
                  onUpdate={handleBlogUpdate}
                  onDelete={handleBlogDelete}
                  showAdminControls={blog.isOwnedByCurrentUser || currentUser.role === 'admin'}
                />
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Previous
            </button>
            
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Next
            </button>
          </div>
        )}

        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Debug Info:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>View Mode: {viewMode}</p>
              <p>Admin ID: {admin_id}</p>
              <p>Blogs Count: {blogs.length}</p>
              <p>My Blogs: {blogs.filter(blog => blog.isOwnedByCurrentUser).length}</p>
              <p>Current Page: {currentPage}</p>
              <p>Total Pages: {totalPages}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBlogs;