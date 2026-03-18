const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Nodemailer setup (example with Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,      
    pass: process.env.EMAIL_PASS,
  }
});

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const { userId, eventId } = req.body;

    const user = await User.findById(userId);
    const event = await Event.findById(eventId);

    if (!user || !event) return res.status(404).json({ error: 'User or Event not found' });
    if (!user.isSubscribed) return res.status(403).json({ error: 'User not subscribed' });
    if (event.bookedSlots >= event.totalSlots) return res.status(400).json({ error: 'No slots available' });

    // Prevent duplicate booking
    const existingBooking = await Booking.findOne({ userId, eventId });
    if (existingBooking) return res.status(400).json({ error: 'Already booked' });

    // Create booking
    const booking = await Booking.create({ userId, eventId });
    event.bookedSlots += 1;
    await event.save();

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Booking Confirmation: ${event.title}`,
      html: `<h3>Booking Confirmed!</h3>
             <p><strong>Event:</strong> ${event.title}</p>
             <p><strong>Date:</strong> ${event.date.toDateString()} ${event.time}</p>
             <p><strong>Location:</strong> ${event.location}</p>
             <p>Thank you for booking!</p>
             <p>Team StartHub`
    };

    try {
  const info = await transporter.sendMail(mailOptions);
  console.log('Email sent: ' + info.response);
} catch (err) {
  console.error('Email failed:', err);
}

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get bookings by user
exports.getBookingsByUser = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.params.userId })
      .populate('eventId', 'title date time location');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
