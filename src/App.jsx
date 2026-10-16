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
                              <Route path="devotees" element={<DevoteeList />} />
                              <Route path="devotees/new" element={<DevoteeForm />} />
                              <Route path="devotees/bulk-upload" element={<BulkDevoteeUpload />} />
                              <Route path="devotees/batch-id" element={<BatchIDCardGenerator />} />
                              <Route path="devotees/:id" element={<DevoteeProfile />} />
                              <Route path="devotees/:id/edit" element={<DevoteeForm />} />
                              <Route path="change-request/:id" element={<RequireAuth><ChangeRequestForm /></RequireAuth>} />
                              <Route path="my-requests" element={<RequireAuth><MyRequests /></RequireAuth>} />
                              <Route path="admin/change-requests" element={<RequireAuth><AdminChangeRequests /></RequireAuth>} />

                              {/* Events & Seva */}
                              <Route path="seva" element={<SevaBoard />} />
                              <Route path="finance" element={<DonationList />} />
                              <Route path="finance/new" element={<DonationForm />} />

                              <Route path="events" element={<Events />} />
                              <Route path="counseling" element={<CounselorDashboard />} />
                              <Route path="network" element={<NetworkGraph />} />
                              <Route path="map" element={<DevoteeMap />} />

                              {/* Communication & User */}
                              <Route path="communication" element={<Communication />} />
                              <Route path="settings" element={<Settings />} />
                              <Route path="users" element={<UserManagement />} />

                              <Route path="notifications" element={<Notifications />} />
                              <Route path="reports" element={<Reports />} />
                              <Route path="profile" element={<Profile />} />
                              <Route path="maintenance" element={<AutoRepairHub />} />
                              <Route path="attendance" element={<Attendance />} />

                              {/* Courses */}
                              <Route path="courses" element={<CourseList />} />
                              <Route path="courses/new" element={<CourseForm />} />
                              <Route path="courses/:id" element={<CourseDetails />} />
                              <Route path="courses/:id/edit" element={<CourseForm />} />

                              {/* Tours */}
                              <Route path="tours" element={<TourList />} />
                              <Route path="tours/new" element={<TourForm />} />
                              <Route path="tours/:id" element={<TourDetails />} />
                              <Route path="tours/:id/edit" element={<TourForm />} />
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
