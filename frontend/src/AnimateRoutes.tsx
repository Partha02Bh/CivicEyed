import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Index from "./pages/Index";
import CitizenHome from "./pages/CitizenHome";
import CitizenProfile from "./pages/CitizenProfile";
import ReportIssue from "./pages/ReportIssue";
import LiveMap from "./pages/LiveMap";
import AdminHome from "./pages/AdminHome";
import AdminProfile from "./pages/AdminProfile";
import CreateAnnouncement from "./pages/CreateAnnouncement";
import ManageAnnouncements from "./pages/ManageAnnouncements";
import Announcements from "./pages/Announcements";
import NotFound from "./pages/NotFound";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

const pageTransition = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -40 },
  transition: { duration: 0.32, ease: "easeInOut" as const },
};

function MotionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      exit={pageTransition.exit}
      transition={pageTransition.transition}
      style={{ height: "100%" }} // optional, helps with layout
    >
      {children}
    </motion.div>
  );
}

export default function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <MotionWrapper>
              <Index />
            </MotionWrapper>
          }
        />
        <Route
          path="/signin"
          element={
            <MotionWrapper>
              <SignIn />
            </MotionWrapper>
          }
        />
        <Route
          path="/signup"
          element={
            <MotionWrapper>
              <SignUp />
            </MotionWrapper>
          }
        />
        <Route
          path="/citizen"
          element={
            <ProtectedRoute requiredRole="citizen">
              <MotionWrapper>
                <CitizenHome />
              </MotionWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/create-issue"
          element={
            <ProtectedRoute requiredRole="citizen">
              <MotionWrapper>
                <ReportIssue />
              </MotionWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/profile"
          element={
            <ProtectedRoute requiredRole="citizen">
              <MotionWrapper>
                <ErrorBoundary>
                  <CitizenProfile />
                </ErrorBoundary>
              </MotionWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/live-map"
          element={
            <ProtectedRoute requiredRole="citizen">
              <MotionWrapper>
                <LiveMap />
              </MotionWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <MotionWrapper>
                <AdminHome />
              </MotionWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute requiredRole="admin">
              <MotionWrapper>
                <ErrorBoundary>
                  <AdminProfile />
                </ErrorBoundary>
              </MotionWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/create-announcement"
          element={
            <ProtectedRoute requiredRole="admin">
              <MotionWrapper>
                <CreateAnnouncement />
              </MotionWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manage-announcements"
          element={
            <ProtectedRoute requiredRole="admin">
              <MotionWrapper>
                <ManageAnnouncements />
              </MotionWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/announcements"
          element={
            <MotionWrapper>
              <Announcements />
            </MotionWrapper>
          }
        />
        <Route
          path="/citizen/announcements"
          element={
            <ProtectedRoute requiredRole="citizen">
              <MotionWrapper>
                <Announcements />
              </MotionWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <MotionWrapper>
              <NotFound />
            </MotionWrapper>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}
