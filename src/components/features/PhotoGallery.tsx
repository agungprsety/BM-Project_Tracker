import { useRef, useState, useEffect } from 'react';
import type { Photo } from '@/types';
import Card from '@/components/ui/Card';

interface PhotoGalleryProps {
  photos: Photo[];
  onUpload?: (files: FileList) => void;
  onDelete?: (id: string) => void;
  onUpdateCaption?: (id: string, caption: string) => void;
  darkMode?: boolean;
  readonly?: boolean;
}

function PhotoItem({ photo, onDelete, onUpdateCaption, darkMode, readonly }: {
  photo: Photo;
  onDelete?: (id: string) => void;
  onUpdateCaption?: (id: string, caption: string) => void;
  darkMode: boolean;
  readonly: boolean;
}) {
  const [localCaption, setLocalCaption] = useState(photo.caption || '');

  // Keep local state in sync if parent changes (e.g. from DB)
  useEffect(() => {
    setLocalCaption(photo.caption || '');
  }, [photo.caption]);

  const handleBlur = () => {
    if (localCaption !== (photo.caption || '')) {
      onUpdateCaption?.(photo.id, localCaption);
    }
  };

  return (
    <div className={`flex flex-col border rounded-xl overflow-hidden shadow-sm transition-all ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
      <div className="relative group aspect-video">
        <img
          src={photo.url}
          alt={photo.caption || 'Project photo'}
          className="w-full h-full object-cover"
        />
        {!readonly && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={() => onDelete?.(photo.id)}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
            >
              Remove Photo
            </button>
          </div>
        )}
      </div>
      <div className="p-3">
        {!readonly ? (
          <textarea
            value={localCaption}
            onChange={(e) => setLocalCaption(e.target.value)}
            onBlur={handleBlur}
            placeholder="Enter caption (e.g., Sta 0+500, Asphalt Layer 1...)"
            className={`w-full text-xs p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none outline-none transition-all ${
              darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 placeholder-gray-400'
            }`}
            rows={2}
          />
        ) : (
          <p className={`text-xs italic ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {photo.caption || 'No description provided.'}
          </p>
        )}
        <div className="flex justify-between items-center mt-2">
          <p className={`text-[10px] font-mono uppercase tracking-tighter ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {new Date(photo.createdAt).toLocaleDateString()}
          </p>
          {!readonly && localCaption !== (photo.caption || '') && (
            <span className="text-[10px] text-blue-500 animate-pulse font-medium">Unsaved changes...</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PhotoGallery({ photos = [], onUpload, onDelete, onUpdateCaption, darkMode = false, readonly = false }: PhotoGalleryProps) {
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
        <h3 className="text-xl font-bold">Project Documentation Photos</h3>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors flex items-center gap-2"
            >
              Add Site Evidence
            </button>
          </div>
        )}
      </div>

      {photos.length === 0 ? (
        <p className={`text-center py-12 border-2 border-dashed rounded-xl ${darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
          No photographic evidence has been uploaded for this road project.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {photos.map((photo) => (
            <PhotoItem
              key={photo.id}
              photo={photo}
              onDelete={onDelete}
              onUpdateCaption={onUpdateCaption}
              darkMode={darkMode}
              readonly={readonly}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
