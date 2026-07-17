"use client";

import Home from "@/views/Home";

import { AuthProvider } from "@/lib/auth-shim";

export default function ClientView() {
  return <AuthProvider><Home /></AuthProvider>;
}
