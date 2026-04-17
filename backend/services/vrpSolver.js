
function generateInitialPopulation(numLocations, populationSize) {
  const population = [];
  const customers = Array.from({ length: numLocations - 1 }, (_, i) => i + 1);
  for (let i = 0; i < populationSize; i++) {
    const shuffled = [...customers].sort(() => Math.random() - 0.5);
    const route = [0, ...shuffled, 0];
    population.push(route);
  }
  return population;
}

function calculateRouteCost(route, distanceMatrix, demands, vehicleCapacity, numVehicles, maxShiftHours, reloadTimeHours, avgSpeedKmh) {
  const trips = splitIntoTrips(route, demands, vehicleCapacity);
  let totalCost = 0;
  for (const trip of trips) {
    totalCost += tripCost(trip, distanceMatrix);
  }

  if (numVehicles && maxShiftHours && avgSpeedKmh) {
    const tripDurations = trips.map(trip => tripCost(trip, distanceMatrix) / avgSpeedKmh);
    const sorted = [...tripDurations].sort((a, b) => a - b);
    const vehicleFinish = new Array(numVehicles).fill(0);
    let deferredCount = 0;

    for (const dur of sorted) {
      if (dur > maxShiftHours) { deferredCount++; continue; }
      vehicleFinish.sort((a, b) => a - b);
      const reload = vehicleFinish[0] > 0 ? reloadTimeHours : 0;
      if (vehicleFinish[0] + reload + dur <= maxShiftHours) {
        vehicleFinish[0] += reload + dur;
      } else {
        deferredCount++;
      }
    }
    totalCost += deferredCount * 50;
  }

  return totalCost;
}

function tripCost(trip, distanceMatrix) {
  let cost = 0;
  for (let i = 0; i < trip.length - 1; i++) {
    cost += distanceMatrix[trip[i]][trip[i + 1]];
  }
  return cost;
}

function evaluatePopulation(population, distanceMatrix, demands, vehicleCapacity, numVehicles, maxShiftHours, reloadTimeHours, avgSpeedKmh) {
  return population.map(route => ({
    route,
    cost: calculateRouteCost(route, distanceMatrix, demands, vehicleCapacity, numVehicles, maxShiftHours, reloadTimeHours, avgSpeedKmh),
  }));
}

function selectParents(evaluatedPopulation, eliteCount = 5, tournamentSize = 5) {
  const selected = [];
  for (let i = 0; i < eliteCount; i++) {
    selected.push(evaluatedPopulation[i]);
  }
  while (selected.length < evaluatedPopulation.length) {
    const tournament = [];
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * evaluatedPopulation.length);
      tournament.push(evaluatedPopulation[randomIndex]);
    }
    tournament.sort((a, b) => a.cost - b.cost);
    selected.push(tournament[0]);
  }
  return selected;
}

function orderedCrossover(parent1, parent2) {
  const start = Math.floor(Math.random() * (parent1.length - 2)) + 1;
  const end = Math.floor(Math.random() * (parent1.length - start - 1)) + start + 1;
  const child = Array(parent1.length).fill(null);
  const middle = parent1.slice(start, end);
  child.splice(start, middle.length, ...middle);
  let p2Index = 1;
  for (let i = 1; i < child.length - 1; i++) {
    if (child[i] === null) {
      while (p2Index < parent2.length - 1 && middle.includes(parent2[p2Index])) {
        p2Index++;
      }
      child[i] = parent2[p2Index];
      p2Index++;
    }
  }
  child[0] = 0;
  child[child.length - 1] = 0;
  return child;
}

function mutate(route, mutationRate = 0.1) {
  const mutated = [...route];
  for (let i = 1; i < mutated.length - 1; i++) {
    if (Math.random() < mutationRate) {
      const j = Math.floor(Math.random() * (mutated.length - 2)) + 1;
      [mutated[i], mutated[j]] = [mutated[j], mutated[i]];
    }
  }
  return mutated;
}

function splitIntoTrips(route, demands, vehicleCapacity) {
  const trips = [];
  let trip = [0];
  let currentLoad = 0;
  for (let i = 1; i < route.length - 1; i++) {
    const customer = route[i];
    const demand = demands[customer];
    if (currentLoad + demand > vehicleCapacity) {
      trip.push(0);
      trips.push(trip);
      trip = [0, customer];
      currentLoad = demand;
    } else {
      trip.push(customer);
      currentLoad += demand;
    }
  }
  trip.push(0);
  if (trip.length > 2) trips.push(trip);
  return trips;
}

function haversineKm([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function assignTripsToVehicles(trips, distanceMatrix, demands, numVehicles, maxShiftHours, reloadTimeHours, avgSpeedKmh) {
  const annotated = trips.map(trip => ({
    trip,
    distanceKm: tripCost(trip, distanceMatrix),
    durationHours: tripCost(trip, distanceMatrix) / avgSpeedKmh,
    load: trip.filter(idx => idx !== 0).reduce((s, idx) => s + (demands[idx] || 0), 0),
  }));

  const unservable = annotated.filter(t => t.durationHours > maxShiftHours);
  const servable = annotated.filter(t => t.durationHours <= maxShiftHours);
  servable.sort((a, b) => a.durationHours - b.durationHours);

  const vehicles = Array.from({ length: numVehicles }, (_, i) => ({
    id: i + 1,
    trips: [],
    tripDetails: [],
    finishTime: 0,
    totalKm: 0,
    totalDurationHours: 0,
  }));

  const deferred = [];

  for (const tripData of servable) {
    vehicles.sort((a, b) => a.finishTime - b.finishTime);
    let assigned = false;
    for (const vehicle of vehicles) {
      const reloadT = vehicle.trips.length > 0 ? reloadTimeHours : 0;
      const projectedEndTime = vehicle.finishTime + reloadT + tripData.durationHours;
      if (projectedEndTime <= maxShiftHours) {
        vehicle.trips.push(tripData.trip);
        vehicle.tripDetails.push({
          distanceKm: parseFloat(tripData.distanceKm.toFixed(3)),
          durationHours: parseFloat(tripData.durationHours.toFixed(4)),
          durationMinutes: Math.round(tripData.durationHours * 60),
          load: tripData.load,
        });
        vehicle.totalKm += tripData.distanceKm;
        vehicle.totalDurationHours += tripData.durationHours;
        vehicle.finishTime = projectedEndTime;
        assigned = true;
        break;
      }
    }
    if (!assigned) deferred.push(tripData);
  }

  const usedVehicles = vehicles.filter(v => v.trips.length > 0);
  const makespan = usedVehicles.length > 0 ? Math.max(...usedVehicles.map(v => v.finishTime)) : 0;
  const totalTripTime = annotated.reduce((s, t) => s + t.durationHours, 0);
  const minVehiclesNeeded = Math.ceil(totalTripTime / maxShiftHours);
  const deferredCustomers = deferred.flatMap(t => t.trip.filter(idx => idx !== 0));
  const unservableCustomers = unservable.flatMap(t => t.trip.filter(idx => idx !== 0));

  return {
    vehicles: usedVehicles.map(v => ({
      ...v,
      totalKm: parseFloat(v.totalKm.toFixed(3)),
      finishTime: parseFloat(v.finishTime.toFixed(3)),
    })),
    deferred: deferred.map(t => t.trip),
    deferredCustomers,
    unservableTrips: unservable.map(t => t.trip),
    unservableCustomers,
    makespan: parseFloat(makespan.toFixed(3)),
    numVehiclesUsed: usedVehicles.length,
    minVehiclesNeeded,
    coveredKm: parseFloat(usedVehicles.reduce((s, v) => s + v.totalKm, 0).toFixed(3)),
    totalKm: parseFloat(annotated.reduce((s, t) => s + t.distanceKm, 0).toFixed(3)),
    recommendations: deferred.length > 0
      ? computeRecommendations(annotated, numVehicles, maxShiftHours, reloadTimeHours, avgSpeedKmh)
      : null,
  };
}

function computeRecommendations(annotatedTrips, currentVehicles, currentShiftHours, reloadTimeHours, currentSpeedKmh) {
  const tripDistances = annotatedTrips.map(t => t.distanceKm);
  const recommendations = [];

  function simulate(nVehicles, shiftHours, speedKmh) {
    const durations = tripDistances.map(d => d / speedKmh);
    const sorted = [...durations].sort((a, b) => a - b);
    const vehicleFinish = new Array(nVehicles).fill(0);
    let deferred = 0;
    for (const dur of sorted) {
      if (dur > shiftHours) { deferred++; continue; }
      vehicleFinish.sort((a, b) => a - b);
      const reload = vehicleFinish[0] > 0 ? reloadTimeHours : 0;
      if (vehicleFinish[0] + reload + dur <= shiftHours) {
        vehicleFinish[0] += reload + dur;
      } else {
        deferred++;
      }
    }
    return deferred;
  }

  for (let v = currentVehicles; v <= tripDistances.length; v++) {
    if (simulate(v, currentShiftHours, currentSpeedKmh) === 0) {
      if (v > currentVehicles) {
        recommendations.push({
          type: 'vehicles',
          label: `Use ${v} vehicles`,
          detail: `${v} vehicles at ${currentShiftHours}h shift, ${currentSpeedKmh} km/h`,
          vehicles: v, shift: currentShiftHours, speed: currentSpeedKmh,
        });
      }
      break;
    }
  }

  for (let s = currentShiftHours; s <= 24; s += 0.5) {
    if (simulate(currentVehicles, s, currentSpeedKmh) === 0) {
      if (s > currentShiftHours) {
        recommendations.push({
          type: 'shift',
          label: `Extend shift to ${s}h`,
          detail: `${currentVehicles} vehicle(s) at ${s}h shift, ${currentSpeedKmh} km/h`,
          vehicles: currentVehicles, shift: s, speed: currentSpeedKmh,
        });
      }
      break;
    }
  }

  for (let sp = currentSpeedKmh; sp <= 120; sp += 5) {
    if (simulate(currentVehicles, currentShiftHours, sp) === 0) {
      if (sp > currentSpeedKmh) {
        recommendations.push({
          type: 'speed',
          label: `Increase speed to ${sp} km/h`,
          detail: `${currentVehicles} vehicle(s) at ${currentShiftHours}h shift, ${sp} km/h`,
          vehicles: currentVehicles, shift: currentShiftHours, speed: sp,
        });
      }
      break;
    }
  }

  const balancedV = currentVehicles + 1;
  for (let s = Math.max(1, currentShiftHours - 2); s <= currentShiftHours + 4; s += 0.5) {
    if (simulate(balancedV, s, currentSpeedKmh) === 0) {
      const pureVehicleRec = recommendations.find(r => r.type === 'vehicles');
      if (!pureVehicleRec || balancedV < pureVehicleRec.vehicles || s < currentShiftHours) {
        recommendations.push({
          type: 'balanced',
          label: `${balancedV} vehicles, ${s}h shift`,
          detail: `${balancedV} vehicles at ${s}h shift, ${currentSpeedKmh} km/h`,
          vehicles: balancedV, shift: s, speed: currentSpeedKmh,
        });
      }
      break;
    }
  }

  return recommendations;
}

function solveVRP(data) {
  const {
    locations,
    demands,
    vehicleCapacity,
    numVehicles = 2,
    maxShiftHours = 8,
    reloadTimeHours = 0.5,
    avgSpeedKmh = 40,
  } = data;

  const numLocations = locations.length;

  const distanceMatrix = Array(numLocations).fill(0).map(() => Array(numLocations).fill(0));
  for (let i = 0; i < numLocations; i++) {
    for (let j = 0; j < numLocations; j++) {
      distanceMatrix[i][j] = haversineKm(locations[i], locations[j]) * 1.25;
    }
  }

  const populationSize = 50;
  const generations = 300;
  const mutationRate = 0.1;
  const eliteCount = 5;

  let population = generateInitialPopulation(numLocations, populationSize);
  let evaluatedPopulation = evaluatePopulation(population, distanceMatrix, demands, vehicleCapacity, numVehicles, maxShiftHours, reloadTimeHours, avgSpeedKmh);
  evaluatedPopulation.sort((a, b) => a.cost - b.cost);
  let bestEver = evaluatedPopulation[0];

  for (let gen = 0; gen < generations; gen++) {
    const selectedParents = selectParents(evaluatedPopulation, eliteCount);
    const children = [];
    for (let i = 0; i < eliteCount; i++) {
      children.push(selectedParents[i].route);
    }
    while (children.length < populationSize) {
      const parentA = selectedParents[Math.floor(Math.random() * selectedParents.length)].route;
      const parentB = selectedParents[Math.floor(Math.random() * selectedParents.length)].route;
      const child = orderedCrossover(parentA, parentB);
      const mutatedChild = mutate(child, mutationRate);
      children.push(mutatedChild);
    }
    evaluatedPopulation = evaluatePopulation(children, distanceMatrix, demands, vehicleCapacity, numVehicles, maxShiftHours, reloadTimeHours, avgSpeedKmh);
    evaluatedPopulation.sort((a, b) => a.cost - b.cost);
    if (evaluatedPopulation[0].cost < bestEver.cost) {
      bestEver = evaluatedPopulation[0];
    }
  }

  const bestTrips = splitIntoTrips(bestEver.route, demands, vehicleCapacity);

  const assignment = assignTripsToVehicles(
    bestTrips,
    distanceMatrix,
    demands,
    numVehicles,
    maxShiftHours,
    reloadTimeHours,
    avgSpeedKmh
  );

  console.log('✅ VRP solved. Vehicles used:', assignment.numVehiclesUsed, '| Deferred:', assignment.deferredCustomers);

  return {
    message: '✅ Genetic Algorithm + VRPMT Assignment complete.',
    bestTrips,
    assignment,
    totalCost: bestEver.cost,
    distanceMatrix,
  };
}

module.exports = solveVRP;
