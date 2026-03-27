import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AppThemeSync from "@/components/AppThemeSync";
import PwaAndPushManager from "@/components/PwaAndPushManager";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import OnboardingPage from "./pages/auth/OnboardingPage";
import OnboardingFlowPage from "./pages/auth/OnboardingFlowPage";
import StudentLayout from "./layouts/StudentLayout";
import StudentHome from "./pages/student/StudentHome";
import StudentWorkouts from "./pages/student/StudentWorkouts";
import WorkoutDetail from "./pages/student/WorkoutDetail";
import WorkoutExecution from "./pages/student/WorkoutExecution";
import StudentSchedule from "./pages/student/StudentSchedule";
import StudentSearch from "./pages/student/StudentSearch";
import StudentProfile from "./pages/student/StudentProfile";
import StudentMyProfile from "./pages/student/StudentMyProfile";
import StudentProgress from "./pages/student/StudentProgress";
import StudentPayments from "./pages/student/StudentPayments";
import StudentCredential from "./pages/student/StudentCredential";
import StudentSettings from "./pages/student/StudentSettings";
import StudentGoals from "./pages/student/StudentGoals";
import StudentBadges from "./pages/student/StudentBadges";
import StudentPlan from "./pages/student/StudentPlan";
import StudentDiet from "./pages/student/StudentDiet";
import PlansPage from "./pages/student/PlansPage";
import StorePage from "./pages/student/StorePage";
import StoreCategoryPage from "./pages/student/StoreCategoryPage";
import StoreProductPage from "./pages/student/StoreProductPage";
import StoreCartPage from "./pages/student/StoreCartPage";
import StoreCheckoutPage from "./pages/student/StoreCheckoutPage";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPrograms from "./pages/admin/AdminPrograms";
import AdminProgramDetail from "./pages/admin/AdminProgramDetail";
import AdminExercises from "./pages/admin/AdminExercises";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminAccessControl from "./pages/admin/AdminAccessControl";
import AdminReports from "./pages/admin/AdminReports";
import AdminIntegrations from "./pages/admin/AdminIntegrations";
import AdminNutrition from "./pages/admin/AdminNutrition";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminPersonalTrainers from "./pages/admin/AdminPersonalTrainers";
import AdminStoreDashboard from "./pages/admin/AdminStoreDashboard";
import AdminStoreCategories from "./pages/admin/AdminStoreCategories";
import AdminStoreProducts from "./pages/admin/AdminStoreProducts";
import AdminStoreProductForm from "./pages/admin/AdminStoreProductForm";
import AdminStoreOrders from "./pages/admin/AdminStoreOrders";
import AdminStoreOrderDetail from "./pages/admin/AdminStoreOrderDetail";
import ProgressTodayPage from "./pages/student/ProgressTodayPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppThemeSync />
          <PwaAndPushManager />
          <Routes>
            <Route path="/" element={<OnboardingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingFlowPage /></ProtectedRoute>} />

            {/* Student App — protected */}
            <Route path="/app" element={<ProtectedRoute><StudentLayout><StudentHome /></StudentLayout></ProtectedRoute>} />
            <Route path="/app/workouts" element={<ProtectedRoute><StudentLayout><StudentWorkouts /></StudentLayout></ProtectedRoute>} />
            <Route path="/app/workouts/:id" element={<ProtectedRoute><StudentLayout><WorkoutDetail /></StudentLayout></ProtectedRoute>} />
            <Route path="/app/workouts/:id/execute" element={<ProtectedRoute><WorkoutExecution /></ProtectedRoute>} />
            <Route path="/app/schedule" element={<ProtectedRoute><StudentLayout><StudentSchedule /></StudentLayout></ProtectedRoute>} />
            <Route path="/app/search" element={<ProtectedRoute><StudentLayout><StudentSearch /></StudentLayout></ProtectedRoute>} />
            <Route path="/app/profile" element={<ProtectedRoute><StudentLayout><StudentProfile /></StudentLayout></ProtectedRoute>} />
            <Route path="/app/profile/me" element={<ProtectedRoute><StudentLayout><StudentMyProfile /></StudentLayout></ProtectedRoute>} />
            <Route path="/app/profile/progress" element={<ProtectedRoute><StudentLayout><StudentProgress /></StudentLayout></ProtectedRoute>} />
            <Route path="/app/profile/payments" element={<ProtectedRoute><StudentLayout><StudentPayments /></StudentLayout></ProtectedRoute>} />
            <Route path="/app/profile/credential" element={<ProtectedRoute><StudentLayout><StudentCredential /></StudentLayout></ProtectedRoute>} />
            <Route path="/app/profile/settings" element={<ProtectedRoute><StudentLayout><StudentSettings /></StudentLayout></ProtectedRoute>} />
            <Route path="/app/profile/badges" element={<ProtectedRoute><StudentLayout><StudentBadges /></StudentLayout></ProtectedRoute>} />
            <Route path="/app/profile/plan" element={<ProtectedRoute><StudentLayout><StudentPlan /></StudentLayout></ProtectedRoute>} />
            <Route path="/app/plans" element={<ProtectedRoute><StudentLayout><PlansPage /></StudentLayout></ProtectedRoute>} />
            <Route path="/app/diet" element={<ProtectedRoute><StudentLayout><StudentDiet /></StudentLayout></ProtectedRoute>} />
            <Route path="/app/progress/today" element={<ProtectedRoute><ProgressTodayPage /></ProtectedRoute>} />
            <Route path="/app/goals" element={<ProtectedRoute><StudentLayout><StudentGoals /></StudentLayout></ProtectedRoute>} />
            <Route path="/app/goals/new" element={<ProtectedRoute><StudentLayout><StudentGoals /></StudentLayout></ProtectedRoute>} />

            {/* Store — protected */}
            <Route path="/app/store" element={<ProtectedRoute><StudentLayout><StorePage /></StudentLayout></ProtectedRoute>} />
            <Route path="/app/store/category/:slug" element={<ProtectedRoute><StudentLayout><StoreCategoryPage /></StudentLayout></ProtectedRoute>} />
            <Route path="/app/store/product/:slug" element={<ProtectedRoute><StudentLayout><StoreProductPage /></StudentLayout></ProtectedRoute>} />
            <Route path="/app/cart" element={<ProtectedRoute><StudentLayout><StoreCartPage /></StudentLayout></ProtectedRoute>} />
            <Route path="/app/checkout" element={<ProtectedRoute><StudentLayout><StoreCheckoutPage /></StudentLayout></ProtectedRoute>} />

            {/* Admin ERP — protected + staff */}
            <Route path="/admin" element={<ProtectedRoute requireStaff><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="programs" element={<AdminPrograms />} />
              <Route path="programs/:id" element={<AdminProgramDetail />} />
              <Route path="exercises" element={<AdminExercises />} />
              <Route path="plans" element={<AdminPlans />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="trainers" element={<AdminPersonalTrainers />} />
              <Route path="access" element={<AdminAccessControl />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="integrations" element={<AdminIntegrations />} />
              <Route path="nutrition" element={<AdminNutrition />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="store" element={<AdminStoreDashboard />}>
                <Route path="categories" element={<AdminStoreCategories />} />
                <Route path="products" element={<AdminStoreProducts />} />
                <Route path="products/new" element={<AdminStoreProductForm />} />
                <Route path="products/:id/edit" element={<AdminStoreProductForm />} />
                <Route path="orders" element={<AdminStoreOrders />} />
                <Route path="orders/:id" element={<AdminStoreOrderDetail />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
