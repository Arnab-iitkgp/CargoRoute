
function generateInitialPopulation(numLocations, populationSize) {
  const population = [];

  // customers are from 1 to numLocations - 1 (0 is depot)
  const customers = Array.from({ length: numLocations - 1 }, (_, i) => i + 1);

  for (let i = 0; i < populationSize; i++) {
    const shuffled = [...customers].sort(() => Math.random() - 0.5);
    const route = [0, ...shuffled, 0];  // Start and end at depot
    population.push(route);
  }

  return population;
}
// function calculateRouteCost(route, distanceMatrix, demands, vehicleCapacity) {
//   let totalCost = 0;
//   let currentLoad = 0;
//   let trip = [0]; // Start at depot

//   for (let i = 1; i < route.length-1; i++) {
//     const customer = route[i];
//     const demand = demands[customer];

//     if (currentLoad + demand > vehicleCapacity) {
//       // Return to depot for current trip
//       trip.push(0);
//       totalCost += tripCost(trip, distanceMatrix);

//       // Start new trip from depot
//       trip = [0, customer];
//       currentLoad = demand;
//     } else {
//       trip.push(customer);
//       currentLoad += demand;
//     }
//   }

//   // Final trip back to depot
//   trip.push(0);
//   totalCost += tripCost(trip, distanceMatrix);

//   return totalCost;
// }
function calculateRouteCost(route, distanceMatrix, demands, vehicleCapacity) {
  const trips = splitIntoTrips(route, demands, vehicleCapacity);
  let totalCost = 0;

  for (const trip of trips) {
    totalCost += tripCost(trip, distanceMatrix);
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


function evaluatePopulation(population, distanceMatrix, demands, vehicleCapacity) {
  return population.map(route => ({
    route,
    cost: calculateRouteCost(route, distanceMatrix, demands, vehicleCapacity),
  }));
}

function selectParents(evaluatedPopulation, eliteCount = 5, tournamentSize = 5) {
  const selected = [];

  // Keep top elite routes as is
  for (let i = 0; i < eliteCount; i++) {
    selected.push(evaluatedPopulation[i]);
  }

  // Tournament selection for rest
  while (selected.length < evaluatedPopulation.length) {
    const tournament = [];

    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * evaluatedPopulation.length);
      tournament.push(evaluatedPopulation[randomIndex]);
    }

    tournament.sort((a, b) => a.cost - b.cost); // lower cost = better
    selected.push(tournament[0]); // pick the best from the tournament
  }

  return selected;
}
function orderedCrossover(parent1, parent2) {
  const start = Math.floor(Math.random() * (parent1.length - 2)) + 1; // avoid depot at index 0
  const end = Math.floor(Math.random() * (parent1.length - start - 1)) + start + 1;

  const child = Array(parent1.length).fill(null);
  const middle = parent1.slice(start, end);
  child.splice(start, middle.length, ...middle);

  let p2Index = 1; // skip depot at 0
  for (let i = 1; i < child.length - 1; i++) {
    if (child[i] === null) {
      while (middle.includes(parent2[p2Index])) {
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

function printBestRoute(best, demands, vehicleCapacity) {
  const  route  = best;
  let currentLoad = 0;
  let trip = [0];

  console.log("🚛 Trips:");

  for (let i = 1; i < route.length-1; i++) {
    const customer = route[i];
    const demand = demands[customer];

    if (currentLoad + demand > vehicleCapacity) {
      trip.push(0);
      console.log(`   ▶︎ Trip: ${trip.join(" -> ")} | Load: ${currentLoad}`);
      trip = [0, customer];
      currentLoad = demand;
    } else {
      trip.push(customer);
      currentLoad += demand;
    }
  }

  trip.push(0);
  console.log(`   ▶︎ Trip: ${trip.join(" -> ")} | Load: ${currentLoad}`);
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
  if(trip.length>2)
  trips.push(trip);

  return trips;
}



////
function solveVRP(data) {
  const { locations, demands, vehicleCapacity, numVehicles } = data;
  const numLocations = locations.length;

  // Step 1: Build Distance Matrix
  const distanceMatrix = Array(numLocations).fill(0).map(() => Array(numLocations).fill(0));
  for (let i = 0; i < numLocations; i++) {
    for (let j = 0; j < numLocations; j++) {
      const dx = locations[i][0] - locations[j][0];
      const dy = locations[i][1] - locations[j][1];
      distanceMatrix[i][j] = Math.sqrt(dx * dx + dy * dy);
    }
  }
  console.log("✅ Distance Matrix calculated:", distanceMatrix);

  // Config
//   const populationSize = 8;
//   const generations = 100;
//   const mutationRate = 0.2;
//   const eliteCount = 5;
const populationSize = 12; // small relative to 24 tours
const generations    = 100;
const mutationRate   = 0.3;
const eliteCount     = 1;




  // Step 2: Initialize Population
  let population = generateInitialPopulation(numLocations, populationSize);
  console.log("✅ Initial population created. Sample route:", population[0]);

  let evaluatedPopulation = evaluatePopulation(population, distanceMatrix, demands, vehicleCapacity);
  evaluatedPopulation.sort((a, b) => a.cost - b.cost);

  let bestEver = evaluatedPopulation[0]; // track best found

  // Step 3: Evolve for N generations
  for (let gen = 0; gen < generations; gen++) {
    const selectedParents = selectParents(evaluatedPopulation);

    const children = [];

    // Always keep elites
    for (let i = 0; i < eliteCount; i++) {
      children.push(selectedParents[i].route);
    }

    // Fill the rest with crossover + mutation
    while (children.length < populationSize) {
      const parentA = selectedParents[Math.floor(Math.random() * selectedParents.length)].route;
      const parentB = selectedParents[Math.floor(Math.random() * selectedParents.length)].route;

      const child = orderedCrossover(parentA, parentB);
      const mutatedChild = mutate(child, mutationRate);
      children.push(mutatedChild);
    }

    // Evaluate new generation
  evaluatedPopulation = evaluatePopulation(children, distanceMatrix, demands, vehicleCapacity);
    evaluatedPopulation.sort((a, b) => a.cost - b.cost);
    // console.log(`   ▶︎ New Gen ${gen} best child cost: ${evaluatedPopulation[0].cost.toFixed(8)}`);
    // Update best route if found
    if (evaluatedPopulation[0].cost < bestEver.cost) {
        bestEver = evaluatedPopulation[0];
    }
    // printBestRoute(bestEver.route, demands, vehicleCapacity);

    // Log progress
    // console.log(`🔁 Gen ${gen} | Best Distance: ${bestDistance.toFixed(2)} | Best Route:`, bestRoute);
    if (gen % 10 === 0 || gen === generations - 1) {
    //   console.log(`🌀 Generation ${gen} | Best Cost: ${evaluatedPopulation[0].cost}`);
    }
  }
  const bestTrips = splitIntoTrips(bestEver.route, demands, vehicleCapacity);
  console.log(bestTrips);
  // Return the best result
  return {
    message: "✅ Genetic Algorithm complete.",
    bestTrips,            // ⬅️ Properly split trips for frontend
  cost: bestEver.cost,
  distanceMatrix,
  };

  // 🔴 OLD single-generation test logic below (commented for reference)
  /*
  const evaluatedPopulation = evaluatePopulation(population, distanceMatrix);
  evaluatedPopulation.sort((a, b) => a.cost - b.cost);
  const selectedParents = selectParents(evaluatedPopulation);
  const children = [];

  for (let i = 0; i < populationSize; i++) {
    const parentA = selectedParents[Math.floor(Math.random() * selectedParents.length)].route;
    const parentB = selectedParents[Math.floor(Math.random() * selectedParents.length)].route;
    const child = orderedCrossover(parentA, parentB);
    const mutatedChild = mutate(child, 0.2);
    children.push(mutatedChild);
  }

  const newGeneration = evaluatePopulation(children, distanceMatrix);
  newGeneration.sort((a, b) => a.cost - b.cost);

  return {
    message: "Crossover complete and new generation created",
    bestChild: newGeneration[0],
    bestInitial: evaluatedPopulation[0],
  };
  */
}





////
// function solveVRP(data) {
//   const { locations, demands, vehicleCapacity, numVehicles } = data;

//   const numLocations = locations.length;

//   // Calculate distance matrix
//   const distanceMatrix = Array(numLocations).fill(0).map(() => Array(numLocations).fill(0));

//   for (let i = 0; i < numLocations; i++) {
//     for (let j = 0; j < numLocations; j++) {
//       const dx = locations[i][0] - locations[j][0];
//       const dy = locations[i][1] - locations[j][1];
//       distanceMatrix[i][j] = Math.sqrt(dx * dx + dy * dy);  // Euclidean distance
//     }
//   }

//   console.log("✅ Distance Matrix calculated:", distanceMatrix);

// const populationSize = 50;
// const population = generateInitialPopulation(numLocations, populationSize);
// console.log("✅ Initial population created. Sample route:", population[0]);

// const evaluatedPopulation = evaluatePopulation(population, distanceMatrix);

// // Sort the population by lowest cost (best routes first)
// evaluatedPopulation.sort((a, b) => a.cost - b.cost);

// console.log("✅ Best initial route cost:", evaluatedPopulation[0].cost);
// const selectedParents = selectParents(evaluatedPopulation);

// console.log("✅ Parents selected for crossover. First parent cost:", selectedParents[0].cost);

// const children = [];

// for (let i = 0; i < populationSize; i++) {
//   const parentA = selectedParents[Math.floor(Math.random() * selectedParents.length)].route;
//   const parentB = selectedParents[Math.floor(Math.random() * selectedParents.length)].route;
//  const child = orderedCrossover(parentA, parentB);
//  const mutatedChild = mutate(child, 0.2); // 20% mutatn chance
//  children.push(mutatedChild);

// }

// console.log("✅ Crossover complete. Sample child:", children[0]);
// const newGeneration = evaluatePopulation(children, distanceMatrix);
// newGeneration.sort((a, b) => a.cost - b.cost);



//   // For now, just return distanceMatrix to test it works
//  return {
//   message: "Crossover complete and new generation created",
//   bestChild: newGeneration[0],
//   bestInitial: evaluatedPopulation[0],
// };

// }
// function geneticAlgorithm(locations, demands, vehicleCapacity, numVehicles, generations = 100, populationSize = 20) {
//   const depot = locations[0];
//   const customers = locations.slice(1);
//   const customerDemands = demands.slice(1);
//   const depotIndex = 0;

//   // 1️⃣ Initial population
//   let population = Array.from({ length: populationSize }, () => {
//     const customerIndices = Array.from({ length: customers.length }, (_, i) => i + 1);
//     const shuffled = shuffle(customerIndices);
//     return [depotIndex, ...shuffled, depotIndex];
//   });

//   let bestRoute = null;
//   let bestDistance = Infinity;

//   for (let gen = 1; gen <= generations; gen++) {
//     // 2️⃣ Score all
//     const scored = population.map(route => ({
//       route,
//       distance: calculateRouteDistance(route, locations),
//     }));

//     // 3️⃣ Sort by distance
//     scored.sort((a, b) => a.distance - b.distance);

//     // 4️⃣ Update best
//     if (scored[0].distance < bestDistance) {
//       bestRoute = scored[0].route;
//       bestDistance = scored[0].distance;
//     }

//     // 5️⃣ Select top 50%
//     const parents = scored.slice(0, populationSize / 2).map(p => p.route);

//     // 6️⃣ Create children
//     const children = [];
//     while (children.length < populationSize) {
//       const [parentA, parentB] = [
//         parents[Math.floor(Math.random() * parents.length)],
//         parents[Math.floor(Math.random() * parents.length)],
//       ];
//       const child = orderedCrossover(parentA, parentB);
//       const mutatedChild = mutate(child, 0.2); // 20% mutation rate
//       children.push(mutatedChild);
//     }

//     // 7️⃣ Replace population
//     population = children;

//     // 🖨️ Log progress
//     if (gen % 10 === 0 || gen === 1 || gen === generations) {
//       console.log(`🔁 Gen ${gen} | Best Distance: ${bestDistance.toFixed(2)} | Best Route:`, bestRoute);
//     }
//   }

//   return bestRoute;
// }
// function solveVRP(locations, demands, vehicleCapacity, numVehicles) {
// //   const distanceMatrix = buildDistanceMatrix(locations);
//      const numLocations = locations.length;

//   const distanceMatrix = Array(numLocations).fill(0).map(() => Array(numLocations).fill(0));

//   for (let i = 0; i < numLocations; i++) {
//     for (let j = 0; j < numLocations; j++) {
//       const dx = locations[i][0] - locations[j][0];
//       const dy = locations[i][1] - locations[j][1];
//       distanceMatrix[i][j] = Math.sqrt(dx * dx + dy * dy);  // Euclidean distance
//     }
//   }

//   const bestRoute = geneticAlgorithm(locations, demands, vehicleCapacity, numVehicles, 100, 20);

//   return {
//     bestRoute,
//     distanceMatrix,
//   };
// }

module.exports = { solveVRP };
// function printBestRoute(individual, demands, capacity) {
//   let route = individual; // assuming it's an array of node indices
//   let load = 0;
//   console.log("🚛 Best Route: ");
//   for (let i = 0; i < route.length; i++) {
//     const node = route[i];
//     load += demands[node];
//     if (node === 0) load = 0; // reset at depot
//     process.stdout.write(`${node} `);
//   }
//   console.log(`\n📦 Total Load: ${route.reduce((acc, node) => acc + demands[node], 0)}`);
// }
// function calculateRouteCost(route, distanceMatrix, demands, vehicleCapacity) {
//   let totalCost = 0;
//   let load = 0;

//   for (let i = 0; i < route.length - 1; i++) {
//     const from = route[i];
//     const to = route[i + 1];

//     // Accumulate load (if it's a customer)
//     if (to !== 0) {
//       load += demands[to];
//       if (load > vehicleCapacity) {
//         // Apply penalty if overloaded
//         totalCost += 100 * (load - vehicleCapacity); // penalty
//       }
//     } else {
//       load = 0; // reset load at depot
//     }

//     totalCost += distanceMatrix[from][to];
//   }

//   return totalCost;
// }



// function evaluatePopulation(route, distanceMatrix, demands, vehicleCapacity) {
//   let trips = [];
//   let currentTrip = [0];
//   let currentLoad = 0;
//   let cost = 0;

//   for (let i = 0; i < route.length; i++) {
//     const customer = route[i];
//     const demand = demands[customer];

//     if (currentLoad + demand > vehicleCapacity) {
//       currentTrip.push(0); // return to depot
//       cost += tripCost(currentTrip, distanceMatrix);
//       trips.push({ path: [...currentTrip], load: currentLoad });

//       currentTrip = [0, customer]; // new trip
//       currentLoad = demand;
//     } else {
//       currentTrip.push(customer);
//       currentLoad += demand;
//     }
//   }

//   currentTrip.push(0); // end last trip
//   cost += tripCost(currentTrip, distanceMatrix);
//   trips.push({ path: currentTrip, load: currentLoad });

//   return { cost, trips };
// }