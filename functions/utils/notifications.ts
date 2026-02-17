import { D1Database } from '../types/index';

export interface NotificationRecord {
  id: string;
  user_id: string;
  message: string;
  type: string;
  read: 0 | 1;
  created_at: string;
}

const MISSING_NOTIFICATIONS_TABLE_REGEX = /no such table:\s*notifications/i;

export function isMissingNotificationsTableError(error: unknown): boolean {
  if (error instanceof Error) {
    if (MISSING_NOTIFICATIONS_TABLE_REGEX.test(error.message)) {
      return true;
    }

    const maybeCause = (error as Error & { cause?: unknown }).cause;
    if (typeof maybeCause === 'string' && MISSING_NOTIFICATIONS_TABLE_REGEX.test(maybeCause)) {
      return true;
    }

    if (maybeCause instanceof Error && MISSING_NOTIFICATIONS_TABLE_REGEX.test(maybeCause.message)) {
      return true;
    }

    const nestedError = (error as Error & { error?: unknown }).error;
    if (typeof nestedError === 'string' && MISSING_NOTIFICATIONS_TABLE_REGEX.test(nestedError)) {
      return true;
    }
    if (nestedError instanceof Error && MISSING_NOTIFICATIONS_TABLE_REGEX.test(nestedError.message)) {
      return true;
    }

    return false;
  }

  if (typeof error === 'string') {
    return MISSING_NOTIFICATIONS_TABLE_REGEX.test(error);
  }

  if (typeof error === 'object' && error !== null) {
    try {
      const serialized = JSON.stringify(error);
      return MISSING_NOTIFICATIONS_TABLE_REGEX.test(serialized);
    } catch {
      return false;
    }
  }

  return false;
}

export async function ensureNotificationsSchema(db: D1Database): Promise<void> {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `).run();

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)
  `).run();

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)
  `).run();

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read)
  `).run();
}

export async function withNotificationsTable<T>(
  db: D1Database,
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isMissingNotificationsTableError(error)) {
      throw error;
    }

    console.warn('[Notifications] Table missing, creating schema and retrying operation');
    await ensureNotificationsSchema(db);
    return operation();
  }
}