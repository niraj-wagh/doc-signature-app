import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname.startsWith('/sign/') || location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-primary-600">
          SignFlow
        </Link>
        {user && (
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-gray-600 hover:text-primary-600">
              Dashboard
            </Link>
            <Link to="/upload" className="text-sm text-gray-600 hover:text-primary-600">
              Upload
            </Link>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm text-gray-700">{user.name}</span>
            <button onClick={handleLogout} className="btn-secondary text-sm">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
