import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// Setup the app with routes and static files
(async () => {
  // Debug: Log environment variables and detection
  console.log("\n=== SERVER STARTUP DEBUG ===");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("VERCEL:", process.env.VERCEL);
  console.log("process.cwd():", process.cwd());

  // Check if dist/public exists
  const fs = await import("fs");
  const path = await import("path");
  const distPublicPath = path.default.resolve(process.cwd(), "dist", "public");
  console.log("distPublicPath:", distPublicPath);
  console.log("dist/public exists:", fs.default.existsSync(distPublicPath));

  // Check what's in dist
  const distPath = path.default.resolve(process.cwd(), "dist");
  if (fs.default.existsSync(distPath)) {
    const distContents = fs.default.readdirSync(distPath);
    console.log("dist/ contents:", distContents);
  }
  console.log("=========================\n");

  // Always serve static files FIRST (both production and Vercel)
  const isProduction =
    process.env.NODE_ENV === "production" || process.env.VERCEL;

  console.log("isProduction:", isProduction);

  if (isProduction) {
    console.log("LOADING: serveStatic middleware");
    try {
      serveStatic(app);
      console.log("SUCCESS: serveStatic middleware loaded");
    } catch (err) {
      console.error("ERROR loading serveStatic:", err);
      throw err;
    }
  } else {
    // Setup Vite dev server in development
    console.log("LOADING: Vite dev server middleware");
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
    console.log("SUCCESS: Vite dev server middleware loaded");
  }

  // Then register API routes
  console.log("LOADING: API routes");
  await registerRoutes(httpServer, app);
  console.log("SUCCESS: API routes loaded");

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Start listening on the specified port
  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.env.NODE_ENV === "development" ? "127.0.0.1" : "0.0.0.0";

  httpServer.listen(
    {
      port,
      host,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();

export default app;
