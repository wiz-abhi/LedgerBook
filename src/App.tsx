import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from './store/authStore'; // your store
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/CustomerList';
import CustomerDetails from './pages/CustomerDetails';
import Logout from './components/Logout'; // Assuming you have a Logout component
import Villages from './pages/Villages';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  const initialize = useAuthStore((state) => state.initialize);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      await initialize(); // Wait for auth state initialization
      setLoading(false);  // Set loading state to false once initialized
    };
    initializeAuth();
  }, [initialize]);

  if (loading) {
    return <div>Loading...</div>; // Or your loading spinner
  }

  return (
    <BrowserRouter>
      <div>
        {/* Navbar with Flexbox Layout */}
        {isAuthenticated && (
          <nav style={styles.nav}>
            <div style={styles.navLeft}>
              <Link to="/" style={styles.navLink}>Dashboard</Link>
              <Logout />
            </div>
            <div style={styles.navRight}>
              <Link to="/customers" style={styles.addCustomerButton}>Add Customer</Link>
            </div>
          </nav>
        )}
        
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <PrivateRoute>
                <CustomerList />
              </PrivateRoute>
            }
          />
          <Route
            path="/villages"
            element={
              <PrivateRoute>
                <Villages/>
              </PrivateRoute>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <PrivateRoute>
                <CustomerDetails />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#f5f5f5',
    borderBottom: '2px solid #ccc',
  },
  navLeft: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
  },
  navLink: {
    textDecoration: 'none',
    color: '#007bff',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  addCustomerButton: {
    textDecoration: 'none',
    padding: '8px 15px',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '5px',
    fontWeight: 'bold',
  },
};

export default App;
