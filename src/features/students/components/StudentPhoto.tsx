import { useRef, useState } from 'react';
import { Camera, Trash2, UserRound } from 'lucide-react';
import { toast } from '@/shared/ui';
import { useUpdateStudentPhoto } from '../hooks/useStudents';
import type { Id } from '@/shared/types';

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || '?';
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Student profile photo (§ profile photo).
 *
 * Shows the stored photo or an initials placeholder, and — for authorized
 * admins — supports change / remove with client-side type and size validation.
 * The actual file lives in backend storage; here the mock accepts a data URI.
 * The frontend never fabricates a stored image.
 */
export function StudentPhoto({
  studentId,
  name,
  photoUrl,
  canEdit,
}: {
  studentId: Id;
  name: string;
  photoUrl: string | null;
  canEdit: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const update = useUpdateStudentPhoto(studentId);
  const [preview, setPreview] = useState<string | null>(null);

  const shown = preview ?? photoUrl;

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error('Unsupported image', 'Use a PNG, JPEG or WebP image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image too large', 'Choose an image under 2 MB.');
      return;
    }
    try {
      const dataUrl = await readAsDataUrl(file);
      setPreview(dataUrl); // instant preview while the request is in flight
      await update.mutateAsync(dataUrl);
      setPreview(null);
      toast.success('Photo updated');
    } catch {
      setPreview(null);
      toast.error('Upload failed', 'The photo could not be saved. Try again.');
    }
  }

  async function remove() {
    try {
      await update.mutateAsync(null);
      setPreview(null);
      toast.success('Photo removed');
    } catch {
      toast.error('Could not remove the photo');
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <div className="size-24 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-sunken)]">
          {shown ? (
            <img src={shown} alt={`${name}'s profile photo`} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <span className="text-metric font-semibold text-[var(--text-subtle)]" aria-hidden="true">
                {initials(name)}
              </span>
              <span className="sr-only">No profile photo</span>
            </div>
          )}
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={update.isPending}
            aria-label={shown ? 'Change profile photo' : 'Upload profile photo'}
            className="absolute right-0 bottom-0 inline-flex size-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-muted)] shadow-raised hover:text-[var(--text)] disabled:opacity-50"
          >
            <Camera className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {canEdit && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={update.isPending}
            className="inline-flex items-center gap-1 text-body-sm font-medium text-[var(--accent)] hover:underline disabled:opacity-50"
          >
            <UserRound className="size-3.5" aria-hidden="true" />
            {shown ? 'Change' : 'Upload'}
          </button>
          {photoUrl && !preview && (
            <button
              type="button"
              onClick={() => void remove()}
              disabled={update.isPending}
              className="inline-flex items-center gap-1 text-body-sm text-[var(--danger)] hover:underline disabled:opacity-50"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Remove
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(',')}
            className="hidden"
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.target.value = ''; // allow re-selecting the same file
            }}
          />
        </div>
      )}
      {canEdit && <p className="text-caption text-[var(--text-subtle)]">PNG, JPEG or WebP · up to 2 MB</p>}
    </div>
  );
}
