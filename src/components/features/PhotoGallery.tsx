import { useRef } from 'react';
import type { Photo } from '@/types';
import Card from '@/components/ui/Card';

interface PhotoGalleryProps {
  photos: Photo[];
  onUpload?: (files: FileList) => void;
  onDelete?: (id: string) => void;
  darkMode?: boolean;
  readonly?: boolean;
}

export default function PhotoGallery({ photos = [], onUpload, onDelete, darkMode = false, readonly = false }: PhotoGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload?.(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <Card darkMode={darkMode}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Project Photos</h3>
        {!readonly && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Upload Photos
            </button>
          </div>
        )}
      </div>

      {photos.length === 0 ? (
        <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          No photos yet. Upload photos to document project progress.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.url}
                alt={photo.caption || 'Project photo'}
                className="w-full h-32 object-cover rounded-lg"
              />
              {!readonly && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <button
                    onClick={() => onDelete?.(photo.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              )}
              {photo.caption && (
                <p className="text-xs mt-1 text-center truncate">{photo.caption}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
