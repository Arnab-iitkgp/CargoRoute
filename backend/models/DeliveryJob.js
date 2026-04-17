const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  id: Number,
  trips: { type: [[[Number]]], default: [] },
  totalKm: Number,
  totalDurationHours: Number,
  finishTime: Number,
}, { _id: false });

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
  maxShiftHours: {
    type: Number,
    default: 8,
  },
  reloadTimeHours: {
    type: Number,
    default: 0.5,
  },
  avgSpeedKmh: {
    type: Number,
    default: 40,
  },
  result: {
    totalCost: Number,
    bestRoute: [[Number]],       // raw GA trips (backward compat)
    generations: Number,
    vehicles: [VehicleSchema],   // VRPMT vehicle assignment
    deferred: [[[Number]]],      // deferred trips
    deferredCustomers: [Number], // deferred customer indices
    unservableCustomers: [Number],
    makespan: Number,
    numVehiclesUsed: Number,
    minVehiclesNeeded: Number,
    totalKm: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('DeliveryJob', DeliveryJobSchema);
