import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import SignUp from './components/signup';
import Login from './components/login';
import Home from './components/home';
import OtpVerification from './components/otp-verification';
import SharedFileAccess from './components/SharedFileAccess';
import { useAuth } from './context/AuthContext';
import ThemeWrapper from './components/ThemeWrapper';

// Simple loading component
const LoadingScreen = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <p>Loading application...</p>
  </div>
);

// Protected route component that redirects to login if not authenticated
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/signin" replace />;
};

// Auth route component that redirects to home if already authenticated
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [hasDelayed, setHasDelayed] = useState(false);
  
  // Debug log for authentication state during routing
  console.log(`Auth route check for ${location.pathname}:`, { isAuthenticated, loading });
  
  // Add a delay to avoid rapid redirects that can cause navigation throttling
  useEffect(() => {
    // Only start the delay timer if not loading
    if (!loading) {
      const timer = setTimeout(() => {
        setHasDelayed(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [loading]);
  
  // Show loading screen while auth is loading or waiting for delay
  if (loading || !hasDelayed) {
    return <LoadingScreen />;
  }
  
  // Once loaded and delayed, either redirect to home or show children
  return isAuthenticated ? <Navigate to="/home" replace /> : <>{children}</>;
};

const App = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <ThemeWrapper>
        <LoadingScreen />
      </ThemeWrapper>
    );
  }

  return (
    <ThemeWrapper>
      <Router>
        <Routes>
          {/* Default route */}
          <Route path="/" element={<Navigate to="/signin" replace />} />
          
          {/* Auth routes (for non-authenticated users) */}
          <Route path="/signin" element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/signup" element={<AuthRoute><SignUp /></AuthRoute>} />
          
          {/* Special case - OTP verification can be accessed by anyone */}
          <Route path="/verify-otp" element={<OtpVerification />} />
          
          {/* Protected routes (for authenticated users only) */}
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          
          {/* Public routes */}
          <Route path="/share/:shareId" element={<SharedFileAccess />} />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
      </Router>
    </ThemeWrapper>
  );
};

export default App;
