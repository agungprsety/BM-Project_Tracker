import React, { useState } from 'react';
import { Image as ImageIcon, XCircle, X } from 'lucide-react';
import { formatDate } from '../utils';

const PhotoGallery = React.memo(({ photos, onDeletePhoto, darkMode }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!photos || photos.length === 0) {
    return (
      <div className={`text-center py-8 rounded-lg ${darkMode ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
        <ImageIcon className={`h-12 w-12 mx-auto mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No photos yet</p>
        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Add photos in weekly reports</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div 
            key={photo.id || index} 
            className="relative group cursor-pointer"
            onClick={() => setSelectedImage(photo)}
          >
            <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <img 
                src={photo.dataUrl} 
                alt={`Project ${index + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
              />
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-200 rounded-lg"></div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePhoto(photo.id);
                }}
                className="bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
              >
                <XCircle size={16} />
              </button>
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {photo.date ? formatDate(photo.date) : 'No date'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                {photo.description || 'No description'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Week {photo.weekNumber || 'N/A'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
              onClick={() => setSelectedImage(null)}
            >
              <X size={24} />
            </button>
            <img 
              src={selectedImage.dataUrl} 
              alt="Preview"
              className="max-w-full max-h-[80vh] rounded-lg"
            />
            <div className="mt-4 text-white">
              <p className="font-semibold">{selectedImage.description || 'No description'}</p>
              <p className="text-sm opacity-80">
                {selectedImage.date ? formatDate(selectedImage.date) : 'No date'} | 
                Week {selectedImage.weekNumber || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

PhotoGallery.displayName = 'PhotoGallery';

export default PhotoGallery;
