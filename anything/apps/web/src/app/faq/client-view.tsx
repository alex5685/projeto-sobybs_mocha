"use client";

import FAQPage from "@/views/FAQ";

import { AuthProvider } from "@/lib/auth-shim";

export default function ClientView() {
  return <AuthProvider><FAQPage /></AuthProvider>;
}
