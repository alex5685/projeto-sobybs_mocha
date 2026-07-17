"use client";

import UserRegistration from "@/views/UserRegistration";

import { AuthProvider } from "@/lib/auth-shim";

export default function ClientView() {
  return <AuthProvider><UserRegistration /></AuthProvider>;
}
