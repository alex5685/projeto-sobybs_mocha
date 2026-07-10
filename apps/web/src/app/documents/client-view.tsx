"use client";

import Documents from "@/views/Documents";

import { AuthProvider } from "@/lib/auth-shim";

export default function ClientView() {
  return <AuthProvider><Documents /></AuthProvider>;
}
