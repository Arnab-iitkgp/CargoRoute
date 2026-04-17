const solveVRP = require("../services/vrpSolver");
const DeliveryJob = require("../models/DeliveryJob");

const solveVRPHandler = async (req, res) => {
  try {
    const inputData = req.body;
    const {
      numVehicles = 2,
      maxShiftHours = 8,
      reloadTimeHours = 0.5,
      avgSpeedKmh = 40,
    } = inputData;

    const result = solveVRP(inputData);
    const { bestTrips, assignment, totalCost } = result;

    console.log("✅ Vehicles:", JSON.stringify(assignment.vehicles.map(v => ({ id: v.id, trips: v.trips }))));

    const newJob = new DeliveryJob({
      ...inputData,
      title: inputData.title || "Untitled Job",
      numVehicles,
      maxShiftHours,
      reloadTimeHours,
      avgSpeedKmh,
      result: {
        totalCost,
        bestRoute: bestTrips,
        generations: 300,
        vehicles: assignment.vehicles,
        deferred: assignment.deferred,
        deferredCustomers: assignment.deferredCustomers,
        unservableCustomers: assignment.unservableCustomers,
        makespan: assignment.makespan,
        numVehiclesUsed: assignment.numVehiclesUsed,
        minVehiclesNeeded: assignment.minVehiclesNeeded,
        totalKm: assignment.totalKm,
      },
    });

    await newJob.save();

    // Return both the DB job AND the raw assignment separately
    // because Mongoose may not perfectly serialize nested arrays
    return res.status(200).json({
      message: "VRP solved and saved",
      job: newJob,
      assignment,          // raw, fully reliable data for the frontend
    });
  } catch (error) {
    console.error("Error solving VRP:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


module.exports = { solveVRPHandler };
