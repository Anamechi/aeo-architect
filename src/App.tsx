import { lazy, Suspense } from "react";
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
const Login = lazy(() => import("./pages/admin/Login"));
const Signup = lazy(() => import("./pages/admin/Signup"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminAITools = lazy(() => import("./pages/admin/AITools"));
const BlogGenerator = lazy(() => import("./pages/admin/BlogGenerator"));
const BlogPosts = lazy(() => import("./pages/admin/BlogPosts"));
const BlogAudit = lazy(() => import("./pages/admin/BlogAudit"));
const Packages = lazy(() => import("./pages/admin/Packages"));
const Quotes = lazy(() => import("./pages/admin/Quotes"));
const PricingSettings = lazy(() => import("./pages/admin/PricingSettings"));
const BusinessSettings = lazy(() => import("./pages/admin/BusinessSettings"));
const Authors = lazy(() => import("./pages/admin/Authors"));
const QAGenerator = lazy(() => import("./pages/admin/QAGenerator"));
const Citations = lazy(() => import("./pages/admin/Citations"));
const SEOSettings = lazy(() => import("./pages/admin/SEOSettings"));
const Images = lazy(() => import("./pages/admin/Images"));
const Diagrams = lazy(() => import("./pages/admin/Diagrams"));
const ContentUpdates = lazy(() => import("./pages/admin/ContentUpdates"));
const MasterPrompts = lazy(() => import("./pages/admin/MasterPrompts"));
const CitationHealth = lazy(() => import("./pages/admin/CitationHealth"));
const ImageAltTextGenerator = lazy(() => import("./pages/admin/ImageAltTextGenerator"));
const FAQManager = lazy(() => import("./pages/admin/FAQManager"));
const FAQAnalytics = lazy(() => import("./pages/admin/FAQAnalytics"));
const ReferralTracking = lazy(() => import("./pages/admin/ReferralTracking"));
const PointsChecker = lazy(() => import("./pages/admin/PointsChecker"));
const SiteSettings = lazy(() => import("./pages/admin/SiteSettings"));
const Clusters = lazy(() => import("./pages/admin/Clusters"));
import { MetaPixelTracker } from "@/components/MetaPixelTracker";
const ClusterDetail = lazy(() => import("./pages/admin/ClusterDetail"));
const ImageHealth = lazy(() => import("./pages/admin/ImageHealth"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <MetaPixelTracker />
            <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>}>
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
                <Route path="faq-analytics" element={<FAQAnalytics />} />
                <Route path="authors" element={<Authors />} />
                <Route path="citations" element={<Citations />} />
                <Route path="citation-health" element={<CitationHealth />} />
                <Route path="image-alt-text" element={<ImageAltTextGenerator />} />
                <Route path="packages" element={<Packages />} />
                <Route path="quotes" element={<Quotes />} />
                <Route path="images" element={<Images />} />
                <Route path="diagrams" element={<Diagrams />} />
                <Route path="content-updates" element={<ContentUpdates />} />
                <Route path="seo-settings" element={<SEOSettings />} />
                <Route path="pricing-settings" element={<PricingSettings />} />
                <Route path="business-settings" element={<BusinessSettings />} />
                <Route path="referral-tracking" element={<ReferralTracking />} />
                <Route path="points-checker" element={<PointsChecker />} />
                <Route path="site-settings" element={<SiteSettings />} />
                <Route path="clusters" element={<Clusters />} />
                <Route path="clusters/:id" element={<ClusterDetail />} />
                <Route path="image-health" element={<ImageHealth />} />
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
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
