import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

export const checkCameraPermission = async (): Promise<boolean> => {
  try {
    const status = await BarcodeScanner.checkPermission({ force: true });
    return status.granted;
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return false;
  }
};

export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    const status = await BarcodeScanner.checkPermission({ force: true });
    
    if (status.granted) {
      return true;
    }
    
    if (status.denied) {
      // Permission was permanently denied
      return false;
    }
    
    // Request permission
    const newStatus = await BarcodeScanner.checkPermission({ force: true });
    return newStatus.granted;
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return false;
  }
};

export const startQRScanner = async (): Promise<string | null> => {
  try {
    // Check if we have permission
    const hasPermission = await requestCameraPermission();
    
    if (!hasPermission) {
      throw new Error('Camera permission denied');
    }

    // Make background of WebView transparent
    await BarcodeScanner.hideBackground();
    
    // Start scanning
    const result = await BarcodeScanner.startScan();
    
    // Restore background
    await BarcodeScanner.showBackground();
    
    if (result.hasContent) {
      return result.content;
    }
    
    return null;
  } catch (error) {
    console.error('Error starting QR scanner:', error);
    await BarcodeScanner.showBackground();
    throw error;
  }
};

export const stopQRScanner = async (): Promise<void> => {
  try {
    await BarcodeScanner.stopScan();
    await BarcodeScanner.showBackground();
  } catch (error) {
    console.error('Error stopping QR scanner:', error);
  }
};

export const prepareScannerUI = (): void => {
  // Add CSS class to hide elements during scanning
  document.body.classList.add('qr-scanner-active');
};

export const cleanupScannerUI = (): void => {
  // Remove CSS class
  document.body.classList.remove('qr-scanner-active');
};
