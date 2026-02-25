import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import L from 'leaflet';

interface MapPickerProps {
  position: [number, number] | null;
  onChange: (position: [number, number]) => void;
  darkMode?: boolean;
}

const createCustomIcon = (darkMode: boolean) => {
  return L.divIcon({
    html: `<div class="w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-blue-700' : 'bg-blue-600'} text-white shadow-lg border-2 ${darkMode ? 'border-gray-800' : 'border-white'}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
            </svg>
          </div>`,
    className: 'custom-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

const MapCenterUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 16, { duration: 1 });
  }, [center, map]);
  return null;
};

export default function MapPicker({ position, onChange, darkMode = false }: MapPickerProps) {
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (position) {
      setMapCenter(position);
      return;
    }

    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const coords: [number, number] = [latitude, longitude];
          onChange(coords);
          setMapCenter(coords);
          setIsLocating(false);
        },
        (error) => {
          setLocationError(error.message);
          setIsLocating(false);
          setMapCenter([-6.2088, 106.8456]);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      setMapCenter([-6.2088, 106.8456]);
    }
  }, [position, onChange]);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          onChange([latitude, longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get current location. Please enable location services.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Project Location
        </label>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <MapPin size={14} />
          Use Current Location
        </button>
      </div>
      
      <div className="h-64 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 relative">
        {isLocating && (
          <div className="absolute inset-0 z-[1000] bg-black/30 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm dark:text-white">Getting your location...</span>
            </div>
          </div>
        )}
        <MapContainer
          center={mapCenter || [-6.2088, 106.8456]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {mapCenter && <MapCenterUpdater center={mapCenter} />}
          {position && (
            <Marker
              position={position}
              icon={createCustomIcon(darkMode)}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const pos = marker.getLatLng();
                  onChange([pos.lat, pos.lng]);
                },
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">Project Location</p>
                  <p>Lat: {position[0].toFixed(6)}</p>
                  <p>Lng: {position[1].toFixed(6)}</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
      
      {position && (
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={14} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
              Selected Location: {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </span>
          </div>
          <div className="text-xs mt-1 opacity-70">
            Click on the map to select location or drag the marker to adjust
          </div>
        </div>
      )}

      {locationError && (
        <div className={`p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800`}>
          <p className="text-sm text-red-600 dark:text-red-400">
            Could not get GPS location: {locationError}. Please select manually.
          </p>
        </div>
      )}
    </div>
  );
}
