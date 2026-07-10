"use client";

import About from "@/views/About";

import { AuthProvider } from "@/lib/auth-shim";

export default function ClientView() {
  return <AuthProvider><About /></AuthProvider>;
}
