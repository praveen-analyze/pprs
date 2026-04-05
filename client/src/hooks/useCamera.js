import { useRef, useState, useCallback, useEffect } from 'react';

export function useCamera() {
  const videoRef                    = useRef(null);
  const [stream, setStream]         = useState(null);
  const [isActive, setIsActive]     = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState(null);
  const [facingMode, setFacingMode] = useState('environment');

  useEffect(() => {
    return () => { if (stream) stream.getTracks().forEach((t) => t.stop()); };
  }, [stream]);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }
      setStream(newStream);
      setIsActive(true);
    } catch (err) {
      setIsActive(false);
      if (err.name === 'NotAllowedError')   setError('Camera access denied. Please allow camera permission.');
      else if (err.name === 'NotFoundError') setError('No camera found on this device.');
      else if (err.name === 'NotReadableError') setError('Camera is already in use by another app.');
      else setError('Could not access camera: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [stream, facingMode]);

  const stopCamera = useCallback(() => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStream(null);
    setIsActive(false);
    setError(null);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current || !isActive) { reject(new Error('Camera not active')); return; }
      const video  = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width  = video.videoWidth  || 1280;
      canvas.height = video.videoHeight || 720;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Capture failed')), 'image/jpeg', 0.92);
    });
  }, [isActive]);

  const switchCamera = useCallback(async () => {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacing);
    if (isActive) { stopCamera(); setTimeout(() => startCamera(), 200); }
  }, [facingMode, isActive, stopCamera, startCamera]);

  return { videoRef, isActive, isLoading, error, startCamera, stopCamera, capturePhoto, switchCamera };
}
