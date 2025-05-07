import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Divider,
  InputAdornment,
  IconButton,
  Stack,
  Chip
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DescriptionIcon from '@mui/icons-material/Description';
import ThemeWrapper from './ThemeWrapper';
import axios from 'axios';

// Steps for the file access process
const steps = ['Verify Share', 'Enter OTP', 'Access File'];

const SharedFileAccess: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareInfo, setShareInfo] = useState<any>(null);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [permissionLevel, setPermissionLevel] = useState('');
  
  // Initialize by verifying the share exists
  useEffect(() => {
    const verifyShare = async () => {
      if (!shareId) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }
      
      try {
        const response = await axios.get(`http://localhost:5000/api/shares/verify/${shareId}`);
        setShareInfo(response.data);
        setActiveStep(1); // Move to OTP step if share exists
        setLoading(false);
      } catch (error: any) {
        console.error('Error verifying share:', error);
        setError(error.response?.data?.message || 'This share link is invalid or has expired');
        setLoading(false);
      }
    };
    
    verifyShare();
  }, [shareId]);
  
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numeric values
    const value = e.target.value.replace(/[^0-9]/g, '');
    setOtp(value);
  };
  
  const handlePasswordToggle = () => {
    setShowPassword(!showPassword);
  };
  
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setLoading(true);
    
    try {
      const data: any = {
        otp
      };
      
      if (shareInfo.isPasswordProtected && password) {
        data.password = password;
      }
      
      const response = await axios.post(
        `http://localhost:5000/api/shares/access/${shareId}`,
        data
      );
      
      setAccessToken(response.data.accessToken);
      setFileInfo(response.data.file);
      
      // Store the permission level to conditionally show/hide download button
      setPermissionLevel(response.data.permission);
      
      setActiveStep(2); // Move to file access step
      setError('');
    } catch (error: any) {
      console.error('OTP verification error:', error);
      setError(error.response?.data?.message || 'Invalid OTP or password');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownloadFile = async () => {
    if (!fileInfo || !accessToken) return;
    
    try {
      setLoading(true);
      
      // Create download URL
      const downloadUrl = `http://localhost:5000/api/shares/download/${shareId}`;
      
      console.log('Starting download with access token:', accessToken);
      console.log('File info:', JSON.stringify(fileInfo, null, 2));
      
      // Use axios to get the file with proper headers
      const response = await axios({
        url: downloadUrl,
        method: 'GET',
        responseType: 'blob',
        headers: {
          'x-access-token': accessToken
        }
      });
      
      console.log('Download response received:', response.status);
      
      // Create a blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      
      // Create and click a temporary download link
      const link = document.createElement('a');
      link.href = url;
      link.download = fileInfo.originalName || 'downloaded-file';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
      
    } catch (error: any) {
      console.error('Download error:', error);
      console.error('Error details:', error.response?.status, error.response?.data);
      setError(error.response?.data?.message || 'Failed to download file. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            {loading ? (
              <CircularProgress />
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            ) : (
              <Typography>Verifying share link...</Typography>
            )}
          </Box>
        );
      
      case 1:
        return (
          <Box sx={{ mt: 3 }}>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            
            <Typography variant="h6" gutterBottom>
              File Access Verification
            </Typography>
            
            {shareInfo && (
              <Box sx={{ mb: 3 }}>
                <Stack spacing={2} direction="row" alignItems="center" sx={{ mb: 2 }}>
                  <DescriptionIcon color="primary" />
                  <Typography variant="body1">{shareInfo.fileName}</Typography>
                  {shareInfo.fileSize && (
                    <Chip 
                      label={`${formatBytes(shareInfo.fileSize)}`} 
                      size="small" 
                      variant="outlined"
                    />
                  )}
                </Stack>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  This file was shared with you. Please enter the OTP sent to your email to access it.
                </Typography>
                
                <Divider sx={{ my: 2 }} />
              </Box>
            )}
            
            <TextField
              label="One-Time Password (OTP)"
              placeholder="Enter 6-digit OTP"
              fullWidth
              value={otp}
              onChange={handleOtpChange}
              inputProps={{ maxLength: 6 }}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            
            {shareInfo?.isPasswordProtected && (
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handlePasswordToggle}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
            
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6 || loading || (shareInfo?.isPasswordProtected && !password)}
              sx={{ mt: 3 }}
              startIcon={loading ? <CircularProgress size={20} /> : undefined}
            >
              {loading ? 'Verifying...' : 'Verify and Access File'}
            </Button>
          </Box>
        );
      
      case 2:
        return (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              Verification successful! You now have access to the file.
            </Alert>
            
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                mb: 3, 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <DescriptionIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                {fileInfo?.originalName || 'File'}
              </Typography>
              
              {fileInfo?.size && (
                <Chip 
                  label={formatBytes(fileInfo.size)} 
                  size="small" 
                  sx={{ mb: 2 }}
                />
              )}
              
              <Divider sx={{ width: '100%', my: 2 }} />
              
              {permissionLevel !== 'view' ? (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleDownloadFile}
                  disabled={loading || !fileInfo}
                  sx={{ mt: 2 }}
                >
                  {loading ? 'Downloading...' : 'Download File'}
                </Button>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  This file was shared with view-only permission and cannot be downloaded.
                </Alert>
              )}
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                You can download this file as long as the share remains active.
              </Typography>
            </Paper>
          </Box>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <ThemeWrapper>
      <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" align="center" gutterBottom>
            Secure File Access
          </Typography>
          
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {renderStepContent()}
        </Paper>
      </Box>
    </ThemeWrapper>
  );
};

export default SharedFileAccess;