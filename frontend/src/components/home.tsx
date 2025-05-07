import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import ThemeWrapper from './ThemeWrapper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import LogoutIcon from '@mui/icons-material/Logout';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ShareIcon from '@mui/icons-material/Share';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUpload from './FileUpload';
import FileShareModal from './FileShareModal';
import axios from 'axios';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import { useAuth } from '../context/AuthContext'; // Add this import

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      style={{ width: '100%' }}
    >
      {value === index && (
        <Box sx={{ py: 3, px: { xs: 1, sm: 2 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { logout } = useAuth(); // Get logout function from AuthContext
  const [tabValue, setTabValue] = useState(0);
  const [files, setFiles] = useState<any[]>([]);
  const [sharedFiles, setSharedFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    total: 1073741824, // 1GB default
    percentUsed: 0
  });
  
  // File sharing state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<any>(null);
  const [deletingFile, setDeletingFile] = useState(false);
  
  // Notification snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Revoke share confirmation dialog state
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [shareToRevoke, setShareToRevoke] = useState<any>(null);
  const [revokingShare, setRevokingShare] = useState(false);
  
  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken'); // Changed from 'token' to 'authToken'
    if (!token) {
      navigate('/signin');
      return;
    }
    
    // Fetch user files and storage info
    fetchUserData();
  }, [navigate]);
  
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken'); // Changed from 'token' to 'authToken'
      
      const [filesResponse, sharesResponse, userResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/files', {
          headers: { 'x-auth-token': token }
        }),
        axios.get('http://localhost:5000/api/shares', {
          headers: { 'x-auth-token': token }
        }),
        axios.get('http://localhost:5000/api/auth/profile', {
          headers: { 'x-auth-token': token }
        })
      ]);
      
      setFiles(filesResponse.data);
      setSharedFiles(sharesResponse.data);
      
      // Calculate storage percentage
      const used = userResponse.data.storageUsed || 0;
      const total = userResponse.data.storageLimit || 1073741824;
      const percentUsed = Math.round((used / total) * 100);
      
      setStorageInfo({
        used,
        total,
        percentUsed
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load your files. Please try again later.');
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    // Use the context's logout function which properly clears all auth state
    logout();
    
    // Force a page reload to reset all component states
    window.location.href = '/signin';
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleUploadComplete = (fileData: any) => {
    // Update files list after successful upload
    setFiles(prevFiles => [fileData.file, ...prevFiles]);
    
    // Refresh all data to get updated storage info
    fetchUserData();
    
    // Show success notification
    setSnackbarMessage('File uploaded successfully');
    setSnackbarOpen(true);
  };
  
  const handleShareClick = (file: any) => {
    setSelectedFile(file);
    setShareModalOpen(true);
  };
  
  const handleShareComplete = () => {
    // Refresh shares after completion
    fetchUserData();
    setShareModalOpen(false);
  };
  
  const handleDeleteClick = (file: any) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    
    setDeletingFile(true);
    
    try {
      const token = localStorage.getItem('authToken'); // Changed from 'token' to 'authToken'
      
      await axios.delete(`http://localhost:5000/api/files/${fileToDelete._id}`, {
        headers: { 'x-auth-token': token }
      });
      
      // Remove file from state
      setFiles(prevFiles => prevFiles.filter(f => f._id !== fileToDelete._id));
      
      // Update storage info
      fetchUserData();
      
      // Show success notification
      setSnackbarMessage('File deleted successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error deleting file:', error);
      setSnackbarMessage('Failed to delete file');
      setSnackbarOpen(true);
    } finally {
      setDeletingFile(false);
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };
  
  const handleRevokeClick = (share: any) => {
    setShareToRevoke(share);
    setRevokeDialogOpen(true);
  };
  
  const handleRevokeConfirm = async () => {
    if (!shareToRevoke) return;
    
    setRevokingShare(true);
    
    try {
      const token = localStorage.getItem('authToken'); // Changed from 'token' to 'authToken'
      
      await axios.delete(`http://localhost:5000/api/shares/${shareToRevoke._id}`, {
        headers: { 'x-auth-token': token }
      });
      
      // Update share in state
      setSharedFiles(prevShares => 
        prevShares.map(s => 
          s._id === shareToRevoke._id ? { ...s, isRevoked: true } : s
        )
      );
      
      // Show success notification
      setSnackbarMessage('Share revoked successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error revoking share:', error);
      setSnackbarMessage('Failed to revoke share');
      setSnackbarOpen(true);
    } finally {
      setRevokingShare(false);
      setRevokeDialogOpen(false);
      setShareToRevoke(null);
    }
  };
  
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <ThemeWrapper>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Secure File Sharing
            </Typography>
            <IconButton color="inherit" onClick={handleLogout} title="Logout">
              <LogoutIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        
        <Box
          sx={{
            flex: 1,
            padding: 2,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Storage Info */}
          <Paper 
            elevation={1} 
            sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary">
                Storage Used: {formatBytes(storageInfo.used)} of {formatBytes(storageInfo.total)} ({storageInfo.percentUsed}%)
              </Typography>
              <Box 
                sx={{ 
                  height: 6, 
                  width: '100%', 
                  bgcolor: 'grey.200', 
                  borderRadius: 3, 
                  mt: 1,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <Box 
                  sx={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: `${storageInfo.percentUsed}%`,
                    bgcolor: storageInfo.percentUsed > 90 ? 'error.main' : 'primary.main',
                    borderRadius: 3,
                  }} 
                />
              </Box>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<CloudUploadIcon />}
              onClick={() => setTabValue(1)}
            >
              Upload Files
            </Button>
          </Paper>
          
          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {/* Tabs and Content */}
          <Box sx={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="file management tabs">
                <Tab label="My Files" id="tab-0" aria-controls="tabpanel-0" />
                <Tab label="Upload" id="tab-1" aria-controls="tabpanel-1" />
                <Tab label="Shared Files" id="tab-2" aria-controls="tabpanel-2" />
              </Tabs>
            </Box>
            
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <TabPanel value={tabValue} index={0}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : files.length > 0 ? (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Your Files</Typography>
                    <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                      <Box component="thead">
                        <Box component="tr" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                          <Box component="th" sx={{ textAlign: 'left', p: 1.5 }}>Name</Box>
                          <Box component="th" sx={{ textAlign: 'left', p: 1.5 }}>Size</Box>
                          <Box component="th" sx={{ textAlign: 'left', p: 1.5 }}>Uploaded</Box>
                          <Box component="th" sx={{ textAlign: 'center', p: 1.5 }}>Actions</Box>
                        </Box>
                      </Box>
                      <Box component="tbody">
                        {files.map((file) => (
                          <Box 
                            component="tr" 
                            key={file._id || file.id}
                            sx={{ '&:hover': { bgcolor: 'action.hover' }, borderBottom: '1px solid', borderColor: 'divider' }}
                          >
                            <Box component="td" sx={{ p: 1.5 }}>{file.originalName}</Box>
                            <Box component="td" sx={{ p: 1.5 }}>{formatBytes(file.size)}</Box>
                            <Box component="td" sx={{ p: 1.5 }}>{formatDate(file.createdAt)}</Box>
                            <Box component="td" sx={{ p: 1.5, textAlign: 'center' }}>
                              <Button
                                variant="outlined"
                                size="small"
                                sx={{ mr: 1 }}
                                startIcon={<CloudDownloadIcon />}
                                onClick={async () => {
                                  try {
                                    const token = localStorage.getItem('authToken');
                                    if (token) {
                                      // Use axios with proper headers instead of a direct link
                                      const response = await axios({
                                        url: `http://localhost:5000/api/files/download/${file._id || file.id}`,
                                        method: 'GET',
                                        responseType: 'blob',
                                        headers: {
                                          'x-auth-token': token
                                        }
                                      });
                                      
                                      // Create a blob URL and trigger download
                                      const blob = new Blob([response.data]);
                                      const url = window.URL.createObjectURL(blob);
                                      
                                      // Create and click a temporary download link
                                      const link = document.createElement('a');
                                      link.href = url;
                                      link.download = file.originalName;
                                      document.body.appendChild(link);
                                      link.click();
                                      
                                      // Clean up
                                      setTimeout(() => {
                                        window.URL.revokeObjectURL(url);
                                        document.body.removeChild(link);
                                      }, 100);
                                    }
                                  } catch (error) {
                                    console.error('Download error:', error);
                                    alert('Failed to download file. Please try again.');
                                  }
                                }}
                              >
                                Download
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                color="secondary"
                                sx={{ mr: 1 }}
                                startIcon={<ShareIcon />}
                                onClick={() => handleShareClick(file)}
                              >
                                Share
                              </Button>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteClick(file)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>You don't have any files yet</Typography>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={() => setTabValue(1)}
                      startIcon={<CloudUploadIcon />}
                    >
                      Upload your first file
                    </Button>
                  </Box>
                )}
              </TabPanel>
              
              <TabPanel value={tabValue} index={1}>
                <Typography variant="h6" sx={{ mb: 3 }}>Upload Files</Typography>
                <FileUpload onUploadComplete={handleUploadComplete} />
              </TabPanel>
              
              <TabPanel value={tabValue} index={2}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : sharedFiles.length > 0 ? (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Files You've Shared</Typography>
                    <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                      <Box component="thead">
                        <Box component="tr" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                          <Box component="th" sx={{ textAlign: 'left', p: 1.5 }}>File</Box>
                          <Box component="th" sx={{ textAlign: 'left', p: 1.5 }}>Shared With</Box>
                          <Box component="th" sx={{ textAlign: 'left', p: 1.5 }}>Expires</Box>
                          <Box component="th" sx={{ textAlign: 'center', p: 1.5 }}>Status</Box>
                          <Box component="th" sx={{ textAlign: 'center', p: 1.5 }}>Actions</Box>
                        </Box>
                      </Box>
                      <Box component="tbody">
                        {sharedFiles.map((share) => (
                          <Box 
                            component="tr" 
                            key={share._id}
                            sx={{ '&:hover': { bgcolor: 'action.hover' }, borderBottom: '1px solid', borderColor: 'divider' }}
                          >
                            <Box component="td" sx={{ p: 1.5 }}>
                              {share.file?.originalName || 'Unknown file'}
                            </Box>
                            <Box component="td" sx={{ p: 1.5 }}>{share.recipientEmail}</Box>
                            <Box component="td" sx={{ p: 1.5 }}>{formatDate(share.expiresAt)}</Box>
                            <Box component="td" sx={{ p: 1.5, textAlign: 'center' }}>
                              {share.isRevoked ? (
                                <Typography variant="body2" color="error">Revoked</Typography>
                              ) : new Date(share.expiresAt) < new Date() ? (
                                <Typography variant="body2" color="warning.main">Expired</Typography>
                              ) : (
                                <Typography variant="body2" color="success.main">Active</Typography>
                              )}
                            </Box>
                            <Box component="td" sx={{ p: 1.5, textAlign: 'center' }}>
                              <Button
                                variant="outlined"
                                size="small"
                                color="error"
                                disabled={share.isRevoked || new Date(share.expiresAt) < new Date()}
                                onClick={() => handleRevokeClick(share)}
                              >
                                Revoke
                              </Button>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>You haven't shared any files yet</Typography>
                    <Typography variant="body1">
                      Upload files and share them securely with OTP verification
                    </Typography>
                  </Box>
                )}
              </TabPanel>
            </Box>
          </Box>
        </Box>
      </Box>
      
      {/* File Share Modal */}
      {selectedFile && (
        <FileShareModal 
          open={shareModalOpen} 
          onClose={handleShareComplete} 
          file={selectedFile} 
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete File</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{fileToDelete?.originalName}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deletingFile}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deletingFile}
            startIcon={deletingFile ? <CircularProgress size={16} /> : undefined}
          >
            {deletingFile ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Revoke Share Confirmation Dialog */}
      <Dialog
        open={revokeDialogOpen}
        onClose={() => setRevokeDialogOpen(false)}
      >
        <DialogTitle>Revoke Share</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to revoke access for {shareToRevoke?.recipientEmail}? 
            They will no longer be able to access this file.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeDialogOpen(false)} disabled={revokingShare}>
            Cancel
          </Button>
          <Button 
            onClick={handleRevokeConfirm} 
            color="error" 
            variant="contained"
            disabled={revokingShare}
            startIcon={revokingShare ? <CircularProgress size={16} /> : undefined}
          >
            {revokingShare ? 'Revoking...' : 'Revoke Access'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </ThemeWrapper>
  );
}