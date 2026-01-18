import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import L from 'leaflet';

const createCustomIcon = (darkMode) => {
  return L.divIcon({
    html: `<div class="w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-blue-700' : 'bg-blue-600'} text-white shadow-lg border-2 ${darkMode ? 'border-gray-800' : 'border-white'}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
            </svg>
          </div>`,
    className: 'custom-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

const ProjectMap = React.memo(({ project, darkMode }) => {
  if (!project.location) {
    return (
      <div className={`text-center py-8 rounded-lg ${darkMode ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
        <MapPin className={`h-12 w-12 mx-auto mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No location set for this project</p>
        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Edit project to add location</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold">Project Location</h4>
      <div className="h-96 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
        <MapContainer
          center={project.location}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker 
            position={project.location} 
            icon={createCustomIcon(darkMode)}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{project.name}</p>
                <p className="text-gray-600">Contractor: {project.contractor}</p>
                <p className="text-gray-600">Supervisor: {project.supervisor}</p>
                <p className="text-gray-600">Lat: {project.location[0].toFixed(6)}</p>
                <p className="text-gray-600">Lng: {project.location[1].toFixed(6)}</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-2 text-sm">
          <MapPin size={14} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
          <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
            GPS Coordinates: {project.location[0].toFixed(6)}, {project.location[1].toFixed(6)}
          </span>
        </div>
        <div className="text-xs mt-1 opacity-70">
          Coordinates can be used for navigation and site verification
        </div>
      </div>
    </div>
  );
});

ProjectMap.displayName = 'ProjectMap';

export default ProjectMap;
