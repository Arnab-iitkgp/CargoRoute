const mongoose = require('mongoose');

const DeliveryJobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  locations: {
    type: [[Number]],
    required: true,
  },
  demands: {
    type: [Number],
    required: true,
  },
  vehicleCapacity: {
    type: Number,
    required: true,
  },
  numVehicles: {
    type: Number,
    required: true,
  },
  result: {
    totalCost: Number,
    bestRoute: [[Number]],
    generations: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('DeliveryJob', DeliveryJobSchema);
