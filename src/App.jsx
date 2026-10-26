import React, { Suspense, lazy, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DevoteeProvider } from './context/DevoteeContext';
import { SadhanaProvider } from './context/SadhanaContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ReferenceDataProvider from './context/ReferenceDataContext';
import { NotificationProvider } from './context/NotificationContext';
import { NotificationEngine } from './context/NotificationEngine';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import { LanguageProvider } from './context/LanguageContext';
import ErrorBoundary from './components/ErrorBoundary';
import CommandPalette from './components/CommandPalette';
import dropboxAutoSyncManager from './services/dropboxAutoSync';

const Layout = lazy(() => import('./components/layout/Layout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DevoteeList = lazy(() => import('./pages/devotees/DevoteeList'));
const DevoteeProfile = lazy(() => import('./pages/devotees/DevoteeProfile'));
const DevoteeForm = lazy(() => import('./pages/devotees/DevoteeForm'));
const BatchIDCardGenerator = lazy(() => import('./pages/devotees/BatchIDCardGenerator'));
const BulkDevoteeUpload = lazy(() => import('./pages/devotees/BulkDevoteeUpload'));

// Services / Events
const SevaBoard = lazy(() => import('./pages/services/SevaBoard'));
const DonationList = lazy(() => import('./pages/finance/DonationList'));
const DonationForm = lazy(() => import('./pages/finance/DonationForm'));

// Counseling
const CounselorDashboard = lazy(() => import('./pages/counseling/CounselorDashboard'));
const NetworkGraph = lazy(() => import('./pages/NetworkGraph'));
const DevoteeMap = lazy(() => import('./pages/DevoteeMap'));

// Other
const Communication = lazy(() => import('./pages/Communication'));
const Settings = lazy(() => import('./pages/Settings'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const Events = lazy(() => import('./pages/Events'));
const VaishnavaCalendar = lazy(() => import('./pages/VaishnavaCalendar'));
const SelfUpdate = lazy(() => import('./pages/SelfUpdate'));
const PublicRegister = lazy(() => import('./pages/public/PublicRegister'));

const Notifications = lazy(() => import('./pages/Notifications'));
const Profile = lazy(() => import('./pages/Profile'));
const Reports = lazy(() => import('./pages/Reports'));
const AutoRepairHub = lazy(() => import('./pages/maintenance/AutoRepairHub'));
const Attendance = lazy(() => import('./pages/Attendance'));

// Courses
const CourseList = lazy(() => import('./pages/courses/CourseList'));
const CourseForm = lazy(() => import('./pages/courses/CourseForm'));
const CourseDetails = lazy(() => import('./pages/courses/CourseDetails'));

// Tours
const TourList = lazy(() => import('./pages/tours/TourList'));
const TourForm = lazy(() => import('./pages/tours/TourForm'));
const TourDetails = lazy(() => import('./pages/tours/TourDetails'));
const ChangeRequestForm = lazy(() => import('./pages/ChangeRequestForm'));
const AdminChangeRequests = lazy(() => import('./pages/AdminChangeRequests'));
const MyRequests = lazy(() => import('./pages/MyRequests'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
  </div>
);

// Authenticated route guard: redirects to /login when there is no valid session.
const RequireAuth = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// Admin-only route guard: redirects non-admin users to home
const RequireAdmin = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

// Counselor or Admin route guard
const RequireCounselorOrAdmin = ({ children }) => {
  const { isAuthenticated, isAdmin, isCounselor, currentUser, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin && !isCounselor) {
    const target = currentUser?.devoteeId ? `/devotees/${currentUser.devoteeId}` : '/profile';
    return <Navigate to={target} replace />;
  }
  return children;
};

function App() {
  useEffect(() => {
    dropboxAutoSyncManager.start();
    return () => dropboxAutoSyncManager.stop();
  }, []);

  return (
    <ToastProvider>
      <ThemeProvider>
        <LanguageProvider>
          <DevoteeProvider>
            <SadhanaProvider>
              <AuthProvider>
                <ReferenceDataProvider>
                  <NotificationProvider>
                    <NotificationEngine />
                    <HashRouter>
                      <CommandPalette />
                      <ErrorBoundary>
                        <Suspense fallback={<PageLoader />}>
                          <Routes>
                            <Route path="/self-update" element={<RequireAuth><SelfUpdate /></RequireAuth>} />
                            <Route path="/login" element={<LoginPage />} />

                            {/* Public, shareable self-registration — no auth required */}
                            <Route path="/register" element={<PublicRegister />} />

                            <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
                              <Route index element={<Dashboard />} />

                              {/* Devotee Management */}
                              <Route path="devotees" element={<RequireCounselorOrAdmin><DevoteeList /></RequireCounselorOrAdmin>} />
                              <Route path="devotees/new" element={<RequireAdmin><DevoteeForm /></RequireAdmin>} />
                              <Route path="devotees/bulk-upload" element={<RequireAdmin><BulkDevoteeUpload /></RequireAdmin>} />
                              <Route path="devotees/batch-id" element={<RequireAdmin><BatchIDCardGenerator /></RequireAdmin>} />
                              <Route path="devotees/:id" element={<DevoteeProfile />} />
                              <Route path="devotees/:id/edit" element={<RequireAdmin><DevoteeForm /></RequireAdmin>} />
                              <Route path="change-request/:id" element={<RequireCounselorOrAdmin><ChangeRequestForm /></RequireCounselorOrAdmin>} />
                              <Route path="my-requests" element={<RequireCounselorOrAdmin><MyRequests /></RequireCounselorOrAdmin>} />
                              <Route path="admin/change-requests" element={<RequireAdmin><AdminChangeRequests /></RequireAdmin>} />

                              {/* Events & Seva */}
                              <Route path="seva" element={<RequireCounselorOrAdmin><SevaBoard /></RequireCounselorOrAdmin>} />
                              <Route path="finance" element={<RequireAdmin><DonationList /></RequireAdmin>} />
                              <Route path="finance/new" element={<RequireAdmin><DonationForm /></RequireAdmin>} />

                              <Route path="events" element={<RequireCounselorOrAdmin><Events /></RequireCounselorOrAdmin>} />
                              <Route path="calendar" element={<RequireCounselorOrAdmin><VaishnavaCalendar /></RequireCounselorOrAdmin>} />
                              <Route path="counseling" element={<RequireCounselorOrAdmin><CounselorDashboard /></RequireCounselorOrAdmin>} />
                              <Route path="network" element={<RequireCounselorOrAdmin><NetworkGraph /></RequireCounselorOrAdmin>} />
                              <Route path="map" element={<RequireCounselorOrAdmin><DevoteeMap /></RequireCounselorOrAdmin>} />

                              {/* Communication & User */}
                              <Route path="communication" element={<RequireAdmin><Communication /></RequireAdmin>} />
                              <Route path="settings" element={<RequireAdmin><Settings /></RequireAdmin>} />
                              <Route path="users" element={<RequireAdmin><UserManagement /></RequireAdmin>} />

                              <Route path="notifications" element={<Notifications />} />
                              <Route path="reports" element={<RequireAdmin><Reports /></RequireAdmin>} />
                              <Route path="profile" element={<Profile />} />
                              <Route path="maintenance" element={<RequireAdmin><AutoRepairHub /></RequireAdmin>} />
                              <Route path="attendance" element={<RequireCounselorOrAdmin><Attendance /></RequireCounselorOrAdmin>} />

                              {/* Courses */}
                              <Route path="courses" element={<RequireCounselorOrAdmin><CourseList /></RequireCounselorOrAdmin>} />
                              <Route path="courses/new" element={<RequireAdmin><CourseForm /></RequireAdmin>} />
                              <Route path="courses/:id" element={<RequireCounselorOrAdmin><CourseDetails /></RequireCounselorOrAdmin>} />
                              <Route path="courses/:id/edit" element={<RequireAdmin><CourseForm /></RequireAdmin>} />

                              {/* Tours */}
                              <Route path="tours" element={<RequireCounselorOrAdmin><TourList /></RequireCounselorOrAdmin>} />
                              <Route path="tours/new" element={<RequireAdmin><TourForm /></RequireAdmin>} />
                              <Route path="tours/:id" element={<RequireCounselorOrAdmin><TourDetails /></RequireCounselorOrAdmin>} />
                              <Route path="tours/:id/edit" element={<RequireAdmin><TourForm /></RequireAdmin>} />
                            </Route>

                            <Route path="*" element={<Navigate to="/" replace />} />
                          </Routes>
                        </Suspense>
                      </ErrorBoundary>
                    </HashRouter>
                  </NotificationProvider>
                </ReferenceDataProvider>
              </AuthProvider>
            </SadhanaProvider>
          </DevoteeProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ToastProvider>
  );
}

export default App;
