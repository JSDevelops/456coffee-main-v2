import { useRef, useState, type DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Loader2, AlertTriangle } from 'lucide-react';
import { API_BASE, auth } from '../../api';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
  /** aspect ratio of preview, default 16/9 */
  aspect?: string;
  /** Max file size in MB (must match backend). Default 8. */
  maxMb?: number;
}

export function ImageUpload({
  value,
  onChange,
  label = 'รูปภาพ',
  hint,
  aspect = '16/9',
  maxMb = 8,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const upload = async (file: File) => {
    setError(null);
    if (file.size > maxMb * 1024 * 1024) {
      setError(`ไฟล์ใหญ่เกิน ${maxMb} MB`);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('รองรับเฉพาะไฟล์รูปภาพ');
      return;
    }

    setUploading(true);
    setProgress(0);

    // Use XHR to get upload progress (fetch can't report it)
    const formData = new FormData();
    formData.append('file', file);

    try {
      const url = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/uploads`);
        const token = auth.getToken();
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            setProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const json = JSON.parse(xhr.responseText);
              resolve(json.url);
            } catch {
              reject(new Error('ตอบกลับผิดรูปแบบ'));
            }
          } else {
            try {
              const json = JSON.parse(xhr.responseText);
              reject(new Error(json.message || `HTTP ${xhr.status}`));
            } catch {
              reject(new Error(`HTTP ${xhr.status}`));
            }
          }
        };
        xhr.onerror = () => reject(new Error('เครือข่ายผิดพลาด'));
        xhr.send(formData);
      });

      onChange(url);
    } catch (e: any) {
      setError(e?.message || 'อัปโหลดไม่สำเร็จ');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) upload(f);
    e.target.value = '';
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) upload(f);
  };

  return (
    <div>
      {label && (
        <label
          className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </label>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onPick}
        className="hidden"
      />

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className="relative rounded-2xl overflow-hidden cursor-pointer transition-all group"
        style={{
          aspectRatio: aspect,
          background: value ? 'var(--surface-2)' : 'var(--surface-2)',
          border: `2px dashed ${dragOver ? 'var(--accent)' : value ? 'transparent' : 'var(--border-strong)'}`,
        }}
      >
        {/* Existing image */}
        {value && !uploading && (
          <>
            <img
              src={value}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold transition-all"
                style={{ background: '#fff', color: 'var(--text)' }}
              >
                <Upload size={13} /> เปลี่ยนรูป
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                  setError(null);
                }}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.28)',
                }}
              >
                <X size={13} /> ลบ
              </button>
            </div>
          </>
        )}

        {/* Uploading state */}
        {uploading && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{
              background: 'var(--surface-2)',
              color: 'var(--text-2)',
            }}
          >
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
            <p className="text-xs font-semibold">กำลังอัปโหลด · {progress}%</p>
            <div
              className="w-2/3 max-w-xs h-1.5 rounded-full overflow-hidden"
              style={{ background: 'var(--surface-3)' }}
            >
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
                className="h-full rounded-full"
                style={{ background: 'var(--accent)' }}
              />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!value && !uploading && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 transition-colors"
            style={{
              color: dragOver ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{
                background: dragOver ? 'var(--accent-soft)' : 'var(--surface-3)',
                color: dragOver ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {dragOver ? <Upload size={22} /> : <ImageIcon size={22} />}
            </div>
            <p className="text-sm font-semibold mt-1">
              {dragOver ? 'วางไฟล์ที่นี่' : 'คลิกเลือก หรือลากรูปมาวาง'}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
              JPG / PNG / WebP / GIF · สูงสุด {maxMb} MB
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 flex items-center gap-2 text-xs font-semibold"
            style={{ color: 'var(--danger)' }}
          >
            <AlertTriangle size={12} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {hint && !error && (
        <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
          {hint}
        </p>
      )}
    </div>
  );
}
