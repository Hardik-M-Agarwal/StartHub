import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/api';
import BlogCard from '../../components/BlogCard';

const StartupBlogs = () => {
  const { startup_id } = useParams();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const currentUser = {
    id: startup_id,
    name: 'Startup User',
    role: 'startup'
  };

  const fetchBlogs = async (page = 1) => {
  try {
    setLoading(true);
    const res = await api.get(`/blogs?page=${page}&limit=10`);
    console.log('📝 Blog API Response:', res);
    
    // SIMPLIFIED: Your API returns {success: true, blogs: [], pagination: {}}
    if (res && res.success) {
      setBlogs(res.blogs || []);
      setTotalPages(res.pagination?.pages || 1);
    } else {
      // If structure is different, try to find blogs data
      console.log('📝 Alternative response structure:', res);
      const blogsData = res?.blogs || res?.data?.blogs || res?.data || [];
      setBlogs(Array.isArray(blogsData) ? blogsData : []);
      setTotalPages(res?.pagination?.pages || 1);
    }
  } catch (error) {
    console.error('❌ Error fetching blogs:', error);
    setBlogs([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchBlogs(currentPage);
  }, [currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">Loading blogs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Blogs & Insights</h1>
              <p className="text-gray-600">
                Discover insights and updates from admins and investors
              </p>
            </div>
          </div>
        </div>

        {/* Blogs List */}
        <div className="space-y-6">
          {blogs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No blogs available</h3>
              <p className="mt-1 text-sm text-gray-500">Check back later for new blog posts.</p>
            </div>
          ) : (
            blogs.map(blog => (
              <BlogCard 
                key={blog._id} 
                blog={blog}
                currentUser={currentUser}
                onUpdate={() => fetchBlogs(currentPage)}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StartupBlogs;