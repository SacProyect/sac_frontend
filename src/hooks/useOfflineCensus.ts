import { useCallback, useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  offlineCensusDB,
  getEncryptionKey,
  encryptData,
  decryptData,
  encryptBuffer,
  decryptBuffer,
} from '@/db/offlineCensusDB';
import { compressImage } from '@/utils/compressImage';
import { apiConnection } from '@/components/utils/api/api-connection';
import type { QuickCapturePayload, OfflineCensusRecord } from '@/types/census-quick-capture';

const TARGET_IMAGE_MAX_WIDTH = 1280;
const TARGET_IMAGE_MAX_HEIGHT = 1280;
const TARGET_IMAGE_QUALITY = 0.85;

export function useOfflineCensus() {
  const { token } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const syncLock = useRef<boolean>(false);

  const pendingCount = useLiveQuery(
    () => offlineCensusDB.censusRecords.where('status').equals('PENDING_SYNC').count(),
    [],
    0
  );

  const records = useLiveQuery(
    () => offlineCensusDB.getAllRecords(),
    [],
    []
  );

  // Escuchar cambios de conectividad
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexión restaurada. Sincronizando datos...');
      syncPending();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Sin conexión. Los datos se guardarán localmente.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sincronizar automáticamente al montar si hay conexión
  useEffect(() => {
    if (navigator.onLine) {
      syncPending();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveOffline = useCallback(
    async (payload: QuickCapturePayload, photoFile: File): Promise<string> => {
      if (!token) {
        throw new Error('No hay sesión activa para encriptar datos offline');
      }

      const compressedBlob = await compressImage(
        photoFile,
        TARGET_IMAGE_MAX_WIDTH,
        TARGET_IMAGE_MAX_HEIGHT,
        TARGET_IMAGE_QUALITY
      );

      const key = await getEncryptionKey(token);
      const payloadJson = JSON.stringify(payload);
      const encryptedPayload = await encryptData(payloadJson, key);
      const photoBuffer = await compressedBlob.arrayBuffer();
      const encryptedPhoto = await encryptBuffer(photoBuffer, key);

      const id = await offlineCensusDB.addRecord({
        encryptedPayload: encryptedPayload.encrypted,
        payloadIv: encryptedPayload.iv,
        encryptedPhoto: encryptedPhoto.encrypted,
        photoIv: encryptedPhoto.iv,
      });

      if (!navigator.onLine) {
        toast('Registro guardado localmente (sin conexión)', { icon: '💾' });
      } else {
        toast.success('Registro guardado localmente');
        // Intentar sincronizar inmediatamente si hay conexión
        syncPending();
      }

      return id;
    },
    [token]
  );

  const syncPending = useCallback(async () => {
    if (syncLock.current) return;
    if (!navigator.onLine) return;
    if (!token) return;

    syncLock.current = true;
    setIsSyncing(true);

    try {
      const pending = await offlineCensusDB.getPendingRecords();
      const key = await getEncryptionKey(token);

      for (const record of pending) {
        await offlineCensusDB.updateStatus(record.id, 'SYNCING');

        try {
          const payloadJson = await decryptData(record.encryptedPayload, record.payloadIv, key);
          const payload = JSON.parse(payloadJson);
          const photoBuffer = await decryptBuffer(record.encryptedPhoto, record.photoIv, key);
          const photoBlob = new Blob([photoBuffer], { type: 'image/jpeg' });

          const formData = new FormData();
          formData.append('payload', JSON.stringify(payload));
          formData.append('photo', photoBlob, `photo-${record.id}.jpg`);

          await apiConnection.post('/census/quick-capture', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          await offlineCensusDB.updateStatus(record.id, 'SYNCED');
        } catch (err: any) {
          const message = err?.response?.data?.message ?? err?.message ?? 'Error desconocido';
          await offlineCensusDB.updateStatus(record.id, 'SYNC_ERROR', message);
        }
      }

      const stillPending = await offlineCensusDB.getPendingRecords();
      if (stillPending.length === 0 && pending.length > 0) {
        toast.success('Todos los registros han sido sincronizados');
      }
    } catch (err: any) {
      toast.error(`Error durante la sincronización: ${err?.message ?? 'Error desconocido'}`);
    } finally {
      syncLock.current = false;
      setIsSyncing(false);
    }
  }, [token]);

  const deleteRecord = useCallback(async (id: string): Promise<void> => {
    await offlineCensusDB.deleteRecord(id);
    toast.success('Registro eliminado');
  }, []);

  const getRecords = useCallback((): OfflineCensusRecord[] => {
    return records ?? [];
  }, [records]);

  return {
    isOnline,
    pendingCount: pendingCount ?? 0,
    isSyncing,
    saveOffline,
    syncPending,
    deleteRecord,
    getRecords,
  };
}
