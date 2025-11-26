import { json } from "@remix-run/node";
import axios from "axios";

export async function loader() {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
  try {
    const res = await axios.get(`${backendUrl}/events/locations`);
    return json(res.data);
  } catch (error) {
    return json([]);
  }
}
