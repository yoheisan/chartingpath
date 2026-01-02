// Safe storage for environments where localStorage is blocked (some in-app browsers / privacy modes)
// Supabase expects a Storage-like interface.

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

class MemoryStorage implements StorageLike {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }
}

export function getSupabaseStorage(): StorageLike {
  try {
    const ls = window.localStorage;
    const k = "__cp_storage_test__";
    ls.setItem(k, "1");
    ls.removeItem(k);
    return ls;
  } catch {
    // Fallback avoids blank-page crashes; PKCE links may not work if storage is blocked.
    return new MemoryStorage();
  }
}

export function hasPersistentBrowserStorage(): boolean {
  try {
    const ls = window.localStorage;
    const k = "__cp_storage_test__";
    ls.setItem(k, "1");
    ls.removeItem(k);
    return true;
  } catch {
    return false;
  }
}
