"use client";

import Dashboard from "@/views/Dashboard";

import { AuthProvider } from "@/lib/auth-shim";

export default function ClientView() {
  return <AuthProvider><Dashboard /></AuthProvider>;
}
