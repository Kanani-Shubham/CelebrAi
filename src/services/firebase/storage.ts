import { logger } from '../../utils/logger';
import { ref, uploadBytesResumable, getDownloadURL, type UploadTask } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { storage, auth } from './config';
import { updateUserProfile } from './auth';

// Ensure storage operations fail fast if bucket is unconfigured or blocked
try {
  storage.maxUploadRetryTime = 15000; // 15 seconds max retry (default is minutes)
  storage.maxOperationRetryTime = 15000;
} catch {
  // Ignore in environments where properties are read-only
}

export interface UploadProgressCallback {
  (progress: number): void;
}

/**
 * Validates an image file before upload.
 * Checks MIME type (JPEG, PNG, WebP) and size limit (5MB).
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

export interface ManagedUpload {
  promise: Promise<string>;
  cancel: () => void;
}

/**
 * Uploads a profile avatar to Firebase Storage:
 * `avatars/${userId}/${timestamp}_${fileName}`
 *
 * Progress updates are reported via onProgress callback.
 * On success, updates Firebase Auth photoURL and Firestore user document.
 * Provides a cancel() handle to stop stuck uploads.
 */
export function uploadUserProfilePhoto(
  userId: string,
  file: File,
  onProgress?: UploadProgressCallback
): ManagedUpload {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return {
      promise: Promise.reject(new Error('Authentication required to update profile photo.')),
      cancel: () => {},
    };
  }

  const validation = validateImageFile(file);
  if (!validation.valid) {
    return {
      promise: Promise.reject(new Error(validation.error)),
      cancel: () => {},
    };
  }

  // Sanitize file name extension
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const fileName = `avatar_${Date.now()}.${ext}`;
  const storageRef = ref(storage, `avatars/${userId}/${fileName}`);

  const metadata = {
    contentType: file.type,
    customMetadata: {
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
    },
  };

  const uploadTask: UploadTask = uploadBytesResumable(storageRef, file, metadata);
  let isCancelled = false;

  const promise = new Promise<string>((resolve, reject) => {
    // 18-second timeout guard: if 0 bytes transfer, cancel task to prevent modal freeze
    const timeoutTimer = setTimeout(() => {
      if (!isCancelled) {
        uploadTask.cancel();
        const bucket = storage.app.options.storageBucket || 'celebrai-62487.firebasestorage.app';
        reject(
          new Error(
            `Firebase Storage request timed out for bucket "${bucket}". Please verify in Firebase Console (Storage tab) that Cloud Storage has been activated ('Get Started') and rules allow write.`
          )
        );
      }
    }, 18000);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(Math.round(progress));
        }
      },
      (error) => {
        clearTimeout(timeoutTimer);
        logger.error('[Storage Error]', error);

        if (isCancelled || error.code === 'storage/canceled') {
          reject(new Error('Upload was cancelled.'));
          return;
        }

        const bucket = storage.app.options.storageBucket || 'celebrai-62487.firebasestorage.app';

        if (error.code === 'storage/bucket-not-found' || error.message.includes('404')) {
          reject(
            new Error(
              `Storage bucket "${bucket}" was not found. Please open Firebase Console -> Build -> Storage and click "Get Started" to initialize your storage bucket.`
            )
          );
        } else if (error.code === 'storage/unauthorized') {
          reject(new Error('Permission denied. You do not have permission to upload to this location.'));
        } else if (error.code === 'storage/retry-limit-exceeded' || error.message.includes('network')) {
          reject(
            new Error(
              `Network error reaching Firebase Storage bucket "${bucket}". Ensure the bucket is provisioned and CORS allows uploads from this origin.`
            )
          );
        } else {
          reject(new Error(error.message || 'Failed to upload photo to Firebase Storage.'));
        }
      },
      async () => {
        clearTimeout(timeoutTimer);
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

          // 1. Update Firebase Auth user
          if (auth.currentUser) {
            await updateProfile(auth.currentUser, { photoURL: downloadUrl });
          }

          // 2. Update Firestore user document
          await updateUserProfile(userId, { photoURL: downloadUrl });

          resolve(downloadUrl);
        } catch (finalizeErr) {
          logger.error('[Storage Finalize Error]', finalizeErr);
          reject(new Error(`Image uploaded, but failed to persist URL: ${(finalizeErr as Error).message}`));
        }
      }
    );
  });

  return {
    promise,
    cancel: () => {
      isCancelled = true;
      try {
        uploadTask.cancel();
      } catch {
        // Task already completed or cancelled
      }
    },
  };
}
