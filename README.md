# Secure File Sharing with OTP Authentication

A secure file sharing application with email-based OTP verification, end-to-end encryption, and granular access controls.

## Features

### 🔒 Robust Security
- **End-to-End Encryption**: All files are encrypted before storage using AES-256
- **OTP Verification**: Email-based one-time passwords required to access shared files
- **Password Protection**: Optional additional password layer for shared files
- **JWT Authentication**: Secure API endpoints with token-based auth
- **Secure File Storage**: Files stored with random names and protected metadata

### 📤 File Management
- **Drag & Drop Upload**: Simple interface for uploading files
- **File Organization**: Manage your uploaded files in one place
- **Storage Monitoring**: Track your storage usage with visual indicators
- **File Deletion**: Easily remove files when no longer needed

### 🔄 Sharing Controls
- **Permission Levels**: Set view-only, download, or edit permissions
- **Expiration Settings**: Set automatic expiration times for shared files
- **Revocation**: Instantly revoke access to previously shared files
- **Access Tracking**: Monitor when and how often shared files are accessed

### 📱 User Experience
- **Responsive Design**: Works across desktop and mobile devices
- **Material UI**: Clean, modern interface with intuitive controls
- **Email Notifications**: Recipients automatically notified of shared files
- **Fallback Mechanisms**: Manual OTP sharing if email delivery fails

### 🛠️ Technical Stack
- **Frontend**: React with TypeScript and Material UI
- **Backend**: Node.js with Express
- **Database**: MongoDB for data storage
- **Authentication**: JWT-based with email verification
- **File Processing**: Server-side encryption/decryption with crypto module

## Key Workflows

### Secure File Sharing
1. Upload an encrypted file to your account
2. Share with a recipient via email
3. Recipient receives OTP verification code
4. After verification, recipient can access the file with permissions you set

### Enhanced Security Options
- Password-protect sensitive files for an additional security layer
- Set short expiration times for time-sensitive documents
- Instantly revoke access if a recipient should no longer have access

## Installation & Setup

### Prerequisites
- Node.js (v14+)
- MongoDB
- Gmail account for email notifications

### Backend Setup
```bash
cd backend
npm install
```

Configure environment variables in `.env`:
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
FRONTEND_URL=http://localhost:3000
FILE_ENCRYPTION_KEY=your_encryption_key
```

### Frontend Setup
```bash
cd frontend
npm install
```

### Running the Application
```bash
# Start backend server
cd backend
npm start

# Start frontend development server
cd frontend
npm start
```

## User Guide

### Registration & Login
- Register with email and password
- Verify your email with OTP
- Log in to access your secure dashboard

### Uploading Files
- Drag and drop files or use the file picker
- Files are automatically encrypted before storage

### Sharing Files
- Select a file to share and enter recipient's email
- Choose permission level (view/download/edit)
- Set expiration time and optional password
- Recipient receives email with OTP access code

### Managing Shared Files
- View all files you've shared
- Check access statistics
- Revoke access for any shared file

## Security Considerations

- All sensitive operations require authentication
- Files are encrypted at rest using AES-256
- Temporary files are securely deleted after use
- OTP codes expire if not used within a time limit

---

This project demonstrates implementing secure file sharing with layered security controls while maintaining excellent user experience.
