import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import MealPlanner from "./pages/MealPlanner";
import Pantry from "./pages/Pantry";
import Recipes from "./pages/Recipes";
import NotFound from "./pages/NotFound";
import RecipeDetail from "./pages/RecipeDetail"; // ✅ Added import
import ShoppingCartPage from "./pages/ShoppingCart";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/planner" element={<MealPlanner />} />
          <Route path="/pantry" element={<Pantry />} />
          <Route path="/recipes" element={<Recipes />} />

          {/* ✅ New route for individual recipe details */}
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/shopping-cart" element={<ShoppingCartPage />} />
          {/* ⚠️ Keep this last — catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
