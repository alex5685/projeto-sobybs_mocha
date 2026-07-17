import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

// GET /api/files/:key - Download a file from R2
app.get("/*", async (c) => {
  // Extract the full path after /api/files/
  const fullPath = c.req.path;
  const key = fullPath.replace(/^\/api\/files\//, "");
  
  if (!key) {
    return c.json({ error: "File key is required" }, 400);
  }
  
  console.log("Fetching file with key:", key);
  
  try {
    const object = await c.env.R2_BUCKET.get(key);
    
    if (!object) {
      console.log("File not found in R2:", key);
      return c.json({ error: "File not found" }, 404);
    }
    
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    
    return c.body(object.body, { headers });
  } catch (error) {
    console.error("Error fetching file:", error);
    return c.json({ error: "Error fetching file" }, 500);
  }
});

export default app;
