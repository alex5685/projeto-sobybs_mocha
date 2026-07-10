"use client";

import AuthCallback from "@/views/AuthCallback";

import { AuthProvider } from "@/lib/auth-shim";

export default function ClientView() {
  return <AuthProvider><AuthCallback /></AuthProvider>;
}
