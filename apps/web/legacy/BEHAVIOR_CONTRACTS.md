# Mocha Behavior Contracts

Generated before pass 09 from the original Mocha Worker source. These are
minimum route-preservation contracts that the Hono-to-Next conversion must
satisfy before the import can be considered feature-preserving.

- GET /api/reports/:reportId/download -> apps/web/src/app/api/reports/[reportId]/download/route.ts
  Evidence: `app.get("/api/reports/:reportId/download", authMiddleware, async (c) => {`
