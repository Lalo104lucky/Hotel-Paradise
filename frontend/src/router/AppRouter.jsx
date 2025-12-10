import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthContext from '../config/context/auth-context';
import AdminMobileLayout from '../module/admin/AdminMobileLayout';
import UserMobileLayout from '../module/user/UserMobileLayout';
import SignIn from '../module/auth/SignIn';

import Inicio from '../module/admin/Inicio';
import Habitaciones from '../module/admin/Habitaciones';
import Asignar from '../module/admin/Asignar';
import Incidencias from '../module/admin/Incidencias';
import Notificaciones from '../module/admin/Notificaciones';
import Camareras from '../module/admin/Camareras';

import Tareas from '../module/user/Tareas';
import Escanear from '../module/user/Escanear';
import TodasHabitaciones from '../module/user/TodasHabitaciones';
import ReportarIncidencia from '../module/user/ReportarIncidencia';
import Alertas from '../module/user/Alertas';

// Componente para rutas públicas
const PublicRoute = ({ children }) => {
    const { user: state } = useContext(AuthContext);
    const rawUser = localStorage.getItem('user');
    const localUser = rawUser ? JSON.parse(rawUser) : null;
    const token = localUser?.token || localStorage.getItem('token');
    const role = localUser?.user?.rol || state?.user?.rol || null;

    if (token && role) {
        return role === 'ADMIN_ROLE' ? (
            <Navigate to="/admin/mobile" replace />
        ) : role === 'USER_ROLE' ? (
            <Navigate to="/user/mobile" replace />
        ) : (
            <Navigate to="/sign-in" replace />
        );
    }

    return children;
};

// Componente para rutas protegidas
const ProtectedRoute = ({ children, allowedRole }) => {
    const { user: state } = useContext(AuthContext);
    const rawUser = localStorage.getItem('user');
    const localUser = rawUser ? JSON.parse(rawUser) : null;
    const token = localUser?.token || localStorage.getItem('token');
    const role = localUser?.user?.rol || state?.user?.rol || null;

    if (!token) {
        return <Navigate to="/sign-in" replace />;
    }

    if (!role || role !== allowedRole) {
        return <Navigate to="/sign-in" replace />;
    }

    return children;
};

const AppRouter = () => {
    const { user: state } = useContext(AuthContext);
    const [isLoading, setIsLoading] = useState(true);
    const [role, setRole] = useState(null);

    useEffect(() => {
        const rawUser = localStorage.getItem('user');
        const localUser = rawUser ? JSON.parse(rawUser) : null;
        const userRole = localUser?.user?.rol || state?.user?.rol || null;
        setRole(userRole);
        setIsLoading(false);
    }, [state]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-50">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <Routes>
                {/* Ruta de inicio de sesión */}
                <Route
                    path="/sign-in"
                    element={
                        <PublicRoute>
                            <SignIn />
                        </PublicRoute>
                    }
                />

                

                {/* Rutas Admin Mobile */}
                <Route
                    path="/admin/mobile"
                    element={
                        <ProtectedRoute allowedRole="ADMIN_ROLE">
                            <AdminMobileLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Inicio />} />
                    <Route path="habitaciones" element={<Habitaciones />} />
                    <Route path="asignar" element={<Asignar />} />
                    <Route path="incidencias" element={<Incidencias />} />
                    <Route path="notificaciones" element={<Notificaciones />} />
                    <Route path="camareras" element={<Camareras />} />
                </Route>

                {/* Rutas User Mobile */}
                <Route
                    path="/user/mobile"
                    element={
                        <ProtectedRoute allowedRole="USER_ROLE">
                            <UserMobileLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Tareas />} />
                    <Route path="escanear" element={<Escanear />} />
                    <Route path="habitaciones" element={<TodasHabitaciones />} />
                    <Route path="alertas" element={<Alertas />} />
                </Route>

                {/* Ruta standalone para Reportar (User) */}
                <Route
                    path="/user/mobile/reportar"
                    element={
                        <ProtectedRoute allowedRole="USER_ROLE">
                            <ReportarIncidencia />
                        </ProtectedRoute>
                    }
                />

                {/* Ruta raíz - redirige según el rol */}
                <Route
                    path="/"
                    element={
                        role === 'ADMIN_ROLE' ? (
                            <Navigate to="/admin/mobile" replace />
                        ) : role === 'USER_ROLE' ? (
                            <Navigate to="/user/mobile" replace />
                        ) : (
                            <Navigate to="/sign-in" replace />
                        )
                    }
                />

                {/* Cualquier otra ruta redirige a sign-in */}
                <Route path="*" element={<Navigate to="/sign-in" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;