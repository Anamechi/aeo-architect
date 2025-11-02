import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
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
                <Route path="tools" element={<AdminAITools />} />
                <Route path="blog-generator" element={<BlogGenerator />} />
              </Route>

              {/* Public routes */}
              <Route path="/" element={
                <div className="flex min-h-screen flex-col w-full">
                  <Header />
                  <main className="flex-1">
                    <Routes>
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
                    </Routes>
                  </main>
                  <Footer />
                </div>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
