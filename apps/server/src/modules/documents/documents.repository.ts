import { eq, and, sum } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { documents } from '../../db/schema/index.js';
import { DocumentType } from '@tutorpair/shared';

export const documentsRepository = {
  async createDocument(data: {
    tutor_id: string;
    document_type: DocumentType;
    variant_id?: string | null;
    file_key: string;
    file_size_kb: number;
  }) {
    const [doc] = await db
      .insert(documents)
      .values({
        tutor_id: data.tutor_id,
        document_type: data.document_type,
        variant_id: data.variant_id ?? null,
        file_key: data.file_key,
        file_size_kb: data.file_size_kb,
      })
      .returning();
    return doc;
  },

  async findById(id: string) {
    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);
    return doc ?? null;
  },

  async deleteDocument(id: string, tutorId: string) {
    const [deleted] = await db
      .delete(documents)
      .where(and(eq(documents.id, id), eq(documents.tutor_id, tutorId)))
      .returning();
    return deleted ?? null;
  },

  async findDocumentsByTutorId(tutorId: string) {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.tutor_id, tutorId));
  },

  async getTotalStorageKb(tutorId: string): Promise<number> {
    const [result] = await db
      .select({ total: sum(documents.file_size_kb) })
      .from(documents)
      .where(eq(documents.tutor_id, tutorId));
    return result?.total ? Number(result.total) : 0;
  },
};
