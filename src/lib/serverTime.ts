let serverOffsetMs = 0;
let hasOffset = false;

export function updateServerTimeOffset(dateHeader?: string) {
  if (!dateHeader) return;
  const serverTime = new Date(dateHeader).getTime();
  if (Number.isNaN(serverTime)) return;
  serverOffsetMs = serverTime - Date.now();
  hasOffset = true;
}

export function getServerNow() {
  return new Date(Date.now() + (hasOffset ? serverOffsetMs : 0));
}

export function hasServerTimeOffset() {
  return hasOffset;
}
