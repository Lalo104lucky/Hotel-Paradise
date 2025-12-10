import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Scan as ScanIcon, Camera, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { RoomService } from '../../config/http-gateway/room-service';
import { OfflineCleaningService } from '../../services';
import pouchDBService from '../../services/pouchdb-service';
import { alertaExito, alertaError, alertaCargando } from '../../config/context/alerts';
import Swal from 'sweetalert2';

const Escanear = () => {
  const navigate = useNavigate();
  const [codigoHabitacion, setCodigoHabitacion] = useState('');
  const [habitacionEncontrada, setHabitacionEncontrada] = useState(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  const estadoConfig = {
    'LIMPIA': {
      label: 'Limpia',
      color: 'bg-green-100 text-green-700 border-green-200'
    },
    'EN_USO': {
      label: 'En Uso',
      color: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    'EN_LIMPIEZA': {
      label: 'En Limpieza',
      color: 'bg-purple-100 text-purple-700 border-purple-200'
    },
    'BLOQUEADA_INCIDENCIA': {
      label: 'Bloqueada',
      color: 'bg-red-100 text-red-700 border-red-200'
    },
    'PENDIENTE_LIMPIEZA': {
      label: 'Pendiente Limpieza',
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    }
  };

  const startScanning = () => {
    setScanning(true);
    setHabitacionEncontrada(null);

    setTimeout(() => {
      if (scannerRef.current) {
        html5QrcodeScannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            formatsToSupport: ['QR_CODE'],
          },
          false
        );

        html5QrcodeScannerRef.current.render(onScanSuccess, onScanError);
      }
    }, 100);
  };

  const stopScanning = () => {
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear().catch(error => {
        console.error("Error clearing scanner:", error);
      });
      html5QrcodeScannerRef.current = null;
    }
    setScanning(false);
  };

  const onScanSuccess = async (decodedText) => {
    console.log("QR escaneado:", decodedText);
    stopScanning();
    await buscarHabitacion(decodedText);
  };

  const onScanError = (error) => {
    console.debug("Error de escaneo:", error);
  };

  const buscarHabitacion = async (codigo) => {
    try {
      alertaCargando('Buscando', 'Buscando habitación...');
      const isOnline = navigator.onLine;
      let data;

      if (isOnline) {
        const response = await RoomService.getAllRooms();
        if (response.error) {
          throw new Error('No se pudo buscar la habitación en el servidor.');
        }
        data = response.data;
      } else {
        data = await pouchDBService.getRooms();
        if (!data || data.length === 0) {
          alertaError('Modo Offline', 'No hay habitaciones en la caché. Conéctate para sincronizar.');
          Swal.close();
          return;
        }
      }

      // Obtener limpiezas pendientes y tareas completadas offline (igual que Tareas.jsx)
      const pendingCleanings = await pouchDBService.getPendingCleanings();
      const completedTasksOffline = await pouchDBService.getCompletedTasksOffline();
      
      const pendingRoomIds = new Set(pendingCleanings.map(c => c.roomId));
      const completedRoomIds = new Set(completedTasksOffline.map(t => t.roomId));

      Swal.close();

      const habitacion = data.find(room =>
        room.barcodeValue === codigo || room.roomNumber === codigo
      );

      if (habitacion) {
        // Actualizar el estado de la habitación basado en datos offline
        const isCompletedOffline = completedRoomIds.has(habitacion.id) || pendingRoomIds.has(habitacion.id);
        const habitacionActualizada = {
          ...habitacion,
          currentStatus: isCompletedOffline ? 'LIMPIA' : habitacion.currentStatus,
          pendingSync: pendingRoomIds.has(habitacion.id)
        };
        
        setHabitacionEncontrada(habitacionActualizada);
        setCodigoHabitacion(codigo);
        alertaExito('Encontrada', `Habitación ${habitacion.roomNumber} encontrada`);
      } else {
        alertaError('No encontrada', 'No se encontró ninguna habitación con ese código');
        setHabitacionEncontrada(null);
      }
    } catch (error) {
      Swal.close();
      console.error('Error al buscar habitación:', error);
      alertaError('Error', 'Ocurrió un error al buscar la habitación');
    }
  };

  const handleBuscar = () => {
    if (!codigoHabitacion.trim()) {
      alertaError('Error', 'Ingresa un código o número de habitación');
      return;
    }
    buscarHabitacion(codigoHabitacion.trim());
  };

  const handleMarcarLimpia = async () => {
    try {
      alertaCargando('Marcando como limpia...', 'Por favor espera');

      const roomId = habitacionEncontrada.id;

      // PASO 1: Actualizar UI inmediatamente (optimistic update)
      const updatedRoom = { ...habitacionEncontrada, currentStatus: 'LIMPIA' };
      setHabitacionEncontrada(updatedRoom);

      // PASO 2: Registrar limpieza usando el mismo servicio que Tareas.jsx
      const { error, isQueued, offlineMode } = await OfflineCleaningService.registerCleaning({
        roomId,
        notes: 'Limpieza completada desde escaneo'
      });

      Swal.close();

      if (!error || isQueued) {
        alertaExito(
          (offlineMode || isQueued) ? 'Limpieza en Cola' : 'Limpieza Registrada',
          (offlineMode || isQueued)
            ? 'La limpieza se ha guardado y se enviará al servidor cuando haya conexión.'
            : 'La habitación ha sido marcada como limpia.'
        );
      } else {
        // Si hubo error, revertir el cambio visual
        setHabitacionEncontrada(habitacionEncontrada);
        alertaError('Error', 'Ocurrió un error al marcar como limpia');
      }

    } catch (error) {
      Swal.close();
      console.error('Error al marcar como limpia:', error);
      // Revertir el cambio visual en caso de error
      setHabitacionEncontrada(habitacionEncontrada);
      alertaError('Error', 'Ocurrió un error al guardar el cambio de estado');
    }
  };

  const handleReportar = () => {
    navigate('/user/mobile/reportar', { 
      state: { 
        roomId: habitacionEncontrada.id, 
        roomNumber: habitacionEncontrada.roomNumber 
      } 
    });
  };

  useEffect(() => {
    return () => {
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Escanear Código QR</h2>
        <p className="text-sm text-gray-500 mt-1">
          Escanea el código QR de la habitación o ingresa el código manualmente
        </p>
      </div>

      {/* Scanner Section */}
      {!scanning && !habitacionEncontrada && (
        <div className="flex justify-center py-8">
          <button
            onClick={startScanning}
            className="relative group"
          >
            <div className="w-48 h-48 border-4 border-blue-600 rounded-2xl flex items-center justify-center bg-blue-50 group-hover:bg-blue-100 transition-colors">
              <Camera className="w-24 h-24 text-blue-600" />
            </div>
            <div className="absolute inset-x-0 bottom-4">
              <span className="block text-center text-sm font-medium text-blue-600">
                Toca para Escanear
              </span>
            </div>
          </button>
        </div>
      )}

      {/* QR Scanner */}
      {scanning && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Escaneando...</h3>
            <button
              onClick={stopScanning}
              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div ref={scannerRef} id="qr-reader" className="w-full"></div>
        </div>
      )}

      {/* Manual Input */}
      {!scanning && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Código o Número de Habitación
          </h3>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Ej: HTL-P1-101 o 101"
              value={codigoHabitacion}
              onChange={(e) => setCodigoHabitacion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-semibold text-gray-900"
            />

            <button
              onClick={handleBuscar}
              className="w-full py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              Buscar Habitación
            </button>
          </div>
        </div>
      )}

      {/* Habitación Encontrada */}
      {habitacionEncontrada && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">{habitacionEncontrada.roomNumber}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Habitación {habitacionEncontrada.roomNumber}
                </h3>
                <p className="text-sm text-gray-600">
                  Piso {habitacionEncontrada.floor}
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${estadoConfig[habitacionEncontrada.currentStatus]?.color}`}>
              {estadoConfig[habitacionEncontrada.currentStatus]?.label}
            </span>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Código:</span>
              <span className="text-sm font-medium text-gray-900">{habitacionEncontrada.barcodeValue}</span>
            </div>
            {habitacionEncontrada.notes && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Notas:</span>
                <span className="text-sm font-medium text-gray-900">{habitacionEncontrada.notes}</span>
              </div>
            )}
            {habitacionEncontrada.lastStatusChange && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Última actualización:</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(habitacionEncontrada.lastStatusChange).toLocaleDateString('es-MX')}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleMarcarLimpia}
              disabled={habitacionEncontrada.currentStatus === 'LIMPIA'}
              className="flex-1 py-3 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5" />
              {habitacionEncontrada.currentStatus === 'LIMPIA' ? 'Ya está limpia' : 'Marcar como Limpia'}
            </button>
            <button
              onClick={handleReportar}
              className="px-4 py-3 bg-red-100 text-red-700 text-sm font-medium rounded-xl hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-5 h-5" />
              Reportar
            </button>
          </div>

          <button
            onClick={() => {
              setHabitacionEncontrada(null);
              setCodigoHabitacion('');
            }}
            className="w-full py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            Nueva Búsqueda
          </button>
        </div>
      )}
    </div>
  );
};

export default Escanear;
