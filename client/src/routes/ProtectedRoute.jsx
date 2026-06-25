import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        {/* Loading Spinner */}
        <div className="h-10 w-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <span className="font-display font-medium text-sm tracking-wide">
          Verifying Identity session...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page if unauthenticated
    return <Navigate to="/login" replace />;
  }

  return children;
};
export default ProtectedRoute;
