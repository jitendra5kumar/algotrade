// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
export function getUserIdFromRequest(req: Request): string | null {
  // Prefer Authorization: Bearer <JWT or userId>; dev fallback to x-user-id
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice(7).trim();
    if (token) {
      // If token looks like a 24-char hex, treat as userId directly
      if (/^[a-fA-F0-9]{24}$/.test(token)) return token;
      // Try to decode JWT (unverified) and extract userId/id/_id
      const parts = token.split('.');
      if (parts.length >= 2) {
        try {
          const json = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
          const possible = json.userId || json.userID || json.id || json._id || json.sub;
          if (typeof possible === 'string') return possible;
        } catch {}
      }
    }
  }
  const id = req.headers.get('x-user-id');
  if (id) {
    // If looks like ObjectId, use directly
    if (/^[a-fA-F0-9]{24}$/.test(id)) return id;
    // Try decode JWT in x-user-id
    const parts = id.split('.');
    if (parts.length >= 2) {
      try {
        const json = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
        const possible = json.userId || json.userID || json.id || json._id || json.sub;
        if (typeof possible === 'string') return possible;
      } catch {}
    }
    return id; // last resort
  }
  return null;
}


