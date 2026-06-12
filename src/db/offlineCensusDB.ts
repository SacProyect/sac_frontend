import Dexie, { type EntityTable } from 'dexie';
import type { OfflineCensusRecord, SyncStatus } from '@/types/census-quick-capture';

// ─── Web Crypto API helpers ───────────────────────────────────────────────────

export async function getEncryptionKey(token: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt',
  ]);
}

export async function encryptData(
  data: string,
  key: CryptoKey
): Promise<{ iv: Uint8Array; encrypted: ArrayBuffer }> {
  const iv = crypto.getRandomValues(new Uint8Array(12)) as Uint8Array<ArrayBuffer>;
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(data)
  );
  return { iv, encrypted };
}

export async function decryptData(encrypted: ArrayBuffer, iv: Uint8Array, key: CryptoKey): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as Uint8Array<ArrayBuffer> },
    key,
    encrypted
  );
  return new TextDecoder().decode(decrypted);
}

export async function encryptBuffer(
  buffer: ArrayBuffer,
  key: CryptoKey
): Promise<{ iv: Uint8Array; encrypted: ArrayBuffer }> {
  const iv = crypto.getRandomValues(new Uint8Array(12)) as Uint8Array<ArrayBuffer>;
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, buffer);
  return { iv, encrypted };
}

export async function decryptBuffer(encrypted: ArrayBuffer, iv: Uint8Array, key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as Uint8Array<ArrayBuffer> }, key, encrypted);
}

// ─── IndexedDB ────────────────────────────────────────────────────────────────

class OfflineCensusDB extends Dexie {
  censusRecords!: EntityTable<OfflineCensusRecord, 'id'>;

  constructor() {
    super('OfflineCensusDB');
    this.version(1).stores({
      censusRecords: '++id, status, createdAt',
    });
  }

  async addRecord(encryptedData: {
    encryptedPayload: ArrayBuffer;
    payloadIv: Uint8Array;
    encryptedPhoto: ArrayBuffer;
    photoIv: Uint8Array;
  }): Promise<string> {
    const now = new Date();
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    await this.censusRecords.add({
      id,
      ...encryptedData,
      status: 'PENDING_SYNC',
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  }

  async getPendingRecords(): Promise<OfflineCensusRecord[]> {
    return this.censusRecords.where('status').equals('PENDING_SYNC').toArray();
  }

  async getAllRecords(): Promise<OfflineCensusRecord[]> {
    return this.censusRecords.orderBy('createdAt').reverse().toArray();
  }

  async updateStatus(id: string, status: SyncStatus, errorMessage?: string): Promise<void> {
    const update: Partial<OfflineCensusRecord> = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'SYNC_ERROR') {
      const record = await this.censusRecords.get(id);
      if (record) {
        update.retryCount = (record.retryCount ?? 0) + 1;
      }
    }

    if (errorMessage !== undefined) {
      update.errorMessage = errorMessage;
    }

    await this.censusRecords.update(id, update);
  }

  async deleteRecord(id: string): Promise<void> {
    await this.censusRecords.delete(id);
  }

  async clearSynced(): Promise<number> {
    const synced = await this.censusRecords.where('status').equals('SYNCED').toArray();
    await this.censusRecords.bulkDelete(synced.map((r) => r.id));
    return synced.length;
  }
}

export const offlineCensusDB = new OfflineCensusDB();
