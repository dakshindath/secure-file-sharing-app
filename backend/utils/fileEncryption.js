const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const util = require('util');

// Convert callbacks to promises
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const unlink = util.promisify(fs.unlink);

// Encryption algorithm
const algorithm = 'aes-256-cbc';

/**
 * Encrypt a file and save the encrypted version
 * @param {string} filePath - Path to the file to encrypt
 * @returns {Object} - Encryption key and IV used for encryption
 */
async function encryptFile(filePath) {
  try {
    // Generate random encryption key and initialization vector
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    
    // Create cipher with key and iv
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    // Read the file data
    const fileData = await readFile(filePath);
    
    // Encrypt the file data
    const encryptedData = Buffer.concat([
      cipher.update(fileData),
      cipher.final()
    ]);
    
    // Get the path for the encrypted file
    const encryptedFilePath = filePath + '.enc';
    
    // Write the encrypted data to a new file
    await writeFile(encryptedFilePath, encryptedData);
    
    // Delete the original unencrypted file
    await unlink(filePath);
    
    // Return the encryption keys as hex strings for storage
    return {
      encryptedFilePath,
      key: key.toString('hex'),
      iv: iv.toString('hex')
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt file');
  }
}

/**
 * Decrypt a file
 * @param {string} encryptedFilePath - Path to the encrypted file
 * @param {string} keyHex - Encryption key as hex string
 * @param {string} ivHex - Initialization vector as hex string
 * @returns {Buffer} - Decrypted file data
 */
async function decryptFile(encryptedFilePath, keyHex, ivHex) {
  try {
    // Convert hex strings back to buffers
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    
    // Create decipher with key and iv
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    
    // Read the encrypted file data
    const encryptedData = await readFile(encryptedFilePath);
    
    // Decrypt the file data
    const decryptedData = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]);
    
    return decryptedData;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt file');
  }
}

/**
 * Decrypt a file and save it to a temporary location
 * @param {string} encryptedFilePath - Path to the encrypted file
 * @param {string} keyHex - Encryption key as hex string
 * @param {string} ivHex - Initialization vector as hex string
 * @param {string} outputFileName - Desired filename for the decrypted file
 * @returns {string} - Path to the decrypted temporary file
 */
async function decryptToTemporary(encryptedFilePath, keyHex, ivHex, outputFileName) {
  try {
    const decryptedData = await decryptFile(encryptedFilePath, keyHex, ivHex);
    
    // Create temporary directory if it doesn't exist
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Create a temporary file path
    const tempFilePath = path.join(tempDir, outputFileName);
    
    // Write decrypted data to temporary file
    await writeFile(tempFilePath, decryptedData);
    
    return tempFilePath;
  } catch (error) {
    console.error('Error decrypting to temporary file:', error);
    throw new Error('Failed to decrypt file to temporary location');
  }
}

module.exports = {
  encryptFile,
  decryptFile,
  decryptToTemporary
};