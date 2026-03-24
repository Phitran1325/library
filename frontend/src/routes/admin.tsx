import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import BookManagement from '../pages/admin/BookManagement';
import StaffManagement from '../pages/admin/StaffManagement';
import CustomerManagement from '../pages/admin/CustomerManagement';
import OrderManagement from '../pages/admin/OrderManagement';
import InventoryManagement from '../pages/admin/InventoryManagement';
import AdminSettings from '../pages/admin/AdminSettings';


const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="books" element={<BookManagement />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="customers" element={<CustomerManagement />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="inventory" element={<InventoryManagement />} />
        <Route path="settings" element={<AdminSettings />} />
        
        
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
