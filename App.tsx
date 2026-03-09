import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@getmocha/users-service/react";
import Home from "./pages/Home";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import ProfileSetup from "./pages/ProfileSetup";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import UserRegistration from "./pages/UserRegistration";
import BusinessRegistration from "./pages/BusinessRegistration";
import About from "./pages/About";
import FAQPage from "./pages/FAQ";
import AdminPanel from "./pages/AdminPanel";
import AIValuation from "./pages/AIValuation";
import MyProfile from "./pages/MyProfile";
import Marketplace from "./pages/Marketplace";
import BusinessDetail from "./pages/BusinessDetail";
import Documents from "./pages/Documents";
import ManageBusinessImages from "./pages/ManageBusinessImages";
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/subscription-plans" element={<SubscriptionPlans />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/valuation" element={<AIValuation />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/business/:id" element={<BusinessDetail />} />
          <Route path="/business/:id/images" element={<ManageBusinessImages />} />
          <Route path="/documents" element={<Documents />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
