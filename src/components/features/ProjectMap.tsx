import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import L from 'leaflet';
import type { Project } from '@/types';
import Card from '@/components/ui/Card';

interface ProjectMapProps {
  project: Project;
  darkMode?: boolean;
}

const createCustomIcon = () => {
  return L.divIcon({
    html: `<div class="w-10 h-10 rounded-full flex items-center justify-center bg-blue-600 text-white shadow-lg border-2 border-white">
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

export default function ProjectMap({ project, darkMode = false }: ProjectMapProps) {
  if (!project.location) {
    return (
      <Card darkMode={darkMode}>
        <h3 className="text-xl font-bold mb-4">Project Location</h3>
        <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          No location set for this project.
        </p>
      </Card>
    );
  }

  const [lat, lng] = project.location;

  return (
    <Card darkMode={darkMode}>
      <h3 className="text-xl font-bold mb-4">Project Location</h3>
      <div className="h-80 rounded-lg overflow-hidden">
        <MapContainer
          center={[lat, lng]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lng]} icon={createCustomIcon()}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{project.name}</p>
                <p>Lat: {lat.toFixed(6)}</p>
                <p>Lng: {lng.toFixed(6)}</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </Card>
  );
}
