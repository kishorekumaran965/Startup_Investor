import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import StartupsPage from './pages/StartupsPage';
import MyIdeasPage from './pages/MyIdeasPage';
import ExplorePage from './pages/ExplorePage';
import MyInvestmentsPage from './pages/MyInvestmentsPage';
import MentorsPage from './pages/MentorsPage';
import ResearchPage from './pages/ResearchPage';
import MessagesPage from './pages/MessagesPage';
import FundingApplicationsPage from './pages/FundingApplicationsPage';
import NotificationsPage from './pages/NotificationsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import UsersPage from './pages/UsersPage';
import AdminPanelPage from './pages/AdminPanelPage';
import DocumentVaultPage from './pages/DocumentVaultPage';
import ForumPage from './pages/ForumPage';

// Spinner for initial auth check
function SplashLoader() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080c14' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
                <div className="spinner" />
                <p style={{ color: 'var(--text-muted)', marginTop: 16, fontSize: 14 }}>Loading VentureHub...</p>
            </div>
        </div>
    );
}

// Protected layout with sidebar
function AppLayout() {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <SplashLoader />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                <TopBar />
                <main className="main-content" style={{ flex: 1, overflowY: 'auto' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

// Admin-only route
function AdminRoute() {
    const { user } = useAuth();
    if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
    return <Outlet />;
}

// Role-specific route
function RoleRoute({ roles }) {
    const { user } = useAuth();
    if (!roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
    return <Outlet />;
}

// Public route - redirect to dashboard if already logged in
function PublicRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <SplashLoader />;
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return children;
}

function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

            {/* Protected Routes */}
            <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* Startups - founders & admin */}
                <Route element={<RoleRoute roles={['STARTUP', 'ADMIN']} />}>
                    <Route path="/startups" element={<StartupsPage />} />
                </Route>

                {/* My Ideas - founders only */}
                <Route element={<RoleRoute roles={['STARTUP']} />}>
                    <Route path="/my-ideas" element={<MyIdeasPage />} />
                </Route>

                {/* Explore - investors, researchers, mentors */}
                <Route element={<RoleRoute roles={['INVESTOR', 'RESEARCHER', 'MENTOR']} />}>
                    <Route path="/explore" element={<ExplorePage />} />
                </Route>

                {/* My Investments - investors only */}
                <Route element={<RoleRoute roles={['INVESTOR']} />}>
                    <Route path="/my-investments" element={<MyInvestmentsPage />} />
                </Route>

                {/* Mentors - anyone who can see them */}
                <Route path="/mentors" element={<MentorsPage />} />

                {/* Research - researchers only */}
                <Route element={<RoleRoute roles={['RESEARCHER']} />}>
                    <Route path="/research" element={<ResearchPage />} />
                </Route>

                {/* Common routes for all authenticated users */}
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/funding-applications" element={<FundingApplicationsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/document-vault" element={<DocumentVaultPage />} />
                <Route path="/forum" element={<ForumPage />} />

                {/* Admin-only */}
                <Route element={<AdminRoute />}>
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/admin-panel" element={<AdminPanelPage />} />
                </Route>
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Router>
                    <AppRoutes />
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}
