import './App.css';
import LoginPage from './components/login';
import Dashboard from './components/dashboard';
import HotelDetails from './components/hoteldetails';
// import Sidebar from './components/sidebar.js'
import ManageHotel from './components/managehotel.js';
import CustomerRecords from './components/pastrecords.js';
import ManageFood from './components/managefood.js';
import ManageRooms from './components/managerooms.js';
// import Statistics from './components/statistics.js';
import Checkout from './components/checkout.js';
import Checkin from './components/checkin.js';
import ManageStaff from './components/managestaff.js';
import StaffPayments from './components/staffpayments.js';
import { BrowserRouter, Routes, Route } from "react-router-dom";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<LoginPage />} />
        <Route path="/dashboard" element={ <Dashboard /> } />
        <Route path="/dashboard/statistics" element={ <Dashboard /> } />
        <Route path="/dashboard/checkin" element={ <Checkin /> } />
        <Route path="/dashboard/checkout" element={ <Checkout /> } />
        <Route path="/dashboard/manage-hotel" element={ <ManageHotel /> } />
        <Route path="/dashboard/customer-records" element={ <CustomerRecords /> } />
        <Route path="/dashboard/manage-food" element={ <ManageFood /> } />
        <Route path="/dashboard/manage-rooms" element={ <ManageRooms /> } />
        <Route path="/dashboard/manage-staff" element={ <ManageStaff /> } />
        <Route path="/dashboard/staff-payments" element={ <StaffPayments /> } />
        <Route path="/set-hotel-details" element={ <HotelDetails /> }/>
        <Route path="*" element={<div> 404 </div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
