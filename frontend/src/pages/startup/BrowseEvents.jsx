import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/api';

const BrowseEvents = () => {
  const { startup_id } = useParams();
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch user data - Based on your console log, it returns user object directly
      const userRes = await api.get(`/users/${startup_id}`);
      console.log('👤 User API Response:', userRes);
      
      // Your user API returns the user object directly, not wrapped in success/data
      setUser(userRes || {});

      // Fetch events data - Based on your console log, it returns array directly
      const eventsRes = await api.get('/events');
      console.log('📅 Events API Response:', eventsRes);
      
      // Your events API returns the array directly
      setEvents(Array.isArray(eventsRes) ? eventsRes : []);
      
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setUser({});
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startup_id]);

  const handleBook = async (eventId) => {
    try {
      await api.post('/bookings', { userId: startup_id, eventId });
      alert('Booking confirmed! Check your email.');
      setEvents(events.map(e => e._id === eventId ? {...e, bookedSlots: e.bookedSlots + 1} : e));
    } catch (err) {
      alert(err.response?.data?.error || 'Booking failed');
    }
  };

  const getTypeStyles = (eventType) => {
    const styles = {
      Funding: 'bg-green-100 text-green-800 border-green-200',
      Pitching: 'bg-blue-100 text-blue-800 border-blue-200',
      Networking: 'bg-purple-100 text-purple-800 border-purple-200',
      Fair: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return styles[eventType] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateString, timeString) => {
    const eventDate = new Date(dateString);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    return `${formattedDate} at ${timeString}`;
  };

  const getAvailabilityStatus = (booked, total) => {
    const remaining = total - booked;
    const percentage = (booked / total) * 100;
    
    if (remaining === 0) {
      return { text: 'Event Full', color: 'text-red-600', bgColor: 'bg-red-50' };
    } else if (percentage >= 80) {
      return { text: `${remaining} spots left`, color: 'text-orange-600', bgColor: 'bg-orange-50' };
    } else {
      return { text: `${remaining} available`, color: 'text-green-600', bgColor: 'bg-green-50' };
    }
  };

  const getButtonState = (event) => {
    const isFull = event.bookedSlots >= event.totalSlots;
    
    // Check subscription status - your user object has subscription data
    const isSubscribed = user?.subscription?.status === 'active'; // Adjust based on your subscription structure
    
    if (!isSubscribed) {
      return {
        text: 'Subscription Required',
        disabled: true,
        className: 'bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed'
      };
    } else if (isFull) {
      return {
        text: 'Event Full',
        disabled: true,
        className: 'bg-red-100 text-red-600 border border-red-300 cursor-not-allowed'
      };
    } else {
      return {
        text: 'Book Now',
        disabled: false,
        className: 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 hover:border-blue-700'
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Browse Events</h1>
              <p className="text-gray-600 mt-2">Discover and book upcoming events tailored for startups</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2">
                {/* Check subscription status based on your user object structure */}
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${user?.subscription?.status === 'active' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'}`}>
                  {user?.subscription?.status === 'active' ? 'Premium Member' : 'Free Member'}
                </div>
              </div>
              {user?.subscription?.status !== 'active' && (
                <p className="text-sm text-gray-500 mt-1">Subscribe to book events</p>
              )}
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Available Events ({events.length})
            </h2>
          </div>

          {events.length === 0 ? (
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No events available</h3>
              <p className="mt-1 text-sm text-gray-500">Check back later for new events.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(event => {
                const availability = getAvailabilityStatus(event.bookedSlots, event.totalSlots);
                const buttonState = getButtonState(event);
                
                return (
                  <div key={event._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
                    {/* Card Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 leading-tight pr-2">
                          {event.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${getTypeStyles(event.type)}`}>
                          {event.type}
                        </span>
                      </div>

                      {/* Event Details */}
                      <div className="space-y-3">
                        {/* Event Description */}
                        <div className="text-sm text-gray-600">
                          <p className="leading-relaxed">{event.description}</p>
                        </div>

                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">{formatDate(event.date, event.time)}</span>
                        </div>

                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{event.location}</span>
                        </div>

                        {/* Capacity Information */}
                        <div className="bg-gray-50 rounded-md p-3 border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Capacity</span>
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${availability.bgColor} ${availability.color}`}>
                              {availability.text}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Booked: {event.bookedSlots}/{event.totalSlots}</span>
                            <span>{((event.bookedSlots / event.totalSlots) * 100).toFixed(0)}% filled</span>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(event.bookedSlots / event.totalSlots) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                      <button
                        disabled={buttonState.disabled}
                        onClick={() => handleBook(event._id)}
                        className={`w-full inline-flex items-center justify-center px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 ${buttonState.className}`}
                      >
                        {!buttonState.disabled && (
                          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                        {buttonState.text}
                      </button>
                      
                      {user?.subscription?.status !== 'active' && (
                        <p className="text-xs text-gray-500 text-center mt-2">
                          Premium subscription required to book events
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseEvents;