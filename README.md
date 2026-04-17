
# 📦 CargoRoute – Vehicle Routing Optimizer

> A full-stack logistics optimization platform that solves the **Vehicle Routing Problem with Multiple Trips (VRPMT)** using a custom Genetic Algorithm, real-world map routing, and intelligent scheduling.

[![Live Demo](https://img.shields.io/badge/Live_Demo-CargoRoute-2563eb?style=for-the-badge)](https://cargoroute-frontend.vercel.app/)


> ⚠️ **Cold Start Warning**: The backend is deployed on Render's free tier. The first request may take 1–2 minutes while the server wakes up. Subsequent requests are fast.

---

## 🎬 Demo Video

[![View Demo](https://img.shields.io/badge/▶_Watch_Demo-Google_Drive-red?style=for-the-badge)](https://drive.google.com/file/d/1ePBCRtL66dYHFezaCkA8pritkN0_Mkm7/view?usp=drive_link)

---

## ✨ Features

### 🧠 Optimization Engine
- **Genetic Algorithm (GA)** with Order Crossover (OX), elitism, and tournament selection — finds near-optimal delivery sequences in < 1 second
- **VRPMT Support** — each vehicle makes multiple trips within a configurable shift window, with reload time between trips
- **SPT + ECF Scheduling** — Shortest Processing Time ordering + Earliest Completion First assignment for optimal vehicle utilization
- **Smart Deferral Handling** — trips that can't fit within shift limits are gracefully deferred, with clear UI indicators
- **Post-Optimization Recommendations** — when deferrals occur, the system automatically suggests minimum changes (more vehicles, longer shifts, faster speed, or balanced combos)

### 🗺️ Interactive Map Interface
- **Click-to-Place** depot and customer locations on a real map (Leaflet + OpenStreetMap / CARTO)
- **Per-Customer Demand Input** — set package counts for each delivery stop
- **Color-Coded Route Polylines** — each trip gets a distinct color for easy visual distinction
- **Animated Delivery Simulation** — watch truck icons drive along the optimized routes in real-time
- **Dual Tile Layers** — switch between detailed OpenStreetMap and minimal CARTO flat map
- **Geolocation** — one-click "Locate Me" to center the map on your position

### 📊 Delivery Report
- **Comprehensive Metrics** — total distance, makespan, fleet utilization, deferred/unservable customer counts
- **Per-Vehicle Breakdown** — trip details with distance, duration, load, and customer assignments
- **Floating Card UI** — minimized report card persists at the bottom of the map; expands to a detailed modal
- **Deferred Customer Alerts** — highlighted sections with actionable recommendations

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React, Tailwind CSS | UI framework and styling |
| **Map** | Leaflet.js| Interactive map rendering |
| **Backend** | Node.js, Express.js | REST API server |
| **Database** | MongoDB (Mongoose) | Job persistence |
| **Routing** | OpenRouteService API | Real-world road geometry for polylines |
| **Icons** | react-icons (Fa6, Fc) | Brutalist-compatible icon system |
| **Deployment** | Vercel (frontend), Render (backend) | Production hosting |

---

## 🧬 Algorithm Overview

### Genetic Algorithm (GA) — Sequencing Layer
| Component | Implementation | Hyperparameter |
|-----------|---------------|----------------|
| **Encoding** | Permutation chromosome `[0, c1, c2, ..., cn, 0]` | — |
| **Population** | Random shuffles of customer indices | Size = 50 |
| **Fitness** | Total trip distance + deferral penalty (50/trip) | — |
| **Selection** | Elitism (top 5) + Tournament (size 5) | Elite = 10% |
| **Crossover** | Order Crossover (OX) — preserves permutation validity | — |
| **Mutation** | Swap mutation (random pairwise swaps) | Rate = 10% |
| **Generations** | Iterative evolution with best-ever tracking | 300 |

### SPT + ECF — Scheduling Layer
| Step | What it does |
|------|-------------|
| **Annotate** | Calculate distance, duration, and load for each trip |
| **Filter** | Separate unservable trips (duration > shift) |
| **Sort (SPT)** | Order servable trips by duration ascending |
| **Assign (ECF)** | For each trip, assign to the earliest-finishing vehicle that still has capacity |
| **Defer** | Remaining trips → deferred to next shift |

### Recommendation Engine
When deferrals occur, the engine runs **what-if simulations** across 4 strategies:
1. **Add vehicles** — minimum fleet size to eliminate deferrals
2. **Extend shift** — minimum hours needed (in 0.5h increments, up to 24h)
3. **Increase speed** — minimum avg speed needed (in 5 km/h increments, up to 120 km/h)
4. **Balanced combo** — +1 vehicle with adjusted shift hours

---

## ⚡ Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/Arnab-iitkgp/CargoRoute.git
cd CargoRoute

# 2. Install frontend dependencies
cd frontend
npm install

# 3. Install backend dependencies
cd ../backend
npm install

# 4. Configure environment variables

# frontend/.env
VITE_API_URL=http://localhost:5000

# backend/.env
PORT=5000
MONGO_URI=your_mongodb_connection_string
ORS_API_KEY=your_openrouteservice_api_key

# 5. Start both servers
cd backend && npm run dev    # Terminal 1
cd frontend && npm run dev   # Terminal 2
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:5000`.

---

## 📖 How It Works

### 1. Place Stops
Click anywhere on the map to place your **depot** (first click) and **customer locations** (subsequent clicks). Set the delivery demand for each customer.

### 2. Configure Fleet
Open the fleet panel to set:
- **Vehicle Capacity** - max packages per trip
- **Number of Vehicles** - trucks in your fleet
- **Max Shift Hours** - driver working hours
- **Avg Speed** - average driving speed (km/h)

### 3. Generate Plan
Hit **Generate Plan**. The backend runs the GA (300 generations × 50 population = 15,000 evaluations) and returns optimized routes within ~1 second.

### 4. Review Results
The **Delivery Report** auto-opens with:
- Total distance and makespan
- Per-vehicle trip assignments with timing
- Deferred customer alerts with actionable recommendations
- One-click delivery simulation

### 5. Simulate Delivery
Click **Start Delivery** to watch animated truck icons trace the optimized routes on the map in real-time.

---



## 🎯 Example Use Case

> A courier company with **2 vans** (capacity = 8 packages each) needs to deliver to **15 customers** across Kolkata within an **8-hour shift**. CargoRoute splits the route into 5 optimized trips, assigns them across both vehicles, and identifies that 2 customers must be deferred to the next shift — along with a recommendation to add 1 more vehicle to cover everyone.

---

## 🔮 Future Work

- [ ] **Time Windows (VRPTW)** - customer-specific delivery windows with arrival penalties
- [ ] **ORS Batch Routing** - replace sequential API calls with batch requests
- [ ] **Load Previous Jobs** - retrieve and replay past optimization results
- [ ] **Real-Time Traffic** - dynamic speed profiles based on time of day
- [ ] **2-opt Local Search** - post-GA hill-climbing refinement
- [ ] **Export to CSV/PDF** - download delivery reports for dispatch teams

---

## 👤 Author

Built with ❤️ by **Arnab Chakraborty**

[![GitHub](https://img.shields.io/badge/GitHub-Arnab--iitkgp-181717?style=flat-square&logo=github)](https://github.com/Arnab-iitkgp)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-arnab--dev-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/arnab-dev)

---
