import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { LoadingSpinner } from './components/common';

// Auth pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

import Favorites from './pages/client/Favorites';

// Client pages
import ClientHome from './pages/client/Home';
import ClientStores from './pages/client/Stores';
import ClientStoreDetail from './pages/client/StoreDetail';
import ClientCart from './pages/client/Cart';
import ClientCheckout from './pages/client/Checkout';
import ClientOrders from './pages/client/Orders';
import ClientOrderTracking from './pages/client/OrderTracking';
import ClientProfile from './pages/client/Profile';

// Driver pages
import DriverDashboard from './pages/driver/Dashboard';
import DriverOrders from './pages/driver/Orders';
import DriverOrderDetail from './pages/driver/OrderDetail';
import DriverEarnings from './pages/driver/Earnings';
import DriverProfile from './pages/driver/Profile';

// Store pages
import StoreDashboard from './pages/store/Dashboard';
import StoreOrders from './pages/store/Orders';
import StoreProducts from './pages/store/Products';
import StoreProfile from './pages/store/Profile';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminStores from './pages/admin/Stores';
import AdminStoreManagement from './pages/admin/StoreManagement';
import AdminDrivers from './pages/admin/Drivers';
import AdminOrders from './pages/admin/Orders';
import AdminCoupons from './pages/admin/Coupons';
import AdminCoverage from './pages/admin/Coverage';
import AdminSupport from './pages/admin/Support';
import AdminConfig from './pages/admin/Config';
import BrandingConfig from './pages/superadmin/BrandingConfig';

// Ally Admin pages
import AllyAdminDashboard from './pages/ally-admin/Dashboard';
import AllyAdminStore from './pages/ally-admin/Store';
import AllyAdminOrders from './pages/ally-admin/Orders';
import AllyAdminDrivers from './pages/ally-admin/Drivers';
import AllyAdminSettings from './pages/ally-admin/Settings';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to={getRoleHomePath(profile.role)} replace />;
  }

  return children;
};

const getRoleHomePath = (role) => {
  switch (role) {
    case 'client':
      return '/';
    case 'delivery_driver':
      return '/driver';
    case 'store':
      return '/store';
    case 'super_admin':
      return '/admin';
    case 'ally_admin':
      return '/ally-admin';
    default:
      return '/';
  }
};

const AppRoutes = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/favorites" element={<Favorites />} />
      {/* Auth Routes */}
      <Route
        path="/auth/login"
        element={user ? <Navigate to={getRoleHomePath(profile?.role)} replace /> : <Login />}
      />
      <Route
        path="/auth/signup"
        element={user ? <Navigate to={getRoleHomePath(profile?.role)} replace /> : <Signup />}
      />
      {/* Legacy redirects */}
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />

      {/* ========================================== */}
      {/* CLIENT ROUTES (ZONA PÚBLICA / INVITADOS) */}
      {/* ========================================== */}
      <Route 
        path="/" 
        element={
          user && profile && profile.role !== 'client' 
            ? <Navigate to={getRoleHomePath(profile.role)} replace /> 
            : <ClientHome />
        } 
      />
      <Route path="/stores" element={<ClientStores />} />
      <Route path="/stores/:storeId" element={<ClientStoreDetail />} />

      {/* ========================================== */}
      {/* CLIENT ROUTES (ZONA PRIVADA) */}
      {/* ========================================== */}
      <Route
        path="/cart"
        element={
          <ProtectedRoute allowedRoles={['client']}>
            <ClientCart />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute allowedRoles={['client']}>
            <ClientCheckout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute allowedRoles={['client']}>
            <ClientOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:orderId"
        element={
          <ProtectedRoute allowedRoles={['client']}>
            <ClientOrderTracking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['client']}>
            <ClientProfile />
          </ProtectedRoute>
        }
      />

      {/* Driver Routes */}
      <Route
        path="/driver"
        element={
          <ProtectedRoute allowedRoles={['delivery_driver']}>
            <DriverDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/orders"
        element={
          <ProtectedRoute allowedRoles={['delivery_driver']}>
            <DriverOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/orders/:orderId"
        element={
          <ProtectedRoute allowedRoles={['delivery_driver']}>
            <DriverOrderDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/earnings"
        element={
          <ProtectedRoute allowedRoles={['delivery_driver']}>
            <DriverEarnings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/profile"
        element={
          <ProtectedRoute allowedRoles={['delivery_driver']}>
            <DriverProfile />
          </ProtectedRoute>
        }
      />

      {/* Store Routes */}
      <Route
        path="/store"
        element={
          <ProtectedRoute allowedRoles={['store']}>
            <StoreDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/store/orders"
        element={
          <ProtectedRoute allowedRoles={['store']}>
            <StoreOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/store/products"
        element={
          <ProtectedRoute allowedRoles={['store']}>
            <StoreProducts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/store/profile"
        element={
          <ProtectedRoute allowedRoles={['store']}>
            <StoreProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/store/drivers"
        element={
          <ProtectedRoute allowedRoles={['store', 'ally_admin']}>
            <AllyAdminDrivers />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/stores"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminStores />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/store-management"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminStoreManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/drivers"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminDrivers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/coupons"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminCoupons />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/coverage"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminCoverage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/support"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminSupport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/config"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminConfig />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/branding"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <BrandingConfig />
          </ProtectedRoute>
        }
      />

      {/* Ally Admin Routes */}
      <Route
        path="/ally-admin"
        element={
          <ProtectedRoute allowedRoles={['ally_admin']}>
            <AllyAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ally-admin/store"
        element={
          <ProtectedRoute allowedRoles={['ally_admin']}>
            <AllyAdminStore />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ally-admin/orders"
        element={
          <ProtectedRoute allowedRoles={['ally_admin']}>
            <AllyAdminOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ally-admin/drivers"
        element={
          <ProtectedRoute allowedRoles={['ally_admin']}>
            <AllyAdminDrivers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ally-admin/settings"
        element={
          <ProtectedRoute allowedRoles={['ally_admin']}>
            <AllyAdminSettings />
          </ProtectedRoute>
        }
      />

      {/* Catch all - Si no está logueado y se pierde, lo mandamos al Home público en vez de al Login */}
      <Route
        path="*"
        element={
          user ? (
            <Navigate to={getRoleHomePath(profile?.role)} replace />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '12px',
                padding: '16px',
              },
            }}
          />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}