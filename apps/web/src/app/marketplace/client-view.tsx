"use client";

import Marketplace from "@/views/Marketplace";

import { AuthProvider } from "@/lib/auth-shim";

export default function ClientView() {
  return <AuthProvider><Marketplace /></AuthProvider>;
}
