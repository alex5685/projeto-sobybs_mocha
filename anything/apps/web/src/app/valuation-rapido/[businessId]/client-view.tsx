"use client";

import QuickValuation from "@/views/QuickValuation";

import { AuthProvider } from "@/lib/auth-shim";

export default function ClientView() {
  return <AuthProvider><QuickValuation /></AuthProvider>;
}
