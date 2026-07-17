"use client";

import CompleteValuation from "@/views/CompleteValuation";

import { AuthProvider } from "@/lib/auth-shim";

export default function ClientView() {
  return <AuthProvider><CompleteValuation /></AuthProvider>;
}
