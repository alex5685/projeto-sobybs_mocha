"use client";

import ProfileSetup from "@/views/ProfileSetup";

import { AuthProvider } from "@/lib/auth-shim";

export default function ClientView() {
  return <AuthProvider><ProfileSetup /></AuthProvider>;
}
