import { NextRequest, NextResponse } from "next/server";
import sql from "@/app/api/utils/sql";
import { auth } from "@/lib/auth";

// GET /api/reports/:reportId/download
// Protected report download. Ported from the Hono worker route:
//   app.get("/api/reports/:reportId/download", authMiddleware, async (c) => { ... })
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reportId } = await params;

  try {
    // Find valuation with this report_id
    const valuationRows = await sql`
      SELECT v.*, b.owner_id
      FROM valuations v
      JOIN businesses b ON v.business_id = b.id
      WHERE v.report_id = ${reportId}
    `;
    const valuation = valuationRows[0];

    if (!valuation) {
      return NextResponse.json(
        { error: "Relatório não encontrado" },
        { status: 404 }
      );
    }

    // Check authorization
    const profileRows = await sql`
      SELECT user_type FROM user_profiles WHERE id = ${String(user.id)}
    `;
    const profile = profileRows[0];

    const isAdmin = profile?.user_type === "admin";
    const isOwner = valuation.owner_id === String(user.id);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // The original worker returned a placeholder response and never streamed a
    // real PDF (the R2 fetch was a TODO). Preserve that behavior. Migrated asset
    // URLs in the DB are already public Anything upload URLs, so if a real
    // report URL is stored on the valuation it can be redirected to instead.
    return NextResponse.json({
      success: true,
      message: "Relatório disponível para download",
      report_id: reportId,
    });
  } catch (error) {
    console.error("Error downloading report:", error);
    return NextResponse.json(
      { error: "Erro ao baixar relatório" },
      { status: 500 }
    );
  }
}
