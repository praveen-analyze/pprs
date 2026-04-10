import React, { useEffect } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import LocationMap from './LocationMap'; 

export default function LocationPanel({ isEnabled, onLocationCapture }) {
  const { location, address, isLoading, isGranted, error, getLocation, resetLocation } = useGeolocation();

  useEffect(() => {
    if (isGranted && location) {
      onLocationCapture({
        latitude: location.latitude,
        longitude: location.longitude,
        address
      });
    }
  }, [isGranted, location, address]);

  useEffect(() => {
    if (!isEnabled) {
      resetLocation();
      onLocationCapture(null);
    }
  }, [isEnabled]);

  const statusLabel = () => {
    if (!isEnabled) return 'Disabled';
    if (isGranted) return 'Location set';
    if (isLoading) return 'Locating...';
    if (error) return 'Location error';
    return 'Ready';
  };

  return (
    <div className={`card p-5 flex flex-col gap-4 ${!isEnabled ? 'opacity-60' : ''}`}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Your location</h3>
      </div>

      {/* Status */}
      <span className="text-xs">{statusLabel()}</span>

      {/* MAP AREA */}
      <div className="relative w-full h-[300px] rounded-xl overflow-hidden border">

        {!isEnabled && (
          <div className="flex items-center justify-center h-full text-gray-400">
            Enable location
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center h-full">
            Loading...
          </div>
        )}

        {/* MAP */}
        {isGranted && location && (
          <LocationMap
            latitude={location.latitude}
            longitude={location.longitude}
            address={address}
          />
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full text-red-500">
            <p>{error}</p>
            <button onClick={getLocation}>Try again</button>
          </div>
        )}
      </div>

      {/* Button */}
      {isEnabled && !isGranted && !isLoading && (
        <button onClick={getLocation} className="btn-primary">
          Enable location
        </button>
      )}

      {/* Address */}
      {isGranted && address && (
        <div className="bg-green-50 p-3 rounded">
          <p className="text-xs">{address}</p>
        </div>
      )}
    </div>
  );
}