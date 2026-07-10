"use client";

import BusinessDetail from "@/views/BusinessDetail";

import { AuthProvider } from "@/lib/auth-shim";

export default function ClientView() {
  return <AuthProvider><BusinessDetail /></AuthProvider>;
}
