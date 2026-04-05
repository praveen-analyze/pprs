import React, { useEffect, useState } from 'react';
import { useCamera } from '@/hooks/useCamera';

export default function CameraPanel({ onPhotoCapture, onCameraToggle }) {
  const { videoRef, isActive, isLoading, error, startCamera, stopCamera, capturePhoto, switchCamera } = useCamera();
  const [isToggled, setIsToggled]           = useState(false);
  const [preview, setPreview]               = useState(null);
  const [isCapturing, setIsCapturing]       = useState(false);
  const [captureSuccess, setCaptureSuccess] = useState(false);

  const statusLabel = () => {
    if (captureSuccess) return 'Photo captured';
    if (isLoading)      return 'Starting camera...';
    if (isActive)       return 'Camera active';
    if (error)          return 'Camera error';
    return 'Waiting...';
  };

  const handleToggle = async (e) => {
    const checked = e.target.checked;
    setIsToggled(checked);
    onCameraToggle(checked);
    if (checked) { await startCamera(); }
    else {
      stopCamera();
      if (preview) { URL.revokeObjectURL(preview); setPreview(null); }
      setCaptureSuccess(false);
      onPhotoCapture(null);
    }
  };

  const handleCapture = async () => {
    setIsCapturing(true);
    try {
      const blob    = await capturePhoto();
      const blobUrl = URL.createObjectURL(blob);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(blobUrl);
      setCaptureSuccess(true);
      onPhotoCapture(blob);
    } catch (err) { console.error('[CameraPanel] Capture failed:', err); }
    finally { setIsCapturing(false); }
  };

  const handleRetake = async () => {
    if (preview) { URL.revokeObjectURL(preview); setPreview(null); }
    setCaptureSuccess(false);
    onPhotoCapture(null);
    await startCamera();
  };

  useEffect(() => { return () => { if (preview) URL.revokeObjectURL(preview); }; }, []);

  return (
    <div className={`card p-5 flex flex-col gap-4 transition-all duration-300 ${isActive || captureSuccess ? 'ring-2 ring-primary-600 ring-opacity-30' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive || captureSuccess ? 'bg-primary-100' : 'bg-gray-100'}`}>
            <svg className={`w-4 h-4 ${isActive || captureSuccess ? 'text-primary-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm">Take a photo</h3>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={isToggled} onChange={handleToggle} disabled={isLoading} className="sr-only peer" />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-primary-600 peer-disabled:opacity-50 transition-colors duration-200" />
          <div className="absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full shadow peer-checked:translate-x-5 transition-transform duration-200 pointer-events-none" />
        </label>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${captureSuccess ? 'bg-green-100 text-green-700' : isActive ? 'bg-blue-100 text-blue-700' : isLoading ? 'bg-yellow-100 text-yellow-700' : error ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${captureSuccess ? 'bg-green-500' : isActive ? 'bg-blue-500 animate-pulse' : isLoading ? 'bg-yellow-500 animate-pulse' : error ? 'bg-red-500' : 'bg-gray-400'}`} />
          {statusLabel()}
        </span>
        {captureSuccess && (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            Done
          </span>
        )}
      </div>

      {/* Preview area */}
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-900 border border-gray-200">
        {!isToggled && !captureSuccess && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-500">
            <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm text-gray-400 text-center px-4">Enable the camera toggle<br/>to take a photo</p>
          </div>
        )}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-300">Starting camera...</p>
          </div>
        )}
        <video ref={videoRef} autoPlay playsInline muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isActive && !captureSuccess ? 'opacity-100' : 'opacity-0'}`} />
        {captureSuccess && preview && <img src={preview} alt="Captured" className="absolute inset-0 w-full h-full object-cover" />}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900 px-4">
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-300 text-center">{error}</p>
            <button onClick={handleRetake} className="text-xs text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors">Try again</button>
          </div>
        )}
        {isActive && !captureSuccess && (
          <button onClick={switchCamera} className="absolute top-2 right-2 w-8 h-8 bg-black bg-opacity-40 hover:bg-opacity-60 rounded-full flex items-center justify-center transition-colors" title="Switch camera">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        {isActive && !captureSuccess && (
          <button onClick={handleCapture} disabled={isCapturing} className="flex-1 btn-primary py-2.5">
            {isCapturing ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Capturing...</> : 'Capture photo'}
          </button>
        )}
        {captureSuccess && (
          <button onClick={handleRetake} className="flex-1 btn-secondary py-2.5">Retake</button>
        )}
      </div>
    </div>
  );
}
