import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// Define types for our context
interface User {
  _id: string;
  name: string;
  email: string;
  // Add other user properties as needed
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
  clearAuth: () => void; // Added new function to clear auth
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  loading: true,
  clearAuth: () => {}, // Added to default context
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Function to clear authentication state - useful for debugging and testing
  const clearAuth = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    delete axios.defaults.headers.common['x-auth-token'];
    console.log("Auth cleared manually");
  };

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          
          // Validate the token by making a request to your backend
          try {
            // Try to validate token with a backend request
            // Using void to acknowledge we're ignoring the response intentionally
            await axios.get('http://localhost:5000/api/auth/validate', {
              headers: { 'x-auth-token': storedToken }
            });
            
            // If request is successful, token is valid
            setToken(storedToken);
            setUser(parsedUser);
            setIsAuthenticated(true);
            
            // Set default auth header for axios
            axios.defaults.headers.common['x-auth-token'] = storedToken;
            
            console.log("Auth initialized: User is authenticated");
          } catch (validationError) {
            // Token validation failed
            console.error('Token validation failed:', validationError);
            clearAuth(); // Clear invalid auth data
          }
        } catch (error) {
          // If there's an error parsing the user data, clear the storage
          clearAuth();
          console.error('Error initializing auth state:', error);
        }
      } else {
        // No token or user in storage, ensure we're not authenticated
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        console.log("Auth initialized: No stored credentials found");
      }
      
      // Set loading to false regardless of outcome
      setLoading(false);
    };
    
    initializeAuth();
  }, []);

  // Login function
  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    
    // Set default auth header for axios
    axios.defaults.headers.common['x-auth-token'] = newToken;
    
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);
  };

  // Logout function with improved cleanup
  const logout = () => {
    console.log("Logout called - clearing authentication state");
    
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Remove auth header from axios defaults
    delete axios.defaults.headers.common['x-auth-token'];
    
    // Reset context state
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // Add a small delay to help prevent navigation issues
    setTimeout(() => {
      console.log("Authentication state cleared successfully");
    }, 100);
  };

  // Value to be provided by the context
  const value = {
    isAuthenticated,
    user,
    token,
    login,
    logout,
    loading,
    clearAuth, // Expose clearAuth function to components
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;