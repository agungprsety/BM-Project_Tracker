import React, { useRef, memo } from 'react';
import { Camera, X } from 'lucide-react';

const PhotoUpload = memo(({ photos, setPhotos, darkMode }) => {
  const fileInputRef = useRef(null);

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Limit number of photos
    if (photos.length + files.length > 10) {
      alert('Maximum 10 photos allowed per weekly report');
      return;
    }

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        alert('Please upload only image files');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newPhoto = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          dataUrl: e.target.result,
          filename: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
          description: ''
        };
        setPhotos(prev => [...prev, newPhoto]);
      };
      reader.readAsDataURL(file);
    });

    // Reset file input
    event.target.value = '';
  };

  const removePhoto = (id) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  const updateDescription = (id, description) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === id ? { ...photo, description } : photo
    ));
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Photos ({photos.length}/10)
        </label>
        <button
          type="button"
          onClick={triggerFileInput}
          className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm"
        >
          <Camera size={14} /> Add Photos
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoUpload}
          className="hidden"
        />
      </div>

      {photos.length === 0 ? (
        <div className={`text-center py-8 rounded-lg border-2 border-dashed ${darkMode ? 'border-gray-600 bg-gray-700/30' : 'border-gray-300 bg-gray-50'}`}>
          <Camera className={`h-12 w-12 mx-auto mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No photos added yet</p>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Upload photos of this week's work</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map(photo => (
            <div key={photo.id} className={`rounded-lg overflow-hidden border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              <div className="relative aspect-square">
                <img 
                  src={photo.dataUrl} 
                  alt={photo.description || 'Weekly report photo'}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="p-2">
                <input
                  type="text"
                  value={photo.description}
                  onChange={(e) => updateDescription(photo.id, e.target.value)}
                  placeholder="Add description..."
                  className={`w-full px-2 py-1 text-sm border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
                />
                <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {photo.filename} • {(photo.size / 1024 / 1024).toFixed(2)}MB
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

PhotoUpload.displayName = 'PhotoUpload';

export default PhotoUpload;
