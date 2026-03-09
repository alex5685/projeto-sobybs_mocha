import { Hono } from "hono";
import authRoutes from "../backend/routes/auth";
import profileRoutes from "../backend/routes/profiles";
import usersRoutes from "../backend/routes/users";
import businessRoutes from "../backend/routes/business";
import adminRoutes from "../backend/routes/admin";
import teamRoutes from "../backend/routes/team";
import paymentsRoutes from "../backend/routes/payments";
import documentsRoutes from "../backend/routes/documents";
import filesRoutes from "../backend/routes/files";

const app = new Hono<{ Bindings: Env }>();

app.route("/api", authRoutes);
app.route("/api/profiles", profileRoutes);
app.route("/api/users", usersRoutes);
app.route("/api/business", businessRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/team", teamRoutes);
app.route("/api/payments", paymentsRoutes);
app.route("/api/documents", documentsRoutes);
app.route("/api/files", filesRoutes);

export default app;
