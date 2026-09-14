/**
 * No-op broadcast stub for Vercel serverless.
 * WebSocket is not supported in Vercel Functions; broadcasts are silently ignored.
 */
export const initializeWs = () => {
    console.log('[WebSocket] Stub: WebSocket disabled on Vercel (no-op).');
};

export const broadcast = (type, data = null) => {
    // Intentionally no-op — Vercel Functions are stateless
};
