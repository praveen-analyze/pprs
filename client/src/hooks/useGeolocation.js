import { useState, useCallback } from 'react';

export function useGeolocation() {
  const [location, setLocation]   = useState(null);
  const [address, setAddress]     = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGranted, setIsGranted] = useState(false);
  const [error, setError]         = useState(null);


  const reverseGeocode = useCallback(async (latitude, longitude) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            "User-Agent": "municipal-app"
          }
        }
      );

      const data = await res.json();

      if (data && data.display_name) {
        return data.display_name;
      }
    } catch (err) {
      console.error("Reverse geocode error:", err);
    }

    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }, []);

  const getLocation = useCallback(() => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        setLocation({ latitude, longitude, accuracy });

        const resolvedAddress = await reverseGeocode(latitude, longitude);
        setAddress(resolvedAddress);

        setIsGranted(true);
        setIsLoading(false);
      },
      (err) => {
        setIsLoading(false);
        setIsGranted(false);

        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location access denied.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location unavailable.');
            break;
          case err.TIMEOUT:
            setError('Location request timed out.');
            break;
          default:
            setError('Unable to get location.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [reverseGeocode]);

  const resetLocation = useCallback(() => {
    setLocation(null);
    setAddress('');
    setIsGranted(false);
    setError(null);
  }, []);

  return { location, address, isLoading, isGranted, error, getLocation, resetLocation };
}