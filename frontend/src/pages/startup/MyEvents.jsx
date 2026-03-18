import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/api';

const MyEvents = () => {
  const { startup_id } = useParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get(`/bookings/user/${startup_id}`);
        setBookings(res.data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [startup_id]);

  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const formatDateTime = (date, time) => {
    const eventDate = new Date(date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return `${formattedDate} at ${time}`;
  };

  const sortBookingsByDate = (bookings) => {
    return [...bookings].sort((a, b) => new Date(a.eventId.date) - new Date(b.eventId.date));
  };

  const isEventPast = (eventDate) => {
    const today = new Date();
    const event = new Date(eventDate);
    return event < today;
  };

  const upcomingBookings = sortBookingsByDate(bookings.filter(b => !isEventPast(b.eventId.date)));
  const pastBookings = sortBookingsByDate(bookings.filter(b => isEventPast(b.eventId.date)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  const BookingCard = ({ booking, isPast }) => (
    <div className={`bg-white rounded-lg border hover:shadow-md transition-shadow duration-200 ${isPast ? 'border-gray-200 opacity-75' : 'border-gray-200 shadow-sm'}`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{booking.eventId.title}</h3>
            <div className="flex items-center space-x-2 mb-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeStyles(booking.eventId.type)}`}>
                {booking.eventId.type}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles(booking.status)}`}>
                {booking.status}
              </span>
            </div>
          </div>
          {isPast && (
            <div className="flex-shrink-0">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                Past Event
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDateTime(booking.eventId.date, booking.eventId.time)}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <svg className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{booking.eventId.location}</span>
          </div>
        </div>
      </div>

      {booking.status.toLowerCase() === 'confirmed' && !isPast && (
        <div className="px-6 py-3 bg-green-50 border-t border-green-100 rounded-b-lg">
          <div className="flex items-center text-sm text-green-700">
            <svg className="h-4 w-4 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            You're all set! See you at the event.
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
          <p className="text-gray-600 mt-2">Track all your event bookings and registrations</p>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings yet</h3>
            <p className="mt-1 text-sm text-gray-500">Start by browsing and booking events that interest you.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Events */}
            {upcomingBookings.length > 0 && (
              <div>
                <div className="flex items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Upcoming Events ({upcomingBookings.length})
                  </h2>
                  <div className="ml-3 flex-1 h-px bg-gray-200"></div>
                </div>
                <div className="space-y-4">
                  {upcomingBookings.map(booking => (
                    <BookingCard key={booking._id} booking={booking} isPast={false} />
                  ))}
                </div>
              </div>
            )}

            {/* Past Events */}
            {pastBookings.length > 0 && (
              <div>
                <div className="flex items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Past Events ({pastBookings.length})
                  </h2>
                  <div className="ml-3 flex-1 h-px bg-gray-200"></div>
                </div>
                <div className="space-y-4">
                  {pastBookings.map(booking => (
                    <BookingCard key={booking._id} booking={booking} isPast={true} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary Stats */}
        {bookings.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{bookings.length}</div>
                <div className="text-sm text-blue-700">Total Bookings</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{upcomingBookings.length}</div>
                <div className="text-sm text-green-700">Upcoming Events</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-gray-600">{pastBookings.length}</div>
                <div className="text-sm text-gray-700">Past Events</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEvents;