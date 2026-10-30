/**
 * indexedDBAvatar.ts
 * Local persistent IndexedDB repository for user profile avatars.
 *
 * Database:   celebrai-local-cache
 * ObjectStore: avatars
 * Key:        User UID (string)
 * Value:      Blob
 */

const DB_NAME = 'celebrai-local-cache';
const DB_VERSION = 1;
const STORE_NAME = 'avatars';

/**
 * Initializes and opens the IndexedDB database.
 */
export function openAvatarDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported or is disabled in this browser.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open local avatar cache database.'));
    };

    request.onblocked = () => {
      console.warn('[IndexedDB] Database upgrade blocked by another open tab.');
    };
  });
}

/**
 * Saves an avatar Blob to IndexedDB keyed by the user's UID.
 */
export async function saveAvatarBlob(uid: string, blob: Blob): Promise<void> {
  if (!uid || typeof uid !== 'string') {
    throw new Error('Valid user UID is required to save avatar.');
  }
  if (!(blob instanceof Blob)) {
    throw new Error('Avatar must be a valid Blob instance.');
  }

  const db = await openAvatarDB();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const putRequest = store.put(blob, uid);

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => {
        const err = putRequest.error;
        if (err && err.name === 'QuotaExceededError') {
          reject(new Error('Local storage quota exceeded. Please clear space on your device.'));
        } else {
          reject(err || new Error('Failed to store avatar in local cache.'));
        }
      };

      transaction.oncomplete = () => db.close();
      transaction.onerror = () => {
        db.close();
        reject(transaction.error || new Error('Transaction error while saving avatar.'));
      };
    } catch (err) {
      db.close();
      reject(err);
    }
  });
}

/**
 * Retrieves the avatar Blob for a specific UID from IndexedDB.
 */
export async function getAvatarBlob(uid: string): Promise<Blob | null> {
  if (!uid || typeof uid !== 'string') return null;

  try {
    const db = await openAvatarDB();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const getRequest = store.get(uid);

        getRequest.onsuccess = () => {
          const result = getRequest.result;
          resolve(result instanceof Blob ? result : null);
        };

        getRequest.onerror = () => {
          reject(getRequest.error || new Error('Failed to retrieve avatar from cache.'));
        };

        transaction.oncomplete = () => db.close();
        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
      } catch (err) {
        db.close();
        reject(err);
      }
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not read avatar cache:', err);
    return null;
  }
}

/**
 * Deletes the avatar for a specific UID from IndexedDB.
 */
export async function deleteAvatarBlob(uid: string): Promise<void> {
  if (!uid) return;

  try {
    const db = await openAvatarDB();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const deleteRequest = store.delete(uid);

        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);

        transaction.oncomplete = () => db.close();
        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
      } catch (err) {
        db.close();
        reject(err);
      }
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not delete cached avatar:', err);
  }
}

