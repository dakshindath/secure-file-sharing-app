import * as React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import { GoogleIcon, FacebookIcon } from './customicon';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Import the auth context

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  overflow: 'visible',
}));

const LoginContainer = styled(Stack)(({ theme }) => ({
  height: '100dvh',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
    theme.palette.mode === 'dark' 
      ? 'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 10%), hsl(0, 0%, 5%))'
      : 'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
  },
}));

export default function Login() {
  const navigate = useNavigate();
  const { login, clearAuth } = useAuth(); // Add clearAuth from useAuth hook
  const [errors, setErrors] = React.useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = React.useState(false);
  const [apiError, setApiError] = React.useState('');
  
  // Function to handle manual authentication reset
  const handleClearAuth = () => {
    clearAuth();
    window.location.reload(); // Reload the page to refresh the auth state
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError('');
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const newErrors = {
      email: '',
      password: '',
    };

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password || password.length < 8) {
      newErrors.password = 'Password must be at least 6 characters long.';
    }

    setErrors(newErrors);

    if (!Object.values(newErrors).some(Boolean)) {
      try {
        setLoading(true);
        
        const response = await axios.post('http://localhost:5000/api/auth/login', {
          email,
          password
        });
        
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        axios.defaults.headers.common['x-auth-token'] = response.data.token;
        
        // Update the auth context state
        login(response.data.token, response.data.user);
        
        setLoading(false);
        navigate('/home');
      } catch (error: any) {
        setLoading(false);
        setApiError(error.response?.data?.message || 'Invalid email or password');
        console.error('Login error:', error);
      }
    }
  };

  return (
    <LoginContainer direction="column" justifyContent="center">
      <Card variant="outlined">
        <Typography
          component="h1"
          variant="h4"
          sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
        >
          Sign in
        </Typography>

        {apiError && (
          <Typography color="error" sx={{ mt: 1, mb: 1 }}>
            {apiError}
          </Typography>
        )}
        
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <FormControl>
            <FormLabel htmlFor="email">Email</FormLabel>
            <TextField
              error={!!errors.email}
              helperText={errors.email}
              id="email"
              name="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              fullWidth
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="password">Password</FormLabel>
            <TextField
              error={!!errors.password}
              helperText={errors.password}
              id="password"
              name="password"
              type="password"
              placeholder="••••••"
              autoComplete="current-password"
              required
              fullWidth
            />
          </FormControl>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <FormControlLabel
              control={<Checkbox value="remember" color="primary" />}
              label="Remember me"
            />
            <Link component={RouterLink} to="/forgot-password" variant="body2">
              Forgot password?
            </Link>
          </Box>

          <Button 
            type="submit" 
            fullWidth 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </Box>

        <Divider>or</Divider>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => alert('Sign in with Google')}
            startIcon={<GoogleIcon />}
          >
            Sign in with Google
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => alert('Sign in with Facebook')}
            startIcon={<FacebookIcon />}
          >
            Sign in with Facebook
          </Button>
        </Box>
        
        <Box sx={{ mt: 3, mb: 2 }}>
          <Typography sx={{ textAlign: 'center' }}>
            Don't have an account?{' '}
            <Link component={RouterLink} to="/signup" variant="body2">
              Sign up
            </Link>
          </Typography>
        </Box>
        
        {/* Add a discreet button for clearing authentication state */}
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="text" 
            color="inherit" 
            size="small"
            onClick={handleClearAuth}
            sx={{ fontSize: '0.7rem', color: 'text.secondary' }}
          >
            Having trouble? Reset authentication
          </Button>
        </Box>
      </Card>
    </LoginContainer>
  );
}