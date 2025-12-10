import React, { useState, useEffect, useRef } from 'react';
import { Check, Bell, RefreshCw, AlertTriangle, ClipboardList, XCircle, Home, Trash2 } from 'lucide-react';
import { NotificationService } from '../../config/http-gateway';
import { formatRelativeTime, setupForegroundNotificationListener } from '../../services/firebase-notification-service';
import { alertaError, alertaPregunta } from '../../config/context/alerts';

const Notificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [swipingId, setSwipingId] = useState(null);
  const [swipeX, setSwipeX] = useState(0);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);

  const fetchNotificaciones = async () => {
    try {
      const { data, error } = await NotificationService.getMyNotifications();

      if (error) {
        console.error('Error obteniendo notificaciones:', error);
        alertaError('Error', 'No se pudieron cargar las notificaciones');
        return;
      }

      setNotificaciones(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error inesperado:', error);
      alertaError('Error', 'Ocurrió un error al cargar las notificaciones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotificaciones();

    // Configurar listener para notificaciones en primer plano
    setupForegroundNotificationListener(async (payload) => {
      console.log('[Notificaciones] Nueva notificación recibida:', payload);

      // Incrementar el contador
      setUnreadCount(prev => prev + 1);

      // Crear la nueva notificación desde el payload
      const nuevaNotificacion = {
        id: payload.data?.notificationId || Date.now(),
        title: payload.notification?.title || 'Nueva notificación',
        body: payload.notification?.body || '',
        type: payload.data?.type || 'GENERAL',
        isRead: false,
        createdAt: new Date().toISOString()
      };

      // Agregar la nueva notificación al principio de la lista SIN hacer fetch
      // Esto preserva el estado isRead de las notificaciones existentes
      setNotificaciones(prev => [nuevaNotificacion, ...prev]);
    });
  }, []);

  const handleMarcarLeida = async (id) => {
    try {
      const { error } = await NotificationService.markAsRead(id);

      if (error) {
        console.error('Error marcando notificación como leída:', error);
        return;
      }

      // Actualizar localmente
      setNotificaciones(notificaciones.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error inesperado:', error);
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      const { error } = await NotificationService.markAllAsRead();

      if (error) {
        console.error('Error marcando todas como leídas:', error);
        alertaError('Error', 'No se pudieron marcar todas las notificaciones como leídas');
        return;
      }

      // Actualizar localmente
      setNotificaciones(notificaciones.map(notif => ({ ...notif, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error inesperado:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotificaciones();
  };

  const handleEliminarNotificacion = async (id) => {
    const confirmacion = await alertaPregunta(
      '¿Eliminar notificación?',
      'Esta acción no se puede deshacer'
    );

    if (!confirmacion) return;

    try {
      const { error } = await NotificationService.deleteNotification(id);

      if (error) {
        console.error('Error eliminando notificación:', error);
        alertaError('Error', 'No se pudo eliminar la notificación');
        return;
      }

      // Actualizar localmente
      const notificacionEliminada = notificaciones.find(n => n.id === id);
      setNotificaciones(notificaciones.filter(notif => notif.id !== id));

      // Actualizar contador si era no leída
      if (notificacionEliminada && !notificacionEliminada.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      alertaError('Error', 'Ocurrió un error al eliminar la notificación');
    }
  };

  // Manejadores de swipe
  const handleTouchStart = (e, id) => {
    touchStartX.current = e.touches[0].clientX;
    setSwipingId(id);
  };

  const handleTouchMove = (e, id) => {
    if (swipingId !== id) return;

    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchStartX.current - touchCurrentX.current;

    // Solo permitir deslizar hacia la izquierda (diff > 0)
    if (diff > 0 && diff <= 100) {
      setSwipeX(diff);
    } else if (diff > 100) {
      setSwipeX(100);
    } else {
      setSwipeX(0);
    }
  };

  const handleTouchEnd = (id) => {
    if (swipeX > 50) {
      // Si deslizó más de 50px, eliminar
      handleEliminarNotificacion(id);
    }
    // Resetear
    setSwipeX(0);
    setSwipingId(null);
    touchStartX.current = 0;
    touchCurrentX.current = 0;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'INCIDENT':
        return AlertTriangle;
      case 'ASSIGNMENT':
        return ClipboardList;
      case 'UNASSIGNMENT':
        return XCircle;
      case 'ROOM_UPDATE':
        return Home;
      default:
        return Bell;
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Centro de Notificaciones</h2>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount} sin leer de {notificaciones.length} totales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
            title="Actualizar"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarcarTodasLeidas}
              className="text-xs text-blue-600 font-medium hover:text-blue-700 transition-colors"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>
      </div>

      {/* Lista de Notificaciones */}
      <div className="space-y-3">
        {notificaciones.map((notificacion) => {
          const IconComponent = getNotificationIcon(notificacion.type);
          const isCurrentlySwiping = swipingId === notificacion.id;

          return (
          <div
            key={notificacion.id}
            className="relative overflow-hidden"
          >
            {/* Fondo de eliminar */}
            <div className="absolute inset-0 bg-red-500 flex items-center justify-end px-6 rounded-2xl">
              <Trash2 className="w-6 h-6 text-white" />
            </div>

            {/* Contenido de la notificación */}
            <div
              onTouchStart={(e) => handleTouchStart(e, notificacion.id)}
              onTouchMove={(e) => handleTouchMove(e, notificacion.id)}
              onTouchEnd={() => handleTouchEnd(notificacion.id)}
              style={{
                transform: isCurrentlySwiping ? `translateX(-${swipeX}px)` : 'translateX(0)',
                transition: isCurrentlySwiping ? 'none' : 'transform 0.3s ease-out'
              }}
              className={`rounded-2xl p-4 shadow-sm border ${
                notificacion.isRead
                  ? 'bg-white border-gray-100'
                  : 'bg-orange-50 border-orange-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  notificacion.isRead ? 'bg-gray-100' : 'bg-orange-100'
                }`}>
                  <IconComponent className={`w-5 h-5 ${
                    notificacion.isRead ? 'text-gray-600' : 'text-orange-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm mb-1 ${notificacion.isRead ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                        {notificacion.title}
                      </p>
                      <p className="text-xs text-gray-600">{notificacion.body}</p>
                    </div>
                    {!notificacion.isRead && (
                      <span className="px-2 py-0.5 bg-orange-600 text-white text-xs font-medium rounded-full flex-shrink-0">
                        Nuevo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {formatRelativeTime(notificacion.createdAt)}
                  </p>
                  {!notificacion.isRead && (
                    <button
                      onClick={() => handleMarcarLeida(notificacion.id)}
                      className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors mt-2"
                    >
                      <Check className="w-4 h-4" />
                      Marcar como leída
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {notificaciones.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <Bell className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-base font-bold text-gray-900 mb-1">No hay notificaciones</p>
          <p className="text-sm text-gray-500">Cuando haya nuevas notificaciones aparecerán aquí</p>
        </div>
      )}
    </div>
  );
};

export default Notificaciones;
