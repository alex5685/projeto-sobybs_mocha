import { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";
import type { Env } from "@/shared/types";

const app = new Hono<{ Bindings: Env }>();

// Helper function to generate UUID
function generateUUID() {
  return crypto.randomUUID();
}

// Helper function to get file extension
function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

// Helper function to get content type
function getContentType(filename: string): string {
  const ext = getFileExtension(filename);
  const contentTypes: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    txt: "text/plain",
    csv: "text/csv",
    zip: "application/zip",
    rar: "application/x-rar-compressed",
  };
  return contentTypes[ext] || "application/octet-stream";
}

// POST /api/documents/upload - Upload a document
app.post("/upload", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // Check user profile
    const profile = await c.env.DB.prepare(
      `SELECT user_type FROM user_profiles WHERE id = ?`
    )
      .bind(user.id)
      .first();

    if (!profile) {
      return c.json({ error: "Perfil não encontrado" }, 404);
    }

    const userType = profile.user_type as string;
    const allowedTypes = ["comprador", "vendedor", "hibrido", "admin"];

    if (!allowedTypes.includes(userType)) {
      return c.json({ error: "Seu tipo de perfil não tem permissão para fazer upload de documentos" }, 403);
    }

    // Get business_id from query parameter (optional - can be null for user documents)
    const businessId = c.req.query("business_id") || null;

    // If business_id is provided, verify ownership
    if (businessId) {
      const business = await c.env.DB.prepare(
        `SELECT owner_id FROM businesses WHERE id = ?`
      )
        .bind(businessId)
        .first();

      if (!business) {
        return c.json({ error: "Empresa não encontrada" }, 404);
      }

      if (business.owner_id !== user.id && userType !== "admin") {
        return c.json({ error: "Sem permissão para fazer upload para esta empresa" }, 403);
      }
    }

    const formData = await c.req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return c.json({ error: "Nenhum arquivo enviado" }, 400);
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json({ error: "Arquivo muito grande. Tamanho máximo: 10MB" }, 400);
    }

    // Generate unique storage key
    const documentId = generateUUID();
    const timestamp = Date.now();
    const storageKey = businessId 
      ? `businesses/${businessId}/${timestamp}-${file.name}`
      : `users/${user.id}/${timestamp}-${file.name}`;

    // Upload to R2
    const contentType = getContentType(file.name);
    await c.env.R2_BUCKET.put(storageKey, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: contentType,
        contentDisposition: `attachment; filename="${file.name}"`,
      },
      customMetadata: {
        uploadedBy: user.id,
        originalName: file.name,
      },
    });

    // Save metadata to database
    await c.env.DB.prepare(
      `INSERT INTO secure_documents (id, business_id, file_name, storage_key, access_level)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(
        documentId,
        businessId || `user:${user.id}`,
        file.name,
        storageKey,
        businessId ? "business" : "private"
      )
      .run();

    return c.json({
      success: true,
      document: {
        id: documentId,
        file_name: file.name,
        size: file.size,
        uploaded_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    return c.json({ error: "Erro ao fazer upload do documento" }, 500);
  }
});

// GET /api/documents/list - List user's documents
app.get("/list", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const profile = await c.env.DB.prepare(
      `SELECT user_type FROM user_profiles WHERE id = ?`
    )
      .bind(user.id)
      .first();

    if (!profile) {
      return c.json({ error: "Perfil não encontrado" }, 404);
    }

    const userType = profile.user_type as string;
    const businessId = c.req.query("business_id") || null;

    let documents;

    if (businessId) {
      // List documents for a specific business
      const business = await c.env.DB.prepare(
        `SELECT owner_id FROM businesses WHERE id = ?`
      )
        .bind(businessId)
        .first();

      if (!business) {
        return c.json({ error: "Empresa não encontrada" }, 404);
      }

      if (business.owner_id !== user.id && userType !== "admin") {
        return c.json({ error: "Sem permissão para visualizar documentos desta empresa" }, 403);
      }

      documents = await c.env.DB.prepare(
        `SELECT id, file_name, storage_key, uploaded_at 
         FROM secure_documents 
         WHERE business_id = ?
         ORDER BY uploaded_at DESC`
      )
        .bind(businessId)
        .all();
    } else {
      // List user's personal documents
      documents = await c.env.DB.prepare(
        `SELECT id, file_name, storage_key, uploaded_at 
         FROM secure_documents 
         WHERE business_id = ?
         ORDER BY uploaded_at DESC`
      )
        .bind(`user:${user.id}`)
        .all();
    }

    return c.json({ documents: documents.results || [] });
  } catch (error) {
    console.error("Error listing documents:", error);
    return c.json({ error: "Erro ao listar documentos" }, 500);
  }
});

// GET /api/documents/download/:id - Download a document
app.get("/download/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const documentId = c.req.param("id");

  try {
    // Get document metadata
    const doc = await c.env.DB.prepare(
      `SELECT * FROM secure_documents WHERE id = ?`
    )
      .bind(documentId)
      .first();

    if (!doc) {
      return c.json({ error: "Documento não encontrado" }, 404);
    }

    // Check permissions
    const profile = await c.env.DB.prepare(
      `SELECT user_type FROM user_profiles WHERE id = ?`
    )
      .bind(user.id)
      .first();

    const userType = profile?.user_type as string;

    // Check if user has access to this document
    const businessId = doc.business_id as string;
    if (businessId.startsWith("user:")) {
      // Personal document - only owner or admin can access
      const ownerId = businessId.replace("user:", "");
      if (ownerId !== user.id && userType !== "admin") {
        return c.json({ error: "Sem permissão para acessar este documento" }, 403);
      }
    } else {
      // Business document - check ownership
      const business = await c.env.DB.prepare(
        `SELECT owner_id FROM businesses WHERE id = ?`
      )
        .bind(businessId)
        .first();

      if (!business) {
        return c.json({ error: "Empresa não encontrada" }, 404);
      }

      if (business.owner_id !== user.id && userType !== "admin") {
        return c.json({ error: "Sem permissão para acessar este documento" }, 403);
      }
    }

    // Get file from R2
    const storageKey = doc.storage_key as string;
    const object = await c.env.R2_BUCKET.get(storageKey);

    if (!object) {
      return c.json({ error: "Arquivo não encontrado no storage" }, 404);
    }

    // Set appropriate headers
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Content-Disposition", `attachment; filename="${doc.file_name}"`);

    // Convert to array buffer to avoid type conflicts
    const arrayBuffer = await object.arrayBuffer();
    return new Response(arrayBuffer, { headers });
  } catch (error) {
    console.error("Error downloading document:", error);
    return c.json({ error: "Erro ao fazer download do documento" }, 500);
  }
});

// DELETE /api/documents/:id - Delete a document
app.delete("/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const documentId = c.req.param("id");

  try {
    // Get document metadata
    const doc = await c.env.DB.prepare(
      `SELECT * FROM secure_documents WHERE id = ?`
    )
      .bind(documentId)
      .first();

    if (!doc) {
      return c.json({ error: "Documento não encontrado" }, 404);
    }

    // Check permissions
    const profile = await c.env.DB.prepare(
      `SELECT user_type FROM user_profiles WHERE id = ?`
    )
      .bind(user.id)
      .first();

    const userType = profile?.user_type as string;

    // Check if user has permission to delete
    const businessId = doc.business_id as string;
    if (businessId.startsWith("user:")) {
      const ownerId = businessId.replace("user:", "");
      if (ownerId !== user.id && userType !== "admin") {
        return c.json({ error: "Sem permissão para excluir este documento" }, 403);
      }
    } else {
      const business = await c.env.DB.prepare(
        `SELECT owner_id FROM businesses WHERE id = ?`
      )
        .bind(businessId)
        .first();

      if (!business) {
        return c.json({ error: "Empresa não encontrada" }, 404);
      }

      if (business.owner_id !== user.id && userType !== "admin") {
        return c.json({ error: "Sem permissão para excluir este documento" }, 403);
      }
    }

    // Delete from R2
    const storageKey = doc.storage_key as string;
    await c.env.R2_BUCKET.delete(storageKey);

    // Delete from database
    await c.env.DB.prepare(
      `DELETE FROM secure_documents WHERE id = ?`
    )
      .bind(documentId)
      .run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return c.json({ error: "Erro ao excluir documento" }, 500);
  }
});

export default app;
