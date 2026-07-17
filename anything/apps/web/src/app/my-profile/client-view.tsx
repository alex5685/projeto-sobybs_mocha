"use client";

import MyProfile from "@/views/MyProfile";

import { AuthProvider } from "@/lib/auth-shim";

export default function ClientView() {
  return <AuthProvider><MyProfile /></AuthProvider>;
}
