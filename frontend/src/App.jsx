import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { PatientAuthProvider } from "./auth/PatientAuthProvider";
import ProtectedRoute from "./auth/ProtectedRoute";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Booking from "./pages/Booking";
import AccountAuth from "./pages/account/AccountAuth";
import Profile from "./pages/account/Profile";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import Tests from "./pages/Tests";
import TestOrders from "./pages/TestOrders";
import Payments from "./pages/Payments";
import Locations from "./pages/Locations";
import Staff from "./pages/Staff";
import Messages from "./pages/Messages";

export default function App() {
  return (
    <AuthProvider>
      <PatientAuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public medical website */}
            <Route path="/" element={<Home />} />
            <Route path="/book" element={<Booking />} />
            <Route path="/account/login" element={<AccountAuth />} />
            <Route path="/account" element={<Profile />} />

            {/* Staff login */}
            <Route path="/login" element={<Login />} />

            {/* Admin dashboard */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="patients" element={<Patients />} />
              <Route path="doctors" element={<Doctors />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="tests" element={<Tests />} />
              <Route path="test-orders" element={<TestOrders />} />
              <Route path="payments" element={<Payments />} />
              <Route path="locations" element={<Locations />} />
              <Route path="staff" element={<Staff />} />
              <Route path="messages" element={<Messages />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PatientAuthProvider>
    </AuthProvider>
  );
}
