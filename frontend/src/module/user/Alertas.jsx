import React, { useState, useEffect, useRef } from 'react';
import { Check, Bell, RefreshCw, AlertTriangle, ClipboardList, XCircle, Home, Trash2 } from 'lucide-react';
import { NotificationService } from '../../config/http-gateway';
import { formatRelativeTime, setupForegroundNotificationListener } from '../../services/firebase-notification-service';
import { alertaError, alertaPregunta } from '../../config/context/alerts';

const Alertas = () => {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [swipeStates, setSwipeStates] = useState({});

  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const isDragging = useRef(false);

  const fetchAlertas = async () => {
    try {
      const { data, error } = await NotificationService.getMyNotifications();

      if (error) {
        console.error('Error obteniendo alertas:', error);
        alertaError('Error', 'No se pudieron cargar las alertas');
        return;
      }

      setAlertas(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error inesperado:', error);
      alertaError('Error', 'Ocurrió un error al cargar las alertas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlertas();

    // Configurar listener para notificaciones en primer plano
    setupForegroundNotificationListener(async (payload) => {
      console.log('[Alertas] Nueva notificación recibida:', payload);

      // Incrementar el contador
      setUnreadCount(prev => prev + 1);

      // Crear la nueva alerta desde el payload
      const nuevaAlerta = {
        id: payload.data?.notificationId || Date.now(),
        title: payload.notification?.title || 'Nueva alerta',
        body: payload.notification?.body || '',
        type: payload.data?.type || 'GENERAL',
        isRead: false,
        createdAt: new Date().toISOString()
      };

      // Agregar la nueva alerta al principio de la lista SIN hacer fetch
      // Esto preserva el estado isRead de las alertas existentes
      setAlertas(prev => [nuevaAlerta, ...prev]);
    });
  }, []);

  const handleMarcarLeida = async (id) => {
    try {
      const { error } = await NotificationService.markAsRead(id);

      if (error) {
        console.error('Error marcando alerta como leída:', error);
        return;
      }

      // Actualizar localmente
      setAlertas(alertas.map(alerta =>
        alerta.id === id ? { ...alerta, isRead: true } : alerta
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
        alertaError('Error', 'No se pudieron marcar todas las alertas como leídas');
        return;
      }

      // Actualizar localmente
      setAlertas(alertas.map(alerta => ({ ...alerta, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error inesperado:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAlertas();
  };

  const handleEliminarAlerta = async (id) => {
    const confirmacion = await alertaPregunta(
      '¿Eliminar alerta?',
      'Esta acción no se puede deshacer'
    );

    if (!confirmacion) return;

    try {
      const { error } = await NotificationService.deleteNotification(id);

      if (error) {
        console.error('Error eliminando alerta:', error);
        alertaError('Error', 'No se pudo eliminar la alerta');
        return;
      }

      // Actualizar localmente
      const alertaEliminada = alertas.find(a => a.id === id);
      setAlertas(alertas.filter(alerta => alerta.id !== id));

      // Actualizar contador si era no leída
      if (alertaEliminada && !alertaEliminada.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      alertaError('Error', 'Ocurrió un error al eliminar la alerta');
    }
  };

  const handleTouchStart = (e, id) => {
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = false;
  };

  const handleMouseDown = (e, id) => {
    touchStartX.current = e.clientX;
    isDragging.current = false;
  };

  const handleTouchMove = (e, id) => {
    if (!touchStartX.current) return;

    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchCurrentX.current - touchStartX.current;

    // Permitir deslizar a ambos lados
    isDragging.current = true;
    setSwipeStates(prev => ({
      ...prev,
      [id]: diff
    }));
  };

  const handleMouseMove = (e, id) => {
    if (!touchStartX.current || e.buttons !== 1) return;

    touchCurrentX.current = e.clientX;
    const diff = touchCurrentX.current - touchStartX.current;

    // Permitir deslizar a ambos lados
    isDragging.current = true;
    setSwipeStates(prev => ({
      ...prev,
      [id]: diff
    }));
  };

  const handleTouchEnd = async (e, id, isRead) => {
    const diff = swipeStates[id] || 0;

    // Umbral de 50px para activar la acción
    const threshold = 50;

    if (diff > threshold && !isRead) {
      // Swipe derecha -> Marcar como leída
      await handleMarcarLeida(id);
    } else if (diff < -threshold) {
      // Swipe izquierda -> Eliminar
      await handleEliminarAlerta(id);
    }

    // Resetear
    setSwipeStates(prev => ({
      ...prev,
      [id]: 0
    }));
    touchStartX.current = 0;
    touchCurrentX.current = 0;
    isDragging.current = false;
  };

  const handleMouseUp = async (e, id, isRead) => {
    if (!isDragging.current) return;
    await handleTouchEnd(e, id, isRead);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ASSIGNMENT':
        return ClipboardList;
      case 'UNASSIGNMENT':
        return XCircle;
      case 'ROOM_UPDATE':
        return Home;
      case 'INCIDENT':
        return AlertTriangle;
      default:
        return Bell;
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Cargando alertas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Alertas</h2>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount} sin leer de {alertas.length} totales
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
              Marcar todas
            </button>
          )}
        </div>
      </div>

      {/* Lista de Alertas */}
      <div className="space-y-2">
        {alertas.map((alerta) => {
          const IconComponent = getNotificationIcon(alerta.type);
          const swipeOffset = swipeStates[alerta.id] || 0;
          const isSwipingRight = swipeOffset > 0;
          const swipeProgress = Math.min(Math.abs(swipeOffset) / 80, 1);

          return (
          <div
            key={alerta.id}
            className="relative overflow-hidden rounded-2xl"
          >
            {/* Fondo para deslizar a la derecha (marcar como leída) */}
            {!alerta.isRead && swipeOffset > 0 && (
              <>
                <div
                  className="absolute inset-0 bg-blue-500 rounded-2xl transition-opacity"
                  style={{ opacity: swipeProgress * 0.6 }}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10" style={{ opacity: swipeProgress }}>
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <Check className="w-6 h-6 text-white stroke-[2.5]" />
                  </div>
                </div>
                <div className="absolute left-20 top-1/2 -translate-y-1/2 z-10">
                  <span
                    className="text-white text-sm font-semibold whitespace-nowrap"
                    style={{
                      opacity: Math.max(0, swipeProgress - 0.3),
                      transform: `translateX(${Math.max(0, swipeOffset - 30)}px)`
                    }}
                  >
                    Marcar como leída
                  </span>
                </div>
              </>
            )}

            {/* Fondo para deslizar a la izquierda (eliminar) */}
            {swipeOffset < 0 && (
              <>
                <div
                  className="absolute inset-0 bg-red-500 rounded-2xl transition-opacity"
                  style={{ opacity: Math.min(Math.abs(swipeOffset) / 80, 1) * 0.9 }}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10" style={{ opacity: Math.min(Math.abs(swipeOffset) / 80, 1) }}>
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                    <Trash2 className="w-6 h-6 text-white stroke-[2.5]" />
                  </div>
                </div>
                <div className="absolute right-20 top-1/2 -translate-y-1/2 z-10">
                  <span
                    className="text-white text-sm font-semibold whitespace-nowrap"
                    style={{
                      opacity: Math.max(0, (Math.abs(swipeOffset) / 80) - 0.3),
                      transform: `translateX(${Math.min(0, swipeOffset + 30)}px)`
                    }}
                  >
                    Eliminar
                  </span>
                </div>
              </>
            )}

            {/* Contenido de la notificación */}
            <div
              onTouchStart={(e) => handleTouchStart(e, alerta.id)}
              onTouchMove={(e) => handleTouchMove(e, alerta.id)}
              onTouchEnd={(e) => handleTouchEnd(e, alerta.id, alerta.isRead)}
              onMouseDown={(e) => handleMouseDown(e, alerta.id)}
              onMouseMove={(e) => handleMouseMove(e, alerta.id)}
              onMouseUp={(e) => handleMouseUp(e, alerta.id, alerta.isRead)}
              onMouseLeave={(e) => handleMouseUp(e, alerta.id, alerta.isRead)}
              style={{
                transform: `translateX(${swipeOffset}px)`,
                transition: isDragging.current ? 'none' : 'transform 0.3s ease-out',
                cursor: isDragging.current ? 'grabbing' : 'grab'
              }}
              className={`rounded-2xl p-4 shadow-sm border relative ${
                alerta.isRead
                  ? 'bg-white border-gray-100'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  alerta.isRead ? 'bg-gray-100' : 'bg-blue-100'
                }`}>
                  <IconComponent className={`w-5 h-5 ${
                    alerta.isRead ? 'text-gray-600' : 'text-blue-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm mb-1 ${alerta.isRead ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                        {alerta.title}
                      </h4>
                      <p className="text-xs text-gray-600">{alerta.body}</p>
                    </div>
                    {!alerta.isRead && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full flex-shrink-0">
                        Nueva
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {formatRelativeTime(alerta.createdAt)}
                  </p>
                  {!alerta.isRead && (
                    <button
                      onClick={() => handleMarcarLeida(alerta.id)}
                      className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:text-blue-700 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
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

      {alertas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <Bell className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">No hay alertas</p>
          <p className="text-xs text-gray-500">Cuando haya nuevas alertas aparecerán aquí</p>
        </div>
      )}
    </div>
  );
};

export default Alertas;
