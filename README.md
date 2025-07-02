
# 📦 CargoRoute – Vehicle Routing Optimizer

A logistics optimization tool that solves the Vehicle Routing Problem (VRP) using a custom Genetic Algorithm. Visualizes real-world delivery routes on interactive maps with capacity constraints, powered by OpenRouteService and Leaflet.

---

##  Features

1. **Genetic Algorithm–based VRP Solver**
    - Finds optimal delivery sequences minimizing total distance
    - Supports vehicle capacity constraints
    - Implements the *Split Giant Tour Heuristic* for multiple trips

2. **Real-World Routing with OpenRouteService**
    - Replaces Euclidean approximations with real road distances
    -  Respects one-way roads, turn restrictions, and road types


3.  **Single Truck, Multiple Trips**
    - One vehicle makes multiple depot-round trips
    - Frontend shows parallel truck icons for visual clarity

4. **Interactive Frontend with React + Leaflet**
    - Click to place depot and customers on a real map
    - Input demand per customer



---

##  Tech Stack

| Layer       | Technology                |
|-------------|---------------------------|
| Frontend    | React, Leaflet.js, Tailwind CSS |
| Backend     | Node.js, Express.js       |
| Database    | MongoDB (Mongoose)        |
| Map Routing | OpenRouteService API      |

---

##  Screenshots

![Screenshot (267)](https://github.com/user-attachments/assets/a9d7fb90-ab7e-4402-a964-906031d99af3)


---

##  Setup Instructions

```bash
# 1. Clone the repo
git clone https://github.com/Arnab-iitkgp/CargoRoute.git
cd CargoRoute

# 2. Install frontend
cd frontend
npm install

# 3. Install backend
cd ../backend
npm install

# 4. Environment variables
# .env (frontend)
VITE_API_URL=http://localhost:5000 (the server)

# .env (backend)
PORT=5000
MONGO_URI=your_mongoDB_uri
ORS_API_KEY=your_ors_key

# 5. Start servers
cd backend
npm run dev

cd ../frontend
npm run dev
```

---

##  Project Logic (How It Works)

1. **User Input**  
   - User clicks to place depot + customer locations  
   - Each customer has a demand

2. **Optimization**  
   - Backend constructs a "giant tour" chromosome  
   - Route is split into sub-trips based on vehicle capacity  
   - Each trip is evaluated using real-world road distances (ORS)

3. **Visualization**  
   - Leaflet renders depot, customers, and polylines per trip  
   - Truck icons animate across each route  
   - Sidebar shows cost, load, and trip info

---

##  Example Use Case

> A delivery company with a single van (capacity = 100kg) wants to deliver goods to 15 customers. CargoRoute splits the route into feasible trips, minimizing travel distance using real maps and constraints.

---

##  TODOs / Future Work

- [ ] Multi-vehicle support with dynamic vehicle allocation
- [ ] Persistent caching of ORS responses in MongoDB


---



## Author
Built with 💗 by Arnab Chakraborty

---
