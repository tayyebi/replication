export function djb2(s: string): number {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash) + s.charCodeAt(i);
    hash = hash & hash; // force 32-bit integer
  }
  return hash >>> 0; // unsigned
}

export function entryHash(hlc: string, entityId: string): number {
  return (djb2(hlc) ^ djb2(entityId)) >>> 0;
}
