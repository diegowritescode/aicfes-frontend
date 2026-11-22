import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { TestProvider } from "@/context/TestContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import GenerateMixed from "./pages/Generate";
import GenerateSpecial from "./pages/GenerateSpecial";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import TimeTrial from "./pages/TimeTrial";
import Test from "./pages/Test";
import Results from "./pages/Results";
import Feedback from "./pages/Feedback";
import SimulacroInicio from "./pages/SimulacroInicio";
import Simulacro from "./pages/Simulacro";
import SimulacroResultados from "./pages/SimulacroResultados";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <TestProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/generacion-libre"
                element={<Navigate to="/generacion-especializada" replace />}
              />
              <Route
                path="/generacion-especializada"
                element={
                  <ProtectedRoute>
                    <GenerateSpecial />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/generacion-mixta"
                element={
                  <ProtectedRoute>
                    <GenerateMixed />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contrarreloj"
                element={
                  <ProtectedRoute>
                    <TimeTrial />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Register />} />
              {/* English spelling kept as an alias: it is what
                  people type, and a 404 here loses a signup. */}
              <Route path="/register" element={<Navigate to="/registro" replace />} />
              <Route
                path="/test"
                element={
                  <ProtectedRoute>
                    <Test />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/results"
                element={
                  <ProtectedRoute>
                    <Results />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/feedback/:sessionId"
                element={
                  <ProtectedRoute>
                    <Feedback />
                  </ProtectedRoute>
                }
              />
              {/* The sitting: choosing one, running it, and its report.
                  Landing and Login have promised simulacros for months
                  with nothing behind the word. */}
              <Route
                path="/simulacro"
                element={
                  <ProtectedRoute>
                    <SimulacroInicio />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/simulacro/:id"
                element={
                  <ProtectedRoute>
                    <Simulacro />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/simulacro/:id/resultados"
                element={
                  <ProtectedRoute>
                    <SimulacroResultados />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TestProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
