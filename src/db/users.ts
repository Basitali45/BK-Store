import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';

const OWNER_EMAILS = new Set(['b909289@gmail.com']);

export async function getOrCreateUser(uid: string, email: string, displayName?: string | null) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    const totalUsers = existing.length === 0 ? await db.select({ id: users.id }).from(users).limit(1) : [];
    const shouldBeAdmin =
      OWNER_EMAILS.has(email.toLowerCase()) ||
      (existing.length === 0 && totalUsers.length === 0) ||
      existing[0]?.role === 'admin';

    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName ?? null,
        role: shouldBeAdmin ? 'admin' : 'customer',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName ?? existing[0]?.displayName ?? null,
          ...(OWNER_EMAILS.has(email.toLowerCase()) ? { role: 'admin' } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database user upsert failed:', error);
    throw new Error('Failed to synchronize user account.', { cause: error });
  }
}

export async function promoteUserToAdmin(uid: string) {
  try {
    const result = await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.uid, uid))
      .returning();
    return result[0] ?? null;
  } catch (error) {
    console.error('Database admin promotion failed:', error);
    throw new Error('Failed to update user role.', { cause: error });
  }
}
