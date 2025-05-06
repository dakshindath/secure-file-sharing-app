import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import ThemeWrapper from './ThemeWrapper';

export default function Home() {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    // Add logout logic here
    navigate('/signin');
  };

  return (
    <ThemeWrapper>
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 3,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>

          <Button variant="outlined" onClick={handleLogout}>
            Logout
          </Button>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          flex: 1
        }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Welcome to your Dashboard
          </Typography>
          <Typography variant="body1" gutterBottom>
            You have successfully logged in!
          </Typography>
        </Box>
      </Box>
    </ThemeWrapper>
  );
}