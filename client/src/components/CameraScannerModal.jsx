import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, RefreshCw, Zap, Volume2, AlertCircle, CheckCircle } from 'lucide-react';
import { playScannerBeep } from '../utils/scannerSound';

export default function CameraScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [scannerStatus, setScannerStatus] = useState('initializing'); // 'initializing' | 'scanning' | 'error' | 'success'
  const [errorMessage, setErrorMessage] = useState('');
  const [lastScannedText, setLastScannedText] = useState('');
  const [autoCloseOnScan, setAutoCloseOnScan] = useState(false); // keep scanner open for multi-item scanning by default
  const html5QrCodeRef = useRef(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const scannerId = 'camera-qr-scanner-region';

    // 1. Get available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!mounted) return;
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer environment / rear camera if present
          const rearCam = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') || 
            d.label.toLowerCase().includes('environment')
          );
          const defaultCamId = rearCam ? rearCam.id : devices[0].id;
          setSelectedCameraId(defaultCamId);
          startScanner(defaultCamId);
        } else {
          setScannerStatus('error');
          setErrorMessage('කැමරාවක් හඳුනාගත නොහැකි විය (No cameras detected on this device)');
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setScannerStatus('error');
        setErrorMessage(
          err.message?.includes('Permission') 
            ? 'කැමරාව භාවිතයට අවසර ලබා දෙන්න (Please allow Camera permission in your browser)' 
            : `Camera Error: ${err.message || 'Unable to access camera'}`
        );
      });

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async (cameraId) => {
    try {
      setScannerStatus('initializing');
      setErrorMessage('');

      // Stop any existing session
      await stopScanner();

      const qrCode = new Html5Qrcode('camera-qr-scanner-region');
      html5QrCodeRef.current = qrCode;

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdge * 0.75);
          return {
            width: qrboxSize,
            height: qrboxSize
          };
        },
        aspectRatio: 1.0
      };

      await qrCode.start(
        cameraId,
        config,
        (decodedText, decodedResult) => {
          handleCodeDetected(decodedText, decodedResult);
        },
        (scanError) => {
          // Standard frame error when no QR is in viewfinder - ignore to avoid noise
        }
      );

      isRunningRef.current = true;
      setScannerStatus('scanning');
    } catch (err) {
      setScannerStatus('error');
      setErrorMessage(err.message || 'Failed to start camera scanner');
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && isRunningRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      } finally {
        isRunningRef.current = false;
      }
    }
  };

  const handleCameraChange = async (e) => {
    const newId = e.target.value;
    setSelectedCameraId(newId);
    await startScanner(newId);
  };

  // Cooldown to avoid duplicate reads within 1.2s for the exact same code
  const lastScannedTimeRef = useRef(0);
  const lastScannedCodeRef = useRef('');

  const handleCodeDetected = (text) => {
    const now = Date.now();
    const cleanText = text.trim();
    if (!cleanText) return;

    if (cleanText === lastScannedCodeRef.current && now - lastScannedTimeRef.current < 1200) {
      return; // prevent duplicate read
    }

    lastScannedCodeRef.current = cleanText;
    lastScannedTimeRef.current = now;

    // Beep sound
    playScannerBeep('success');

    setLastScannedText(cleanText);
    setScannerStatus('success');

    // Notify parent POS
    if (onScanSuccess) {
      onScanSuccess(cleanText);
    }

    // Auto resume status after 800ms
    setTimeout(() => {
      setScannerStatus('scanning');
    }, 800);

    if (autoCloseOnScan) {
      setTimeout(() => {
        onClose();
      }, 500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 rounded-xl">
              <Camera className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                QR & Barcode Scanner (කැමරා ස්කෑනරය)
              </h3>
              <p className="text-[11px] text-slate-400">
                Scan Medicine / Grocery Barcodes, 2D QR Codes, or Prescriptions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Feed Area */}
        <div className="p-5 flex flex-col items-center">
          
          <div className="w-full relative rounded-2xl overflow-hidden bg-slate-950 aspect-square max-h-[340px] flex items-center justify-center border-2 border-dashed border-indigo-500/40">
            <div id="camera-qr-scanner-region" className="w-full h-full object-cover"></div>

            {/* Target Reticle Overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-indigo-400 rounded-2xl relative animate-pulse">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-indigo-500 -mt-1 -ml-1"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-indigo-500 -mt-1 -mr-1"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-indigo-500 -mb-1 -ml-1"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-indigo-500 -mb-1 -mr-1"></div>
                
                {/* Horizontal laser scan beam */}
                <div className="absolute inset-x-2 top-1/2 h-0.5 bg-rose-500 shadow-md shadow-rose-500 animate-bounce"></div>
              </div>
            </div>

            {/* Status indicators */}
            {scannerStatus === 'initializing' && (
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white gap-2">
                <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin" />
                <span className="text-xs font-bold">කැමරාව සක්‍රිය වෙමින් පවතී...</span>
              </div>
            )}

            {scannerStatus === 'error' && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-white p-6 text-center gap-3">
                <AlertCircle className="w-10 h-10 text-rose-500" />
                <span className="text-xs font-bold text-rose-300">{errorMessage}</span>
                <button
                  onClick={() => selectedCameraId && startScanner(selectedCameraId)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  නැවත උත්සාහ කරන්න (Retry)
                </button>
              </div>
            )}

            {scannerStatus === 'success' && (
              <div className="absolute top-3 inset-x-4 bg-emerald-600/90 text-white py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold backdrop-blur-sm animate-in fade-in">
                <CheckCircle className="w-4 h-4" />
                <span>හඳුනාගන්නා ලදී (Detected): {lastScannedText}</span>
              </div>
            )}
          </div>

          {/* Camera Selection & Mode Toggles */}
          <div className="w-full mt-4 space-y-3">
            {cameras.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">කැමරාව තෝරන්න:</span>
                <select
                  value={selectedCameraId}
                  onChange={handleCameraChange}
                  className="flex-1 text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                >
                  {cameras.map(cam => (
                    <option key={cam.id} value={cam.id}>
                      {cam.label || `Camera ${cam.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Beep Sound on Scan සක්‍රියයි
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={autoCloseOnScan}
                  onChange={(e) => setAutoCloseOnScan(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Close after 1 item
              </label>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <span>💡 Handheld Barcode Guns can scan directly without opening camera!</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white font-bold cursor-pointer"
          >
            Done (අවසන් කරන්න)
          </button>
        </div>

      </div>
    </div>
  );
}
