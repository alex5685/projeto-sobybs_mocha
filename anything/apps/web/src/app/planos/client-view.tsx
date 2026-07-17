"use client";

import SubscriptionPlans from "@/views/SubscriptionPlans";

import { AuthProvider } from "@/lib/auth-shim";

export default function ClientView() {
  return <AuthProvider><SubscriptionPlans /></AuthProvider>;
}
