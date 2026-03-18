const express = require('express');
const router = express.Router();
const { createBooking, getBookingsByUser } = require('../controllers/bookingController');

router.post('/', createBooking);
router.get('/user/:userId', getBookingsByUser);

module.exports = router;
