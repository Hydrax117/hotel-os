import { createClient, SupabaseClient } from '@supabase/supabase-js';

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? 'hotel-images';

let _client: SupabaseClient | undefined;

function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return _client;
}

/**
 * Uploads a file to Supabase Storage and returns its public URL.
 * Path pattern: `${hotelId}/${category}/${uuid}.${ext}`
 */
export async function uploadImage(
  file: File,
  hotelId: string,
  category: string,
): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${hotelId}/${category}/${crypto.randomUUID()}.${ext}`;

  const client = getSupabaseClient();
  const { error } = await client.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);

  return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Extracts the storage path from a Supabase public URL.
 * Returns everything after `/object/public/<bucket>/`.
 */
export function extractStoragePath(publicUrl: string): string {
  const marker = `/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return publicUrl;
  return publicUrl.slice(idx + marker.length);
}

/**
 * Deletes a file from Supabase Storage by its storage path.
 */
export async function deleteImage(storagePath: string): Promise<void> {
  const { error } = await getSupabaseClient().storage.from(BUCKET).remove([storagePath]);
  if (error) throw new Error(error.message);
}

const DOCUMENTS_BUCKET = 'hotel-documents';

/**
 * Uploads a verification document to Supabase Storage and returns its public URL.
 * Path pattern: `${hotelId}/${docType}/${uuid}.${ext}`
 */
export async function uploadDocument(
  file: File,
  hotelId: string,
  docType: string,
): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${hotelId}/${docType}/${crypto.randomUUID()}.${ext}`;

  const client = getSupabaseClient();
  // upsert: false matches uploadImage behaviour — fail loudly on path collisions.
  // UUID-based paths make collisions practically impossible, but we prefer
  // fail-loud over silent overwrites to make any future path-reuse bugs visible.
  const { error } = await client.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw new Error(`Document upload failed: ${error.message}`);

  return client.storage.from(DOCUMENTS_BUCKET).getPublicUrl(path).data.publicUrl;
}
