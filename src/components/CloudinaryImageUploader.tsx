import React, { useState, useRef } from 'react';
import { Camera, Video, CheckCircle2, Loader2, X } from 'lucide-react';

const BACKEND_API_URL = 'https://parava-backend-1.onrender.com';

interface CloudinaryImageUploaderProps {
  onImageUploaded: (url: string) => void;
  currentImageUrl?: string;
  label?: string;
  folder?: string;
  allowVideo?: boolean;
}

export default function CloudinaryImageUploader({
  onImageUploaded,
  currentImageUrl,
  label = "Upload Media (Photo / Video)",
  folder = "parva_admin",
  allowVideo = true
}: CloudinaryImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [isVideo, setIsVideo] = useState<boolean>(currentImageUrl?.endsWith('.mp4') || currentImageUrl?.includes('/video/') || false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);
    setUploadProgress(20);

    const fileIsVideo = file.type.startsWith('video/');
    setIsVideo(fileIsVideo);

    try {
      let uploadPayload: string;
      if (!fileIsVideo) {
        // Compress Image to WebP
        uploadPayload = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (ev) => {
            const img = new Image();
            img.src = ev.target?.result as string;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let { width, height } = img;
              const maxWidth = 1400;
              if (width > maxWidth || height > maxWidth) {
                if (width > height) {
                  height = Math.round((height * maxWidth) / width);
                  width = maxWidth;
                } else {
                  width = Math.round((width * maxWidth) / height);
                  height = maxWidth;
                }
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/webp', 0.85));
              } else {
                resolve(ev.target?.result as string);
              }
            };
            img.onerror = () => resolve(ev.target?.result as string);
          };
          reader.onerror = reject;
        });
        setUploadProgress(50);
      } else {
        uploadPayload = await new Promise((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.readAsDataURL(file);
        });
        setUploadProgress(40);
      }

      // Upload to Backend
      const res = await fetch(`${BACKEND_API_URL}/api/upload/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: uploadPayload,
          folder,
          resource_type: fileIsVideo ? 'video' : 'image'
        })
      });

      setUploadProgress(85);
      const data = await res.json();

      if (data.success && data.url) {
        const optimizedUrl = fileIsVideo ? data.url : data.url.replace('/upload/', '/upload/f_auto,q_auto/');
        setPreviewUrl(optimizedUrl);
        onImageUploaded(optimizedUrl);
        setUploadProgress(100);
      } else {
        setPreviewUrl(uploadPayload);
        onImageUploaded(uploadPayload);
        setUploadProgress(100);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMsg("Failed to upload media. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">{label}</label>}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={allowVideo ? "image/*,video/*" : "image/*"}
        capture="environment"
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-900 group">
          {isVideo ? (
            <video src={previewUrl} controls className="w-full h-full object-cover" />
          ) : (
            <img src={previewUrl} alt="Uploaded Preview" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 active:scale-95"
            >
              <Camera size={14} />
              <span>Change</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPreviewUrl(null);
                onImageUploaded('');
              }}
              className="bg-rose-600 text-white p-1.5 rounded-xl shadow-md active:scale-95"
            >
              <X size={14} />
            </button>
          </div>
          <span className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
            <CheckCircle2 size={10} />
            <span>Cloudinary {isVideo ? 'Video' : 'WebP'}</span>
          </span>
        </div>
      ) : (
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-200 hover:border-brand-primary/60 bg-gray-50/80 hover:bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all active:scale-99"
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="animate-spin text-brand-primary" size={24} />
              <span className="text-xs font-bold text-gray-700">Uploading to Cloudinary... ({uploadProgress}%)</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center gap-1">
                <Camera size={18} />
                {allowVideo && <Video size={16} />}
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-gray-800 block">📷 Take Photo / Video or Upload from File</span>
                <span className="text-[10px] text-gray-400 font-medium">Auto-synced to Cloudinary CDN (k03rmhkg)</span>
              </div>
            </>
          )}
        </button>
      )}

      {errorMsg && <p className="text-[10px] font-bold text-rose-600">{errorMsg}</p>}
    </div>
  );
}
