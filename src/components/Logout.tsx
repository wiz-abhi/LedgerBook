// Logout.js
import React from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

function Logout() {
  const signOut = useAuthStore((state) => state.signOut);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login'); // Redirect to login after logout
  };

  return <button onClick={handleLogout}>Logout</button>;
}

export default Logout;
