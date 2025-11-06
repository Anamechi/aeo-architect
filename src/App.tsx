import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import PublicLayout from "@/components/layout/PublicLayout";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import AITools from "./pages/AITools";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import Login from "./pages/admin/Login";
import Signup from "./pages/admin/Signup";
import Dashboard from "./pages/admin/Dashboard";
import AdminAITools from "./pages/admin/AITools";
import BlogGenerator from "./pages/admin/BlogGenerator";
import BlogPosts from "./pages/admin/BlogPosts";
import BlogAudit from "./pages/admin/BlogAudit";
import Packages from "./pages/admin/Packages";
import Quotes from "./pages/admin/Quotes";
import PricingSettings from "./pages/admin/PricingSettings";
import BusinessSettings from "./pages/admin/BusinessSettings";
import Authors from "./pages/admin/Authors";
import QAGenerator from "./pages/admin/QAGenerator";
import Citations from "./pages/admin/Citations";
import SEOSettings from "./pages/admin/SEOSettings";
import Images from "./pages/admin/Images";
import Diagrams from "./pages/admin/Diagrams";
import ContentUpdates from "./pages/admin/ContentUpdates";
import MasterPrompts from "./pages/admin/MasterPrompts";
import CitationHealth from "./pages/admin/CitationHealth";
import FAQManager from "./pages/admin/FAQManager";
import ReferralTracking from "./pages/admin/ReferralTracking";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Admin routes */}
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin/signup" element={<Signup />} />
              <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="master-prompts" element={<MasterPrompts />} />
                <Route path="ai-tools" element={<AdminAITools />} />
                <Route path="blog" element={<BlogPosts />} />
                <Route path="blog/new" element={<BlogGenerator />} />
                <Route path="blog/edit/:id" element={<BlogGenerator />} />
                <Route path="blog/audit" element={<BlogAudit />} />
                <Route path="qa-generator" element={<QAGenerator />} />
                <Route path="faq-manager" element={<FAQManager />} />
                <Route path="authors" element={<Authors />} />
                <Route path="citations" element={<Citations />} />
                <Route path="citation-health" element={<CitationHealth />} />
                <Route path="packages" element={<Packages />} />
                <Route path="quotes" element={<Quotes />} />
                <Route path="images" element={<Images />} />
                <Route path="diagrams" element={<Diagrams />} />
                <Route path="content-updates" element={<ContentUpdates />} />
                <Route path="seo-settings" element={<SEOSettings />} />
                <Route path="pricing-settings" element={<PricingSettings />} />
                <Route path="business-settings" element={<BusinessSettings />} />
                <Route path="referral-tracking" element={<ReferralTracking />} />
              </Route>

              {/* Public routes */}
              <Route element={<PublicLayout />}>
                <Route index element={<Home />} />
                <Route path="about" element={<About />} />
                <Route path="services" element={<Services />} />
                <Route path="blog" element={<Blog />} />
                <Route path="blog/:slug" element={<BlogArticle />} />
                <Route path="faq" element={<FAQ />} />
                <Route path="contact" element={<Contact />} />
                <Route path="ai-tools" element={<AITools />} />
                <Route path="privacy" element={<Privacy />} />
                <Route path="terms" element={<Terms />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
