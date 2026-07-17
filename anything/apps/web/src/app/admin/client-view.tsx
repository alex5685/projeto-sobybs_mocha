"use client";

import AdminPanel from "@/views/AdminPanel";

import { AuthProvider } from "@/lib/auth-shim";

export default function ClientView() {
  return <AuthProvider><AdminPanel /></AuthProvider>;
}
