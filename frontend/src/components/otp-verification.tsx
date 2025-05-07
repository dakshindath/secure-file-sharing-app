import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import ThemeWrapper from './ThemeWrapper';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

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

const OtpContainer = styled(Stack)(({ theme }) => ({
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
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
  },
}));

const OtpInput = styled('input')(({ theme }) => ({
  width: '50px',
  height: '50px',
  textAlign: 'center',
  fontSize: '24px',
  margin: theme.spacing(0, 0.5),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  '&:focus': {
    borderColor: theme.palette.primary.main,
    outline: 'none',
  },
}));

export default function OtpVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = React.useState(['', '', '', '', '', '']);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [countdown, setCountdown] = React.useState(30);
  const [isResendDisabled, setIsResendDisabled] = React.useState(true);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    // Initialize the input refs array
    inputRefs.current = inputRefs.current.slice(0, 6);
    
    // Focus on the first input when component mounts
    if (inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
    
    // Start countdown for resend button
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    
    // Only allow numeric input
    if (value && !/^\d+$/.test(value)) {
      return;
    }
    
    // Update OTP state
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take the last character if multiple are pasted
    setOtp(newOtp);
    
    // Auto-focus next input if current one is filled
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Handle backspace to move to previous input
    if (e.key === 'Backspace' && index > 0 && !otp[index] && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    
    // Check if pasted content is numeric and has right length
    if (/^\d+$/.test(pastedData)) {
      const pastedOtp = pastedData.slice(0, 6).split('');
      const newOtp = [...otp];
      
      pastedOtp.forEach((digit, index) => {
        if (index < 6) {
          newOtp[index] = digit;
        }
      });
      
      setOtp(newOtp);
      
      // Focus the next empty input or the last one if all filled
      const nextEmptyIndex = newOtp.findIndex(digit => !digit);
      if (nextEmptyIndex !== -1 && inputRefs.current[nextEmptyIndex]) {
        inputRefs.current[nextEmptyIndex]?.focus();
      } else if (inputRefs.current[5]) {
        inputRefs.current[5]?.focus();
      }
    }
  };

  const handleResendOtp = async () => {
    // Reset countdown and disable resend button
    setCountdown(60);
    setIsResendDisabled(true);
    
    // Start countdown again
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    const email = location.state?.email || '';
    
    if (!email) {
      setError('Email information is missing. Please go back to signup.');
      return;
    }
    
    try {
      // Resend OTP by calling signup endpoint again
      await axios.post('http://localhost:5000/api/auth/signup', {
        email,
        // We need to send these fields but they'll be ignored for existing users
        username: 'resend',
        phone: 'resend',
        password: 'resend'
      });
      
      setError('');
    } catch (error: any) {
      setError('Failed to resend OTP. Please try again.');
      console.error('Resend OTP error:', error);
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    // Get email from location state or use an empty string as fallback
    const email = location.state?.email || '';
    
    if (!email) {
      setError('Email information is missing. Please go back to signup.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Make API call directly from component
      await axios.post('http://localhost:5000/api/auth/verify-otp', {
        email,
        otp: otpString
      });
      
      setLoading(false);
      setError('');
      navigate('/signin', { state: { email } });
    } catch (error: any) {
      setLoading(false);
      setError(error.response?.data?.message || 'Invalid OTP. Please try again.');
      console.error('OTP verification error:', error);
    }
  };

  // Create refs for each input field
  const setInputRef = (el: HTMLInputElement | null, index: number) => {
    inputRefs.current[index] = el;
  };

  return (
    <ThemeWrapper>
      <OtpContainer direction="column" justifyContent="center">
        <Card variant="outlined">
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(1.6rem, 10vw, 2.15rem)' }}
          >
            Verify your identity
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            We've sent a 6-digit verification code to 
            {location.state?.email ? ` ${location.state.email}` : ' your email'}
          </Typography>
          
          <FormControl>
            <FormLabel htmlFor="otp-input" sx={{ mb: 1 }}>Enter verification code</FormLabel>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
              {otp.map((digit, index) => (
                <OtpInput
                  key={index}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  ref={(el) => setInputRef(el, index)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              ))}
            </Box>
            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                {error}
              </Typography>
            )}
          </FormControl>
          
          <Button
            fullWidth
            variant="contained"
            onClick={handleVerifyOtp}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Typography variant="body2">
              Didn't receive the code?{' '}
              <Button
                variant="text"
                disabled={isResendDisabled}
                onClick={handleResendOtp}
                sx={{ minWidth: 'auto', p: 0, fontWeight: 600, fontSize: 'inherit' }}
              >
                {isResendDisabled ? `Resend in ${countdown}s` : 'Resend'}
              </Button>
            </Typography>
          </Box>
        </Card>
      </OtpContainer>
    </ThemeWrapper>
  );
}