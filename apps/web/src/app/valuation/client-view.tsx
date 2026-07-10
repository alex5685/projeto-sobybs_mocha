"use client";

import AIValuation from "@/views/AIValuation";

import { AuthProvider } from "@/lib/auth-shim";

export default function ClientView() {
  return <AuthProvider><AIValuation /></AuthProvider>;
}
