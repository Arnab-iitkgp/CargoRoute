import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  Polyline,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";

// Icons
const depotIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2921/2921822.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const customerIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/25/25694.png",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

// Clickable map component
function LocationClicker({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function LeafletMap({
  locations,
  setLocations,
  demands,
  setDemands,
  job,
}) {
  const [routePolylines, setRoutePolylines] = useState([]);
  const ORS_API_KEY = "5b3ce3597851110001cf6248f72aa68efb604afb81aa32762d39e768"; // 🔑 Replace this

  const handleMapClick = (latlng) => {
    setLocations((prev) => [...prev, latlng]);
    setDemands((prev) => [...prev, 1]); // default demand
  };

  const updateDemand = (index, value) => {
    const newDemands = [...demands];
    newDemands[index] = parseInt(value) || 0;
    setDemands(newDemands);
  };

  // Fetch road-following routes from OpenRouteService
  useEffect(() => {
    const fetchORSRoutes = async () => {
      if (!job?.result?.bestRoute || locations.length === 0) return;
      const allRoutes = [];

      for (const route of job.result.bestRoute) {
        const coords = route.map((idx) => locations[idx]);

        if (coords.some((pos) => !Array.isArray(pos) || pos.length !== 2)) continue;

        try {
          const res = await axios.post(
            "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
            {
              coordinates: coords.map(([lat, lng]) => [lng, lat]), // ORS expects [lng, lat]
            },
            {
              headers: {
                Authorization: ORS_API_KEY,
                "Content-Type": "application/json",
              },
            }
          );

          const geometry = res.data.features[0].geometry.coordinates.map(
            ([lng, lat]) => [lat, lng]
          );

          allRoutes.push(geometry);
        } catch (err) {
          console.error("ORS API error:", err);
        }
      }

      setRoutePolylines(allRoutes);
    };

    fetchORSRoutes();
  }, [job, locations]);

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-72 bg-gray-100 p-4 border-r overflow-auto">
        <h2 className="font-bold mb-2">Inputs</h2>
        {locations.length === 0 && (
          <p className="text-gray-500 text-sm">
            Click on map to place depot first.
          </p>
        )}
        {locations.length > 0 && (
          <div className="space-y-3">
            {/* Depot */}
            <div className="p-2 bg-blue-100 rounded">
              <strong>Depot:</strong>
              <div className="text-xs text-gray-700">
                ({locations[0][0].toFixed(4)}, {locations[0][1].toFixed(4)})
              </div>
            </div>

            {/* Customers */}
            {locations.slice(1).map((loc, i) => (
              <div key={i} className="p-2 bg-white rounded shadow-sm">
                <div className="font-medium">Customer {i + 1}</div>
                <div className="text-xs text-gray-500 mb-1">
                  ({loc[0].toFixed(4)}, {loc[1].toFixed(4)})
                </div>
                <input
                  type="number"
                  value={demands[i + 1] || 0}
                  onChange={(e) => updateDemand(i + 1, e.target.value)}
                  className="w-full px-2 py-1 border rounded text-sm"
                  min={0}
                />
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* Map */}
      <main className="flex-1 relative">
        <MapContainer
          center={[22.5726, 88.3639]} // Kolkata default center
          zoom={13}
          className="h-full w-full"
        >
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LocationClicker onMapClick={handleMapClick} />

          {/* Markers */}
          {locations.map((pos, idx) => (
            <Marker
              key={idx}
              position={pos}
              icon={idx === 0 ? depotIcon : customerIcon}
            >
              <Tooltip>
                {idx === 0
                  ? `Depot (${pos[0].toFixed(4)}, ${pos[1].toFixed(4)})`
                  : `Customer ${idx} (${pos[0].toFixed(4)}, ${pos[1].toFixed(4)})`}
              </Tooltip>
            </Marker>
          ))}

          {/* Real-road Polyline paths */}
          {routePolylines.map((polyline, i) => (
            <Polyline
              key={i}
              positions={polyline}
              color={["red", "blue", "green", "purple"][i % 4]}
            />
          ))}
        </MapContainer>
      </main>
    </div>
  );
}
