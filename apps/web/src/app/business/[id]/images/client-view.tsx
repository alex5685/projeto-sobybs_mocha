"use client";

import ManageBusinessImages from "@/views/ManageBusinessImages";

import { AuthProvider } from "@/lib/auth-shim";

export default function ClientView() {
  return <AuthProvider><ManageBusinessImages /></AuthProvider>;
}
