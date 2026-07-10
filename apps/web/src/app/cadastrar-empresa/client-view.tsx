"use client";

import BusinessRegistration from "@/views/BusinessRegistration";

import { AuthProvider } from "@/lib/auth-shim";

export default function ClientView() {
  return <AuthProvider><BusinessRegistration /></AuthProvider>;
}
