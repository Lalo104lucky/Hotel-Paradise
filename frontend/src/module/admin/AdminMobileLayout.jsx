import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Building2,
  ClipboardList,
  AlertCircle,
  Bell,
  LogOut,
  Users
} from 'lucide-react';
import Logo from '../../../src/assets/imgs/logo.svg';
import NetworkStatus from '../../components/NetworkStatus';

const AdminMobileLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Obtener nombre del usuario desde localStorage
  const getUserName = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const fullName = user?.user?.name || user?.name || '';
        
        // Dividir el nombre completo en palabras
        const nameParts = fullName.trim().split(/\s+/);
        
        // Tomar solo primer nombre y primer apellido
        if (nameParts.length >= 2) {
          return `${nameParts[0]} ${nameParts[1]}`;
        }
        return nameParts[0] || 'Usuario';
      }
    } catch (error) {
      console.error('Error al obtener el nombre del usuario:', error);
    }
    return 'Usuario';
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/sign-in');
  };

  const navItems = [
    { id: 'inicio', label: 'Inicio', icon: Home, path: '/admin/mobile' },
    { id: 'habitaciones', label: 'Habitaciones', icon: Building2, path: '/admin/mobile/habitaciones' },
    { id: 'asignar', label: 'Asignar', icon: ClipboardList, path: '/admin/mobile/asignar' },
    { id: 'camareras', label: 'Personal', icon: Users, path: '/admin/mobile/camareras' },
    { id: 'incidencias', label: 'Incidencias', icon: AlertCircle, path: '/admin/mobile/incidencias' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r px-4 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl shadow-md p-1.5 flex-shrink-0">
            <img src="/imgs/logo.svg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-black">Hotel Paradise</h1>
            <p className="text-xs text-gray-800">{getUserName()} • Admin</p>
          </div>
        </div>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="p-2.5 hover:bg-gray-200 rounded-xl transition-colors"
        >
          <LogOut className="w-5 h-5 text-black" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center min-w-[60px] py-1 px-2 rounded-lg transition-all ${
                  active 
                    ? 'text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className={`w-6 h-6 mb-1 ${active ? 'stroke-2' : 'stroke-[1.5]'}`} />
                <span className={`text-[10px] font-medium ${active ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4 mx-auto">
              <LogOut className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              ¿Salir de la aplicación?
            </h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              Se cerrará tu sesión actual
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors" style={{ backgroundColor: '#2563eb' }}
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Network Status Indicator */}
      <NetworkStatus />
    </div>
  );
};

export default AdminMobileLayout;
