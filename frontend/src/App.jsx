import React, { useReducer, useEffect } from 'react';
import { authManager } from './config/context/auth-manager';
import AuthContext from './config/context/auth-context';
import AppRouter from './router/AppRouter';
import { syncService, networkStatus } from './services';


const init = () => {
  const storedUser = JSON.parse(localStorage.getItem('user'));
  if (storedUser && storedUser.user && storedUser.user.rol) {
    return {
      ...storedUser,
      signed: true,
    };
  }
  return { signed: false, token: null, user: { rol: null } };
};

function App() {
  const [user, dispatch] = useReducer(authManager, {}, init);

  useEffect(() => {
    if (user && user.user && user.user.rol !== null) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // Inicializar sincronización al cargar la app
  useEffect(() => {
    // Solo sincronizar si el usuario está autenticado
    if (user && user.signed) {
      const initSync = async () => {
        const isOnline = networkStatus.getIsOnline();

        if (isOnline) {
          console.log('[App] Usuario autenticado y online - Iniciando sincronización inicial...');
          try {
            await syncService.syncAll();
            console.log('[App] Sincronización inicial completada');
          } catch (error) {
            console.error('[App] Error en sincronización inicial:', error);
          }
        } else {
          console.log('[App] Usuario autenticado pero offline - Sincronización pendiente');
        }
      };

      // Ejecutar después de 2 segundos para no bloquear el inicio
      const timeoutId = setTimeout(initSync, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [user?.signed]);

  return (
    <>
      <AuthContext.Provider value={{ dispatch, user }}>
        <AppRouter />
      </AuthContext.Provider>
    </>
  )
}

export default App
