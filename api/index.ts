import { createServer } from "http";
import app, { setupApp } from "../server/index";

// Initialize the app
const httpServer = createServer(app);
setupApp(httpServer, app);

export default async function handler(req: any, res: any) {
  // Use the express app to handle the request
  app(req, res);
}
