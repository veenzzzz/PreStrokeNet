import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import type { UserRole } from "../types";

import { Loader } from "../components/Loader";
import { useAuth } from "../hooks/useAuth";
import { AuthLayout } from "../components/AuthLayout";
import { AppShell } from "../components/AppShell";
import { Dashboard } from "../pages/Dashboard/Dashboard";
import { ForgotPassword } from "../pages/ForgotPassword/ForgotPassword";
import { Login } from "../pages/Login/Login";
import { Prediction } from "../pages/Prediction/Prediction";
import { PredictionDetails } from "../pages/PredictionDetails/PredictionDetails";
import { Profile } from "../pages/Profile/Profile";
import { Register } from "../pages/Register/Register";
import { Reports } from "../pages/Reports/Reports";
import { ResetPassword } from "../pages/ResetPassword/ResetPassword";
import { Settings } from "../pages/Settings/Settings";
import { Unauthorized } from "../pages/Unauthorized/Unauthorized";
import { PatientProfile } from "../pages/PatientProfile/PatientProfile";
import { ModelAnalytics } from "../pages/ModelAnalytics/ModelAnalytics";
import { ClinicalAssistant } from "../pages/ClinicalAssistant/ClinicalAssistant";
import { Notifications } from "../pages/Notifications";
import { PatientComparison } from "../pages/PatientComparison";
import { WorkQueue } from "../pages/WorkQueue";
import { AuditLog } from "../pages/AuditLog";
import { Patient360 } from "../pages/Patient360/Patient360";
import { DemoMode } from "../pages/DemoMode/DemoMode";

function ProtectedRoutes() {
  const { isAuthenticated, isInitializing, user } = useAuth();

  if (isInitializing) {
    return <div className="flex min-h-screen items-center justify-center bg-app"><Loader label="Loading your workspace" /></div>;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || !(["Admin", "Doctor"] as UserRole[]).includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>
      <Route element={<ProtectedRoutes />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/work-queue" element={<WorkQueue />} />
          <Route path="/audit-log" element={<AuditLog />} />
          <Route path="/prediction" element={<Prediction />} />
          <Route path="/predictions/:id" element={<PredictionDetails />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/patients/:patient_id" element={<PatientProfile />} />
          <Route path="/patients/:patient_id/360" element={<Patient360 />} />
          <Route path="/demo" element={<DemoMode />} />
          <Route path="/patient-comparison" element={<PatientComparison />} />
          <Route path="/model-analytics" element={<ModelAnalytics />} />
          <Route path="/clinical-assistant" element={<ClinicalAssistant />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
