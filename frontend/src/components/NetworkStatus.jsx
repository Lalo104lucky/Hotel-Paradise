import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import networkStatus from '../services/network-status';
import syncService from '../services/sync-service';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(networkStatus.getIsOnline());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [pendingSync, setPendingSync] = useState({ cleanings: 0, incidents: 0 });
  const [showBanner, setShowBanner] = useState(false);
  const [showOnlineIndicator, setShowOnlineIndicator] = useState(true);

  useEffect(() => {
    // Suscribirse a cambios de conexión
    const unsubscribeNetwork = networkStatus.onStatusChange((online) => {
      setIsOnline(online);
      setShowBanner(true);
      
      // Mostrar el indicador cuando cambie el estado
      setShowOnlineIndicator(true);

      // Ocultar banner después de 5 segundos
      setTimeout(() => setShowBanner(false), 5000);
    });

    // Suscribirse a eventos de sincronización
    const unsubscribeSync = syncService.onSyncEvent((event) => {
      if (event.type === 'start') {
        setIsSyncing(true);
        setSyncMessage('Sincronizando...');
        setShowOnlineIndicator(true);
      } else if (event.type === 'complete') {
        setIsSyncing(false);
        setSyncMessage('Sincronizado');
        setTimeout(() => setSyncMessage(''), 3000);
        updatePendingStatus();
      } else if (event.type === 'error') {
        setIsSyncing(false);
        setSyncMessage('Error al sincronizar');
        setTimeout(() => setSyncMessage(''), 3000);
      }
    });

    // Verificar estado pendiente inicial
    updatePendingStatus();

    // Verificar cada 30 segundos
    const interval = setInterval(updatePendingStatus, 30000);

    return () => {
      unsubscribeNetwork();
      unsubscribeSync();
      clearInterval(interval);
    };
  }, []);

  const updatePendingStatus = async () => {
    const status = await syncService.getPendingSyncStatus();
    setPendingSync({ cleanings: status.cleanings, incidents: status.incidents });
    
    // Si no hay datos pendientes y está online, ocultar el indicador después de 5 segundos
    if (isOnline && !status.cleanings && !status.incidents && !isSyncing) {
      setTimeout(() => setShowOnlineIndicator(false), 3000);
    } else {
      setShowOnlineIndicator(true);
    }
  };

  const handleSync = async () => {
    if (!isOnline || isSyncing) return;
    await syncService.syncAll();
  };

  const hasPendingData = pendingSync.cleanings > 0 || pendingSync.incidents > 0;

  return (
    <>
      {/* Banner de cambio de estado */}
      {showBanner && (
        <div
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
            showBanner ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <div
            className={`px-4 py-3 text-sm font-medium text-white ${
              isOnline ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span>Conexión restaurada</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span>Sin Conexión a Internet</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Indicador permanente */}
      <div className="fixed bottom-20 right-4 z-40">
        {/* Botón de sincronización (solo visible si hay datos pendientes y está online) */}
        {hasPendingData && isOnline && !isSyncing && (
          <button
            onClick={handleSync}
            className="mb-2 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>
              Sincronizar ({pendingSync.cleanings + pendingSync.incidents})
            </span>
          </button>
        )}

        {/* Indicador de estado - se oculta cuando está online y sincronizado */}
        {(showOnlineIndicator || !isOnline || hasPendingData || isSyncing) && (
          <div
            className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium ${
              isOnline
                ? isSyncing
                  ? 'bg-blue-600 text-white'
                  : hasPendingData
                  ? 'bg-orange-100 text-orange-800 border border-orange-200'
                  : 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-gray-800 text-white'
            }`}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{syncMessage}</span>
              </>
            ) : isOnline ? (
              <>
                {hasPendingData ? (
                  <>
                    <Cloud className="w-4 h-4" />
                    <span>Online - {pendingSync.cleanings + pendingSync.incidents} pendientes</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4" />
                    <span>Online</span>
                  </>
                )}
              </>
            ) : (
              <>
                <CloudOff className="w-4 h-4" />
                <span>
                  Offline
                  {hasPendingData && ` - ${pendingSync.cleanings + pendingSync.incidents} pendientes`}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default NetworkStatus;
