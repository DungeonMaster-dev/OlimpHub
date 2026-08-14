import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { sql } from "drizzle-orm";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { logEvent } from "../observability";
import { getDb } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));
  app.use((req, res, next) => {
    const startedAt = performance.now();
    res.on("finish", () =>
      logEvent(
        res.statusCode >= 500
          ? "error"
          : res.statusCode >= 400
            ? "warn"
            : "info",
        "http.request",
        {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          durationMs: Math.round(performance.now() - startedAt),
        }
      )
    );
    next();
  });
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.get("/api/healthz", (_req, res) =>
    res.status(200).json({ ok: true, service: "olymphub" })
  );
  app.get("/api/readyz", async (_req, res) => {
    try {
      const db = await getDb();
      if (!db)
        return res
          .status(503)
          .json({ ok: false, reason: "database_unavailable" });
      await db.execute(sql`SELECT 1`);
      return res.status(200).json({ ok: true, service: "olymphub" });
    } catch (error) {
      logEvent("error", "health.readiness_failed", {
        message:
          error instanceof Error ? error.message : "Unknown readiness error",
      });
      return res
        .status(503)
        .json({ ok: false, reason: "database_unavailable" });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError: ({ error, path, type }) =>
        logEvent("warn", "trpc.error", {
          code: error.code,
          path: path ?? null,
          procedureType: type,
        }),
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      const message =
        error instanceof Error ? error.message : "Unknown server error";
      logEvent("error", "http.unhandled_error", { message });
      if (!res.headersSent)
        res.status(500).json({ error: "internal_server_error" });
    }
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(error => {
  logEvent("error", "server.startup_failed", {
    message: error instanceof Error ? error.message : "Unknown startup error",
  });
  process.exitCode = 1;
});
