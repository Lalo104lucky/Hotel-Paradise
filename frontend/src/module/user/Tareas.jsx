import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle, Filter, Barcode, ClipboardList, LoaderCircle, CloudOff } from 'lucide-react';
import AuthContext from '../../config/context/auth-context';
import { AssignmentService } from '../../config/http-gateway';
import { OfflineCleaningService } from '../../services';
import pouchDBService from '../../services/pouchdb-service';
import { alertaExito, alertaError, alertaCargando } from '../../config/context/alerts';
import Swal from 'sweetalert2';

const Tareas = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('Todas');
  const [tareas, setTareas] = useState([]);
  const [isFromCache, setIsFromCache] = useState(false);

  useEffect(() => {
    if (user?.user?.id) {
      loadAssignments();
    }
  }, [user]);

  const loadAssignments = async () => {
    setLoading(true);
    const { data, error, isFromCache: fromCache } = await AssignmentService.getAssignmentsByUser(user.user.id);

    if (!error && data) {
      // Obtener limpiezas pendientes de la cola
      const pendingCleanings = await pouchDBService.getPendingCleanings();
      const pendingRoomIds = new Set(pendingCleanings.map(c => c.roomId));

      // Obtener tareas completadas offline
      const completedTasksOffline = await pouchDBService.getCompletedTasksOffline();
      const completedAssignmentIds = new Set(completedTasksOffline.map(t => t.assignmentId));

      // Marcar tareas con limpiezas pendientes y actualizar roomStatus de tareas completadas offline
      const tareasConPending = data.map(tarea => {
        const isCompletedOffline = completedAssignmentIds.has(tarea.id);
        return {
          ...tarea,
          roomStatus: isCompletedOffline ? 'LIMPIA' : tarea.roomStatus,
          pendingSync: pendingRoomIds.has(tarea.roomId)
        };
      });

      setTareas(tareasConPending);
      setIsFromCache(fromCache || false);
    } else {
      console.error('Error loading assignments:', error);
      setTareas([]);
      setIsFromCache(false);
    }
    setLoading(false);
  };

  const mapRoomStatusToTaskStatus = (roomStatus) => {
    switch (roomStatus) {
      case 'LIMPIA':
        return 'Completada';
      case 'EN_LIMPIEZA':
        return 'En progreso';
      case 'PENDIENTE_LIMPIEZA':
        return 'Pendiente';
      case 'BLOQUEADA_INCIDENCIA':
        return 'Bloqueada';
      default:
        return 'Pendiente';
    }
  };

  const stats = {
    pendientes: tareas.filter(t => mapRoomStatusToTaskStatus(t.roomStatus) === 'Pendiente').length,
    enProgreso: tareas.filter(t => mapRoomStatusToTaskStatus(t.roomStatus) === 'En progreso').length,
    completadas: tareas.filter(t => mapRoomStatusToTaskStatus(t.roomStatus) === 'Completada').length
  };

  const estadoConfig = {
    'Pendiente': {
      label: 'Pendiente',
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      icon: Clock
    },
    'En progreso': {
      label: 'En progreso',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: Clock
    },
    'Completada': {
      label: 'Completada',
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: CheckCircle
    },
    'Bloqueada': {
      label: 'Bloqueada',
      color: 'bg-red-100 text-red-700 border-red-200',
      icon: AlertCircle
    }
  };

  const filteredTareas = tareas.filter(tarea => {
    if (filterEstado === 'Todas') return true;
    return mapRoomStatusToTaskStatus(tarea.roomStatus) === filterEstado;
  });

  const handleMarcarCompletada = async (roomId) => {
    alertaCargando('Marcando como limpia...', 'Por favor espera');

    // Encontrar la tarea correspondiente
    const tarea = tareas.find(t => t.roomId === roomId);

    // PASO 1: Guardar tarea completada en PouchDB PRIMERO para persistencia
    if (tarea) {
      await pouchDBService.saveCompletedTaskOffline(tarea.id, {
        assignmentId: tarea.id,
        roomId: tarea.roomId,
        roomNumber: tarea.roomNumber,
        userId: user.user.id
      });
    }

    // PASO 2: Actualizar UI inmediatamente
    setTareas(prev => prev.map(t => 
      t.roomId === roomId 
        ? { ...t, roomStatus: 'LIMPIA', pendingSync: true }
        : t
    ));

    // PASO 3: Registrar limpieza (intenta servidor o encola)
    const { error, isQueued, offlineMode } = await OfflineCleaningService.registerCleaning({
      roomId,
      notes: 'Limpieza completada',
      assignmentId: tarea?.id
    });

    Swal.close();

    // PASO 4: Actualizar pendingSync según resultado
    setTareas(prev => prev.map(t => 
      t.roomId === roomId 
        ? { ...t, roomStatus: 'LIMPIA', pendingSync: offlineMode || isQueued }
        : t
    ));

    if (!error || isQueued) {
      alertaExito(
        (offlineMode || isQueued) ? 'Limpieza en Cola' : 'Limpieza Registrada',
        (offlineMode || isQueued)
          ? 'La limpieza se ha guardado y se enviará al servidor cuando haya conexión.'
          : 'La habitación ha sido marcada como limpia.'
      );
    } else {
      alertaError('Error', 'Ocurrió un error al marcar como limpia.');
    }
  };

  const handleReportar = (roomId, roomNumber) => {
    navigate('/user/mobile/reportar', { state: { roomId, roomNumber } });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tus tareas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Stats Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Mis Tareas Asignadas</h2>
          {isFromCache && (
            <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
              <CloudOff className="w-3 h-3" />
              <span>Caché</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setFilterEstado(filterEstado === 'Pendiente' ? 'Todas' : 'Pendiente')}
            className={`bg-white rounded-2xl p-4 transition-all shadow-md hover:shadow-lg ${
              filterEstado === 'Pendiente' ? 'ring-2 ring-yellow-500' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm">
              <Clock className="w-7 h-7 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.pendientes}</div>
            <div className="text-xs text-gray-600 mt-1">Pendientes</div>
          </button>
          <button
            onClick={() => setFilterEstado(filterEstado === 'En progreso' ? 'Todas' : 'En progreso')}
            className={`bg-white rounded-2xl p-4 transition-all shadow-md hover:shadow-lg ${
              filterEstado === 'En progreso' ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm">
              <LoaderCircle className="w-7 h-7 text-blue-600" /> 
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.enProgreso}</div>
            <div className="text-xs text-gray-600 mt-1">En progreso</div>
          </button>
          <button
            onClick={() => setFilterEstado(filterEstado === 'Completada' ? 'Todas' : 'Completada')}
            className={`bg-white rounded-2xl p-4 transition-all shadow-md hover:shadow-lg ${
              filterEstado === 'Completada' ? 'ring-2 ring-green-500' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.completadas}</div>
            <div className="text-xs text-gray-600 mt-1">Completadas</div>
          </button>
        </div>
      </div>

      {/* Tareas List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            {filterEstado === 'Todas' ? 'Todas las tareas' : `Tareas ${filterEstado}`}
          </h3>
          <span className="text-sm text-gray-500 font-medium">{filteredTareas.length} tareas</span>
        </div>

        {filteredTareas.map((tarea) => {
          const taskStatus = mapRoomStatusToTaskStatus(tarea.roomStatus);
          const config = estadoConfig[taskStatus];
          const Icon = config.icon;

          // Determinar color del borde según el estado
          let borderColor = 'border-gray-300';
          if (taskStatus === 'Pendiente') borderColor = 'border-yellow-500';
          if (taskStatus === 'En progreso') borderColor = 'border-blue-500';
          if (taskStatus === 'Completada') borderColor = 'border-green-500';
          if (taskStatus === 'Bloqueada') borderColor = 'border-red-500';

          return (
            <div key={tarea.id} className={`bg-white rounded-2xl p-5 shadow-md border-l-4 ${borderColor} hover:shadow-lg transition-all`}>
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      Habitación {tarea.roomNumber}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Piso {tarea.floor}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Barcode className="w-3 h-3" />
                    Código: {tarea.barcodeValue}
                  </p>
                  {taskStatus === 'Completada' && (
                    <>
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Limpieza Completada
                      </p>
                      {tarea.pendingSync && (
                        <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                          <CloudOff className="w-3 h-3" />
                          Pendiente de sincronización
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              {(taskStatus === 'En progreso' || taskStatus === 'Pendiente') && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMarcarCompletada(tarea.roomId)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Marcar Completada
                  </button>
                  <button
                    onClick={() => handleReportar(tarea.roomId, tarea.roomNumber)}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Reportar
                  </button>
                </div>
              )}

              {taskStatus === 'Bloqueada' && (
                <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                  <p className="text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Esta habitación está Bloqueada por una incidencia
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {filteredTareas.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center border-l-4 border-purple-500 shadow-md">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-base font-semibold text-gray-900 mb-1">No hay tareas</p>
            <p className="text-sm text-gray-500">No tienes tareas {filterEstado !== 'Todas' ? filterEstado : ''} en este momento</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tareas;
