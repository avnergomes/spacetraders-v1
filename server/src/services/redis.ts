class InMemoryRedis {
  private store = new Map<string, { value: string; expiresAt: number }>();

  async setex(key: string, seconds: number, value: string): Promise<void> {
    const expiresAt = Date.now() + seconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  get(key: string): string | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }
}

export const redis = new InMemoryRedis();
