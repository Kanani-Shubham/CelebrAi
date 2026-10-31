// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  saveAvatarBlob,
  getAvatarBlob,
  deleteAvatarBlob,
  openAvatarDB,
} from '../services/storage/indexedDBAvatar';
import { validateAvatarFile } from '../utils/imageCompressor';

describe('Local IndexedDB Avatar Store', () => {
  beforeEach(async () => {
    // Clear indexedDB before each test
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
      }
    }
  });

  it('initializes the database with name "celebrai-local-cache" and store "avatars"', async () => {
    const db = await openAvatarDB();
    expect(db.name).toBe('celebrai-local-cache');
    expect(db.objectStoreNames.contains('avatars')).toBe(true);
    db.close();
  });

  it('saves and retrieves an avatar Blob for an authenticated user UID', async () => {
    const testUid = 'user_abc_123';
    const fakeBlob = new Blob(['avatar-image-binary-data'], { type: 'image/webp' });

    await saveAvatarBlob(testUid, fakeBlob);

    const retrievedBlob = await getAvatarBlob(testUid);
    expect(retrievedBlob).toBeInstanceOf(Blob);
    expect(retrievedBlob?.type).toBe('image/webp');
    expect(retrievedBlob?.size).toBe(fakeBlob.size);
  });

  it('isolates avatars between different user accounts', async () => {
    const userA = 'user_alpha_1';
    const userB = 'user_beta_2';

    const blobA = new Blob(['alpha-avatar-content'], { type: 'image/jpeg' });
    const blobB = new Blob(['beta-avatar-content-different-bytes'], { type: 'image/webp' });

    await saveAvatarBlob(userA, blobA);
    await saveAvatarBlob(userB, blobB);

    const retrievedA = await getAvatarBlob(userA);
    const retrievedB = await getAvatarBlob(userB);

    expect(retrievedA?.size).toBe(blobA.size);
    expect(retrievedB?.size).toBe(blobB.size);
    expect(retrievedA?.size).not.toBe(retrievedB?.size);

    // Non-existent user returns null
    const retrievedNone = await getAvatarBlob('unknown_user');
    expect(retrievedNone).toBeNull();
  });

  it('deletes an avatar by UID without affecting other users', async () => {
    const userA = 'user_to_delete';
    const userB = 'user_to_keep';

    const blobA = new Blob(['delete-me'], { type: 'image/png' });
    const blobB = new Blob(['keep-me'], { type: 'image/png' });

    await saveAvatarBlob(userA, blobA);
    await saveAvatarBlob(userB, blobB);

    await deleteAvatarBlob(userA);

    expect(await getAvatarBlob(userA)).toBeNull();
    expect(await getAvatarBlob(userB)).not.toBeNull();
  });

  it('gracefully handles missing or invalid UID', async () => {
    const emptyUidBlob = await getAvatarBlob('');
    expect(emptyUidBlob).toBeNull();

    await expect(saveAvatarBlob('', new Blob([]))).rejects.toThrow();
  });
});

describe('Avatar Image Validator', () => {
  it('accepts valid JPEG, PNG, and WebP files', () => {
    const jpegFile = new File(['fake-jpg'], 'photo.jpg', { type: 'image/jpeg' });
    const pngFile = new File(['fake-png'], 'avatar.png', { type: 'image/png' });
    const webpFile = new File(['fake-webp'], 'profile.webp', { type: 'image/webp' });

    expect(validateAvatarFile(jpegFile).valid).toBe(true);
    expect(validateAvatarFile(pngFile).valid).toBe(true);
    expect(validateAvatarFile(webpFile).valid).toBe(true);
  });

  it('rejects unsupported file formats like GIF, SVG, PDF, and HTML', () => {
    const gifFile = new File(['fake-gif'], 'anim.gif', { type: 'image/gif' });
    const svgFile = new File(['<svg></svg>'], 'vector.svg', { type: 'image/svg+xml' });
    const pdfFile = new File(['fake-pdf'], 'doc.pdf', { type: 'application/pdf' });
    const htmlFile = new File(['<h1></h1>'], 'index.html', { type: 'text/html' });

    expect(validateAvatarFile(gifFile).valid).toBe(false);
    expect(validateAvatarFile(gifFile).error).toContain('Unsupported image format');

    expect(validateAvatarFile(svgFile).valid).toBe(false);
    expect(validateAvatarFile(pdfFile).valid).toBe(false);
    expect(validateAvatarFile(htmlFile).valid).toBe(false);
  });

  it('rejects files exceeding 10 MB', () => {
    // 11 MB mock file
    const bigFile = new File(['x'], 'huge.jpg', { type: 'image/jpeg' });
    Object.defineProperty(bigFile, 'size', { value: 11 * 1024 * 1024 });

    const result = validateAvatarFile(bigFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('too large');
  });
});

