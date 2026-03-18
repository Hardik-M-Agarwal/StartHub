const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ['Funding', 'Pitching', 'Networking', 'Fair'], required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
    totalSlots: { type: Number, required: true },
    bookedSlots: { type: Number, default: 0 },
    status: { type: String, enum: ['Upcoming', 'Completed'], default: 'Upcoming' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
