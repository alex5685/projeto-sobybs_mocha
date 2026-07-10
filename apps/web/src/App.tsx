"use client";

import { BrowserRouter as Router, Routes, Route } from "@/lib/router-shim";
import { AuthProvider } from "@/lib/auth-shim";
import Home from "@/views/Home";
import AuthCallback from "@/views/AuthCallback";
import Dashboard from "@/views/Dashboard";
import ProfileSetup from "@/views/ProfileSetup";
import SubscriptionPlans from "@/views/SubscriptionPlans";
import UserRegistration from "@/views/UserRegistration";
import BusinessRegistration from "@/views/BusinessRegistration";
import About from "@/views/About";
import FAQPage from "@/views/FAQ";
import AdminPanel from "@/views/AdminPanel";
import AIValuation from "@/views/AIValuation";
import MyProfile from "@/views/MyProfile";
import Marketplace from "@/views/Marketplace";
import BusinessDetail from "@/views/BusinessDetail";
import Documents from "@/views/Documents";
import ManageBusinessImages from "@/views/ManageBusinessImages";
import QuickValuation from "@/views/QuickValuation";
import CompleteValuation from "@/views/CompleteValuation";
import "./index.css";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/user-registration" element={<UserRegistration />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/business-registration" element={<BusinessRegistration />} />
          <Route path="/cadastrar-empresa" element={<BusinessRegistration />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/subscription-plans" element={<SubscriptionPlans />} />
          <Route path="/planos" element={<SubscriptionPlans />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/valuation" element={<AIValuation />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/business/:id" element={<BusinessDetail />} />
          <Route path="/business/:id/images" element={<ManageBusinessImages />} />
          <Route path="/valuation-rapido/:businessId" element={<QuickValuation />} />
          <Route path="/empresa/:businessId/valuation-completo" element={<CompleteValuation />} />
          <Route path="/documents" element={<Documents />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
