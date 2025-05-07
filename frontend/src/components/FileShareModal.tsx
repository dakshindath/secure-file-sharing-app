import React, { useState } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  Typography,
  Divider,
  Switch,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import axios from 'axios';

interface FileShareModalProps {
  open: boolean;
  onClose: () => void;
  file: any; // File object with id, name, etc.
}

const FileShareModal: React.FC<FileShareModalProps> = ({ open, onClose, file }) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [expiryHours, setExpiryHours] = useState(24);
  const [passwordProtect, setPasswordProtect] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareOtp, setShareOtp] = useState('');
  const [emailSendFailed, setEmailSendFailed] = useState(false);

  const handleClose = () => {
    // Reset form when closing
    setRecipientEmail('');
    setPermission('view');
    setExpiryHours(24);
    setPasswordProtect(false);
    setPassword('');
    setError('');
    setShareLink('');
    onClose();
  };

  const validateForm = () => {
    if (!recipientEmail.trim()) {
      setError('Recipient email is required');
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(recipientEmail)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (passwordProtect && !password.trim()) {
      setError('Password is required when password protection is enabled');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleShare = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('Authentication token missing. Please log in again.');
        setLoading(false);
        return;
      }
      
      const response = await axios.post(
        'http://localhost:5000/api/shares',
        {
          fileId: file._id || file.id,
          recipientEmail,
          permission,
          expiryHours,
          passwordProtect,
          password: passwordProtect ? password : undefined
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          }
        }
      );
      
      setShareLink(response.data.shareLink);
      
      // Check if email sending failed and display OTP if needed
      if (response.data.emailSent === false) {
        setEmailSendFailed(true);
        setShareOtp(response.data.otp);
      } else {
        setEmailSendFailed(false);
        setShareOtp('');
      }
      
      setLoading(false);
    } catch (error: any) {
      console.error('Error sharing file:', error);
      setError(error.response?.data?.message || 'Failed to share file. Please try again.');
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 3000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Share File
          {file && (
            <Typography variant="subtitle1" sx={{ mt: 1 }}>
              {file.originalName}
            </Typography>
          )}
        </DialogTitle>
        
        <DialogContent>
          {!shareLink ? (
            <Box sx={{ mt: 1 }}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              
              <FormControl fullWidth margin="normal">
                <TextField
                  label="Recipient Email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  type="email"
                />
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="permission-label">Permission</InputLabel>
                <Select
                  labelId="permission-label"
                  value={permission}
                  onChange={(e) => setPermission(e.target.value)}
                  label="Permission"
                >
                  <MenuItem value="view">View Only</MenuItem>
                  <MenuItem value="download">Allow Download</MenuItem>
                  <MenuItem value="edit">Allow Edit</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="expiry-label">Link Expires After</InputLabel>
                <Select
                  labelId="expiry-label"
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(Number(e.target.value))}
                  label="Link Expires After"
                >
                  <MenuItem value={1}>1 hour</MenuItem>
                  <MenuItem value={24}>1 day</MenuItem>
                  <MenuItem value={72}>3 days</MenuItem>
                  <MenuItem value={168}>1 week</MenuItem>
                </Select>
              </FormControl>
              
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={passwordProtect} 
                      onChange={(e) => setPasswordProtect(e.target.checked)}
                    />
                  }
                  label="Password Protection"
                />
                
                {passwordProtect && (
                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              </Box>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              {emailSendFailed ? (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  File shared successfully, but the email notification couldn't be sent to {recipientEmail}. Please share the OTP code manually.
                </Alert>
              ) : (
                <Alert severity="success" sx={{ mb: 3 }}>
                  File shared successfully! An email with OTP verification has been sent to {recipientEmail}.
                </Alert>
              )}
              
              <Typography variant="subtitle1" gutterBottom>
                Share Link:
              </Typography>
              
              <TextField
                fullWidth
                value={shareLink}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={copyToClipboard} edge="end" title="Copy to clipboard">
                        <ContentCopyIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              
              {emailSendFailed && shareOtp && (
                <Box sx={{ mt: 3, mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    Verification Code (OTP):
                  </Typography>
                  
                  <TextField
                    fullWidth
                    value={shareOtp}
                    variant="outlined"
                    InputProps={{
                      readOnly: true,
                      sx: { 
                        fontSize: '1.5rem', 
                        letterSpacing: '0.5rem',
                        fontWeight: 'bold',
                        textAlign: 'center'
                      },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton 
                            onClick={() => {
                              navigator.clipboard.writeText(shareOtp);
                              setLinkCopied(true);
                            }} 
                            edge="end" 
                            title="Copy to clipboard"
                          >
                            <ContentCopyIcon />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    Please provide this code to {recipientEmail} as they will need it to access the file.
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Recipient will need to verify their identity with an OTP 
                  {emailSendFailed ? ' that you provide to them ' : ' sent to their email '}
                  before they can access this file.
                </Typography>
                
                {passwordProtect && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Additionally, they will need to enter the password you've set.
                  </Typography>
                )}
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="body2">
                  <strong>Permission:</strong> {permission === 'view' ? 'View Only' : 
                    permission === 'download' ? 'Download Allowed' : 'Edit Allowed'}
                </Typography>
                
                <Typography variant="body2">
                  <strong>Expires:</strong> After {expiryHours === 1 ? '1 hour' : 
                    expiryHours === 24 ? '1 day' : 
                    expiryHours === 72 ? '3 days' : '1 week'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose}>
            {shareLink ? 'Close' : 'Cancel'}
          </Button>
          
          {!shareLink && (
            <Button 
              onClick={handleShare} 
              variant="contained" 
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : undefined}
            >
              {loading ? 'Sharing...' : 'Share File'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={linkCopied}
        autoHideDuration={3000}
        onClose={() => setLinkCopied(false)}
        message="Link copied to clipboard"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
};

export default FileShareModal;