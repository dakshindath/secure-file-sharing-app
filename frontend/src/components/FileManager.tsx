import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import {
  Box,
  Button,
  Typography,
  Stack,
  TextField,
  LinearProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  FormControlLabel,
  Select,
  MenuItem,
  Checkbox,
  IconButton,
  Paper,
  Tabs,
  Tab,
  Tooltip,
  Alert,
  InputAdornment,
  CircularProgress,
  Snackbar
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  GetApp as DownloadIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Folder as FolderIcon,
  FileCopy as CopyIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import ThemeWrapper from './ThemeWrapper';

// Define the proper TypeScript interfaces
interface FileItem {
  _id: string;
  originalName: string;
  size: number;
  isEncrypted: boolean;
  createdAt: string;
  folder?: string;
}

interface ShareItem {
  _id: string;
  file: FileItem;
  recipientEmail: string;
  permission: string;
  expiresAt: string;
  isRevoked: boolean;
}

interface StorageInfo {
  used: number;
  total: number;
  percentUsed: number;
}

interface AlertState {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Custom styled components
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

// TabPanel component for the tabs
function TabPanel(props: TabPanelProps): React.ReactElement {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const FileManager = (): React.ReactElement => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [folders, setFolders] = useState<string[]>(['root']);
  const [currentFolder, setCurrentFolder] = useState<string>('root');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [tabValue, setTabValue] = useState<number>(0);
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    used: 0,
    total: 1073741824, // 1GB default
    percentUsed: 0
  });
  
  // Share modal state
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [sharePermission, setSharePermission] = useState<string>('view');
  const [shareExpiry, setShareExpiry] = useState<number>(24);
  const [passwordProtect, setPasswordProtect] = useState<boolean>(false);
  const [sharePassword, setSharePassword] = useState<string>('');
  const [shareLink, setShareLink] = useState<string>('');
  const [encryptFile, setEncryptFile] = useState<boolean>(false);
  
  // Alert state
  const [alert, setAlert] = useState<AlertState>({ open: false, message: '', severity: 'success' });
  
  // Modal states
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [newFolderModalOpen, setNewFolderModalOpen] = useState<boolean>(false);
  const [shareLinkModalOpen, setShareLinkModalOpen] = useState<boolean>(false);
  
  // Get auth token from localStorage
  const token = localStorage.getItem('token');
  
  // Configure axios
  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token
    }
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Show toast message
  const showAlert = (message: string, severity: AlertState['severity'] = 'success') => {
    setAlert({ open: true, message, severity });
  };
  
  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };
  
  // Load user profile and storage info
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await api.get('/auth/profile');
        setStorageInfo({
          used: res.data.storageUsed || 0,
          total: res.data.storageLimit || 1073741824,
          percentUsed: ((res.data.storageUsed / res.data.storageLimit) * 100) || 0
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        showAlert('Failed to load user profile', 'error');
      }
    };
    
    fetchUserProfile();
  }, []);
  
  // Load files and folders
  useEffect(() => {
    const fetchFilesAndFolders = async () => {
      try {
        // For simplicity, we'll just fetch files
        // In a real app, you'd also fetch folders
        const filesRes = await api.get(`/files?folder=${currentFolder}`);
        setFiles(filesRes.data);
        
        // Placeholder for folder fetching - in the real app you'd use this:
        // const foldersRes = await api.get('/files/folders');
        // setFolders(foldersRes.data);
      } catch (error) {
        console.error('Error fetching files/folders:', error);
        showAlert('Failed to load files', 'error');
      }
    };
    
    fetchFilesAndFolders();
  }, [currentFolder]);
  
  // Load shares
  useEffect(() => {
    const fetchShares = async () => {
      try {
        const res = await api.get('/shares');
        setShares(res.data);
      } catch (error) {
        console.error('Error fetching shares:', error);
      }
    };
    
    fetchShares();
  }, []);
  
  // Format bytes to human-readable size
  const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Upload file
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file size against remaining storage
    if (file.size > storageInfo.total - storageInfo.used) {
      showAlert('You do not have enough storage space', 'error');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', currentFolder);
    formData.append('encrypt', encryptFile.toString());
    
    try {
      await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        }
      });
      
      // Refresh files list and storage info
      const [filesRes, profileRes] = await Promise.all([
        api.get(`/files?folder=${currentFolder}`),
        api.get('/auth/profile')
      ]);
      
      setFiles(filesRes.data);
      setStorageInfo({
        used: profileRes.data.storageUsed || 0,
        total: profileRes.data.storageLimit || 1073741824,
        percentUsed: ((profileRes.data.storageUsed / profileRes.data.storageLimit) * 100) || 0
      });
      
      showAlert('Your file has been uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      const axiosError = error as AxiosError<{message?: string}>;
      showAlert(
        axiosError.response?.data?.message || 'Failed to upload file',
        'error'
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setEncryptFile(false);
    }
  };
  
  // Download file
  const handleDownload = async (fileId: string) => {
    try {
      const response = await api.get(`/files/download/${fileId}`, {
        responseType: 'blob'
      });
      
      // Extract filename from Content-Disposition header or use a default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'downloaded-file';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up - fix the error with parentNode
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      } else {
        document.body.removeChild(link); // Fallback if parentNode is null
      }
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      showAlert('Failed to download file', 'error');
    }
  };
  
  // Delete file
  const handleDelete = async (fileId: string) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }
    
    try {
      await api.delete(`/files/${fileId}`);
      
      // Refresh files list and storage info
      const [filesRes, profileRes] = await Promise.all([
        api.get(`/files?folder=${currentFolder}`),
        api.get('/auth/profile')
      ]);
      
      setFiles(filesRes.data);
      setStorageInfo({
        used: profileRes.data.storageUsed || 0,
        total: profileRes.data.storageLimit || 1073741824,
        percentUsed: ((profileRes.data.storageUsed / profileRes.data.storageLimit) * 100) || 0
      });
      
      showAlert('Your file has been deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      showAlert('Failed to delete file', 'error');
    }
  };
  
  // Open share modal
  const handleShareClick = (file: FileItem) => {
    setSelectedFile(file);
    setRecipientEmail('');
    setSharePermission('view');
    setShareExpiry(24);
    setPasswordProtect(false);
    setSharePassword('');
    setShareModalOpen(true);
  };
  
  // Share file
  const handleShareFile = async () => {
    if (!selectedFile || !recipientEmail) {
      showAlert('Please fill all required fields', 'error');
      return;
    }
    
    try {
      const shareData = {
        fileId: selectedFile._id,
        recipientEmail,
        permission: sharePermission,
        expiryHours: shareExpiry,
        passwordProtect,
        password: passwordProtect ? sharePassword : undefined
      };
      
      const res = await api.post('/shares', shareData);
      
      setShareLink(res.data.shareLink);
      setShareModalOpen(false);
      setShareLinkModalOpen(true);
      
      // Refresh shares list
      const sharesRes = await api.get('/shares');
      setShares(sharesRes.data);
      
      showAlert('Your file has been shared successfully');
    } catch (error) {
      console.error('Share error:', error);
      const axiosError = error as AxiosError<{message?: string}>;
      showAlert(
        axiosError.response?.data?.message || 'Failed to share file',
        'error'
      );
    }
  };
  
  // Create new folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      showAlert('Please enter a folder name', 'error');
      return;
    }
    
    try {
      await api.post('/files/folder', {
        folderName: newFolderName
      });
      
      // Refresh folders list
      const foldersRes = await api.get('/files/folders');
      setFolders(foldersRes.data);
      
      setNewFolderName('');
      setNewFolderModalOpen(false);
      
      showAlert('Your folder has been created successfully');
    } catch (error) {
      console.error('Create folder error:', error);
      const axiosError = error as AxiosError<{message?: string}>;
      showAlert(
        axiosError.response?.data?.message || 'Failed to create folder',
        'error'
      );
    }
  };
  
  // Revoke share
  const handleRevokeShare = async (shareId: string) => {
    if (!window.confirm('Are you sure you want to revoke this share?')) {
      return;
    }
    
    try {
      await api.delete(`/shares/${shareId}`);
      
      // Refresh shares list
      const sharesRes = await api.get('/shares');
      setShares(sharesRes.data);
      
      showAlert('The share has been revoked successfully');
    } catch (error) {
      console.error('Revoke share error:', error);
      showAlert('Failed to revoke share', 'error');
    }
  };
  
  // Copy share link to clipboard
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        showAlert('Share link copied to clipboard');
      })
      .catch((error) => {
        console.error('Copy error:', error);
      });
  };
  
  return (
    <ThemeWrapper>
      <Box sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" fontWeight="bold">File Manager</Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<FolderIcon />}
                onClick={() => setNewFolderModalOpen(true)}
              >
                New Folder
              </Button>
              <Button
                variant="contained"
                component="label"
                startIcon={isUploading ? <CircularProgress size={24} /> : <CloudUploadIcon />}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload File'}
                <VisuallyHiddenInput 
                  type="file" 
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </Button>
            </Stack>
          </Box>
          
          {/* Storage usage */}
          <Paper elevation={1} sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body1">Storage Usage</Typography>
              <Typography variant="body2" color="text.secondary">
                {formatBytes(storageInfo.used)} of {formatBytes(storageInfo.total)} used
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={storageInfo.percentUsed} 
              color={storageInfo.percentUsed > 90 ? "error" : "primary"}
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Paper>
          
          {isUploading && (
            <Box>
              <Typography variant="body2" mb={1}>Uploading: {uploadProgress}%</Typography>
              <LinearProgress variant="determinate" value={uploadProgress} color="success" />
            </Box>
          )}
          
          {/* Current folder path */}
          <Box display="flex" alignItems="center">
            <Typography variant="body2" mr={1}>Location:</Typography>
            <Button
              size="small"
              variant={currentFolder === 'root' ? "contained" : "outlined"}
              onClick={() => setCurrentFolder('root')}
            >
              root
            </Button>
            {currentFolder !== 'root' && (
              <Button size="small" variant="contained" sx={{ ml: 1 }}>
                {currentFolder}
              </Button>
            )}
          </Box>
          
          {/* File and Share management tabs */}
          <Paper elevation={1}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="file tabs">
                <Tab label="Files" id="tab-0" aria-controls="tabpanel-0" />
                <Tab label="Shared Files" id="tab-1" aria-controls="tabpanel-1" />
              </Tabs>
            </Box>
            
            {/* Files tab */}
            <TabPanel value={tabValue} index={0}>
              {folders.filter(f => f !== 'root').length > 0 && (
                <Box mb={3}>
                  <Typography variant="subtitle1" fontWeight="medium" mb={1}>Folders</Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    {folders.filter(f => f !== 'root').map((folder, index) => (
                      <Button 
                        key={index}
                        startIcon={<FolderIcon />}
                        variant="outlined"
                        size="medium"
                        onClick={() => setCurrentFolder(folder)}
                      >
                        {folder}
                      </Button>
                    ))}
                  </Stack>
                </Box>
              )}
              
              {files.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Encrypted</TableCell>
                      <TableCell>Uploaded</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {files.map((file) => (
                      <TableRow key={file._id}>
                        <TableCell>{file.originalName}</TableCell>
                        <TableCell>{formatBytes(file.size)}</TableCell>
                        <TableCell>{file.isEncrypted ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{formatDate(file.createdAt)}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Download">
                              <IconButton 
                                size="small"
                                onClick={() => handleDownload(file._id)}
                              >
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Share">
                              <IconButton 
                                size="small"
                                color="primary"
                                onClick={() => handleShareClick(file)}
                              >
                                <ShareIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton 
                                size="small"
                                color="error"
                                onClick={() => handleDelete(file._id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Box py={4} textAlign="center">
                  <Typography color="text.secondary">No files in this folder</Typography>
                </Box>
              )}
            </TabPanel>
            
            {/* Shared Files tab */}
            <TabPanel value={tabValue} index={1}>
              {shares.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>File</TableCell>
                      <TableCell>Shared With</TableCell>
                      <TableCell>Permission</TableCell>
                      <TableCell>Expires</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {shares.map((share) => (
                      <TableRow key={share._id}>
                        <TableCell>{share.file.originalName}</TableCell>
                        <TableCell>{share.recipientEmail}</TableCell>
                        <TableCell>{share.permission}</TableCell>
                        <TableCell>{formatDate(share.expiresAt)}</TableCell>
                        <TableCell>
                          {share.isRevoked ? (
                            <Typography color="error" variant="body2">Revoked</Typography>
                          ) : new Date(share.expiresAt) < new Date() ? (
                            <Typography color="warning.main" variant="body2">Expired</Typography>
                          ) : (
                            <Typography color="success.main" variant="body2">Active</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            disabled={share.isRevoked || new Date(share.expiresAt) < new Date()}
                            onClick={() => handleRevokeShare(share._id)}
                          >
                            Revoke
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Box py={4} textAlign="center">
                  <Typography color="text.secondary">You haven't shared any files yet</Typography>
                </Box>
              )}
            </TabPanel>
          </Paper>
        </Stack>
        
        {/* Share File Modal */}
        <Dialog open={shareModalOpen} onClose={() => setShareModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Share File
            <IconButton
              aria-label="close"
              onClick={() => setShareModalOpen(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={3}>
              <Typography>
                Sharing: <strong>{selectedFile?.originalName}</strong>
              </Typography>
              
              <TextField
                label="Recipient Email"
                placeholder="Enter email address"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                fullWidth
                required
              />
              
              <FormControl fullWidth>
                <FormLabel>Permission</FormLabel>
                <Select 
                  value={sharePermission}
                  onChange={(e) => setSharePermission(e.target.value)}
                >
                  <MenuItem value="view">View Only</MenuItem>
                  <MenuItem value="download">Download</MenuItem>
                  <MenuItem value="edit">Edit</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <FormLabel>Expires After</FormLabel>
                <TextField
                  type="number"
                  value={shareExpiry}
                  onChange={(e) => setShareExpiry(parseInt(e.target.value))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">hours</InputAdornment>,
                  }}
                  inputProps={{ min: 1, max: 168 }}
                />
              </FormControl>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={passwordProtect}
                    onChange={(e) => setPasswordProtect(e.target.checked)}
                  />
                }
                label="Password Protection"
              />
              
              {passwordProtect && (
                <TextField
                  label="Password"
                  type="password"
                  placeholder="Enter password"
                  value={sharePassword}
                  onChange={(e) => setSharePassword(e.target.value)}
                  fullWidth
                />
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShareModalOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleShareFile}>
              Share File
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* New Folder Modal */}
        <Dialog open={newFolderModalOpen} onClose={() => setNewFolderModalOpen(false)}>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Folder Name"
              placeholder="Enter folder name"
              fullWidth
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNewFolderModalOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreateFolder}>
              Create Folder
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Share Link Modal */}
        <Dialog open={shareLinkModalOpen} onClose={() => setShareLinkModalOpen(false)}>
          <DialogTitle>File Shared Successfully</DialogTitle>
          <DialogContent>
            <Typography variant="body1" paragraph>
              Your file has been shared! The recipient will receive an email with the access instructions and OTP.
            </Typography>
            <Typography variant="subtitle2" gutterBottom>
              Share Link:
            </Typography>
            <TextField
              value={shareLink}
              fullWidth
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={copyShareLink} edge="end">
                      <CopyIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={() => setShareLinkModalOpen(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Alert/Toast */}
        <Snackbar
          open={alert.open}
          autoHideDuration={5000}
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert 
            onClose={handleCloseAlert} 
            severity={alert.severity} 
            variant="filled"
            sx={{ width: '100%' }}
          >
            {alert.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeWrapper>
  );
};

export default FileManager;