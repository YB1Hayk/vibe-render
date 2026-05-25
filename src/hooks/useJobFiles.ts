import { supabase } from '../lib/supabase';

const ARCHIVE_BUCKET = 'job-archives';
const RESULT_BUCKET = 'job-results';
const SIGNED_URL_TTL = 3600; // 1 час

/** Загрузить архив проекта. Возвращает storage path. */
export async function uploadArchive(jobId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'zip';
  const path = `${jobId}/archive.${ext}`;
  const { error } = await supabase.storage.from(ARCHIVE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/** Загрузить результат (отрендеренные файлы). Возвращает storage path. */
export async function uploadResult(jobId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'zip';
  const path = `${jobId}/result.${ext}`;
  const { error } = await supabase.storage.from(RESULT_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (error) throw error;
  return path;
}

/** Получить подписанную ссылку для скачивания архива (действует 1 час). */
export async function getArchiveUrl(archivePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(ARCHIVE_BUCKET)
    .createSignedUrl(archivePath, SIGNED_URL_TTL);
  if (error) throw error;
  return data.signedUrl;
}

/** Получить подписанную ссылку для скачивания результата. */
export async function getResultUrl(resultPath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(RESULT_BUCKET)
    .createSignedUrl(resultPath, SIGNED_URL_TTL);
  if (error) throw error;
  return data.signedUrl;
}
