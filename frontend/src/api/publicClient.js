import axios from "axios";

// Bare client for the public booking site — no auth header, no redirect logic.
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const publicClient = axios.create({ baseURL });

export default publicClient;
