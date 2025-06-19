// src/api.js
const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000"

export async function createJob(payload) {
  const res = await fetch(`${BASE}/api/solve-vrp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function fetchJob(id) {
  const res = await fetch(`${BASE}/api/jobs/${id}`)
  return res.json()
}
