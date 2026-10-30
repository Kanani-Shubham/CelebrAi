import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { storage, auth } from './config';
import { updateUserProfile } from './auth';

export interface UploadProgressCallback {
  (progress: number): void;
}

/**
 * Validates an image file before upload.
 * Checks MIME type and size limit (5MB).
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload a valid image (JPEG, PNG, or WebP).',
    };
  }

  const maxSize = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Image size must be less than 5 MB.',
    };
  }

  return { valid: true };
}

/**
 * Uploads a profile avatar to Firebase Storage:
 * `avatars/${userId}/${timestamp}_${fileName}`
 * Updates both Firebase Auth profile and Firestore user profile.
 */
export async function uploadUserProfilePhoto(
  userId: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error('Authentication required to update profile photo.');
  }

  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Sanitize file name extension
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `avatar_${Date.now()}.${ext}`;
  const storageRef = ref(storage, `avatars/${userId}/${fileName}`);

  const metadata = {
    contentType: file.type,
    customMetadata: {
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
    },
  };

  const uploadTask = uploadBytesResumable(storageRef, file, metadata);

  return new Promise<string>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(Math.round(progress));
        }
      },
      (error) => {
        console.error('[Storage] Upload error:', error);
        reject(new Error(`Failed to upload photo: ${error.message}`));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

          // Update Firebase Auth user
          if (auth.currentUser) {
            await updateProfile(auth.currentUser, { photoURL: downloadUrl });
          }

          // Update Firestore user document
          await updateUserProfile(userId, { photoURL: downloadUrl });

          resolve(downloadUrl);
        } catch (err) {
          console.error('[Storage] Error finalizing photo update:', err);
          reject(new Error(`Uploaded file but failed to update profile: ${(err as Error).message}`));
        }
      }
    );
  });
}

