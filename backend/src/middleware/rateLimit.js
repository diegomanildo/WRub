/**
 * Rate limit en memoria, sin dependencias: ventana fija por IP.
 *
 * Pensado para /api/share/:token, que es el único endpoint público de la
 * API. El token es random, pero sin límite nada impide probarlos a ritmo
 * libre hasta acertar uno; con esto la fuerza bruta deja de ser práctica.
 *
 * En memoria alcanza porque el server es un solo proceso (better-sqlite3
 * ya lo ata a uno). Si algún día hay varias instancias, esto hay que
 * moverlo a un store compartido.
 */
function rateLimit({ windowMs, max }) {
  const hits = new Map();

  // Limpieza periódica: sin esto el Map crece con una entrada por IP para
  // siempre. unref() para que el timer no mantenga vivo el proceso.
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (now > entry.resetAt) hits.delete(key);
    }
  }, windowMs);
  cleanup.unref();

  return function rateLimitMiddleware(req, res, next) {
    const key = req.ip;
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfter));

      const error = new Error("Demasiadas solicitudes, probá de nuevo en un rato");
      error.status = 429;
      return next(error);
    }

    next();
  };
}

module.exports = rateLimit;
