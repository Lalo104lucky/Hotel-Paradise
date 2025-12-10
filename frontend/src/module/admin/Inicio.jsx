import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  AlertCircle,
  ClipboardPlus,
  Clock,
  Loader2
} from 'lucide-react';
import { RoomService, UserService, AssignmentService, IncidentService } from '../../config/http-gateway';

const Inicio = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    habitaciones: {
      total: 0,
      disponibles: 0,
      enUso: 0,
      bloqueadas: 0,
      enLimpieza: 0
    },
    personal: {
      total: 0,
      activas: 0,
      inactivas: 0
    },
    tareas: {
      total: 0,
      completadas: 0,
      pendientes: 0,
      tasaCompletitud: '0%'
    },
    incidencias: {
      total: 0,
      nuevas: 0,
      enRevision: 0,
      resueltas: 0
    }
  });
  const [asignacionesPendientes, setAsignacionesPendientes] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    
    try {
      // Cargar todos los datos en paralelo
      const [roomsResult, usersResult, assignmentsResult, incidentsResult] = await Promise.all([
        RoomService.getAllRooms(),
        UserService.getUsersByRole('CAMARERA'),
        AssignmentService.getAllAssignments(),
        IncidentService.getAllIncidents()
      ]);

      // Procesar habitaciones
      if (!roomsResult.error && roomsResult.data) {
        const rooms = roomsResult.data;
        const disponibles = rooms.filter(r => r.status === 'LIMPIA').length;
        const enUso = rooms.filter(r => r.status === 'EN_USO').length;
        const bloqueadas = rooms.filter(r => r.status === 'BLOQUEADA_INCIDENCIA').length;
        const enLimpieza = rooms.filter(r => r.status === 'PENDIENTE_LIMPIEZA' || r.status === 'EN_LIMPIEZA').length;

        setStats(prev => ({
          ...prev,
          habitaciones: {
            total: rooms.length,
            disponibles,
            enUso,
            bloqueadas,
            enLimpieza
          }
        }));
      }

      // Procesar personal
      if (!usersResult.error && usersResult.data) {
        const users = usersResult.data;
        const activas = users.filter(u => u.status === true).length;
        const inactivas = users.filter(u => u.status === false).length;

        setStats(prev => ({
          ...prev,
          personal: {
            total: users.length,
            activas,
            inactivas
          }
        }));
      }

      // Procesar asignaciones/tareas
      if (!assignmentsResult.error && assignmentsResult.data) {
        const assignments = assignmentsResult.data;
        const completadas = assignments.filter(a => a.roomStatus === 'LIMPIA').length;
        const pendientes = assignments.filter(a => a.roomStatus !== 'LIMPIA').length;
        const tasaCompletitud = assignments.length > 0 
          ? `${Math.round((completadas / assignments.length) * 100)}%` 
          : '0%';

        setStats(prev => ({
          ...prev,
          tareas: {
            total: assignments.length,
            completadas,
            pendientes,
            tasaCompletitud
          }
        }));

        // Filtrar asignaciones pendientes para mostrar en la lista
        const pending = assignments
          .filter(a => a.roomStatus !== 'LIMPIA')
          .slice(0, 5); // Mostrar máximo 5
        
        setAsignacionesPendientes(pending);
      }

      // Procesar incidencias
      if (!incidentsResult.error && incidentsResult.data) {
        const incidents = incidentsResult.data;
        const nuevas = incidents.filter(i => i.status === 'ABIERTA').length;
        const enRevision = incidents.filter(i => i.status === 'EN_REVISION').length;
        const resueltas = incidents.filter(i => i.status === 'RESUELTA').length;

        setStats(prev => ({
          ...prev,
          incidencias: {
            total: incidents.length,
            nuevas,
            enRevision,
            resueltas
          }
        }));
      }
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  const getEstadoLabel = (roomStatus) => {
    switch (roomStatus) {
      case 'LIMPIA':
        return 'Completada';
      case 'EN_LIMPIEZA':
        return 'En Progreso';
      case 'PENDIENTE_LIMPIEZA':
        return 'Pendiente';
      case 'BLOQUEADA_INCIDENCIA':
        return 'Bloqueada';
      default:
        return 'Pendiente';
    }
  };

  const StatCard = ({ title, data, icon: Icon, color, borderColor }) => (
    <div className="bg-white rounded-2xl shadow-md border-l-4 overflow-hidden" style={{ borderLeftColor: borderColor }}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center">
                <Icon className="w-6 h-6" style={{ color: borderColor }} />
              </div>
              <h3 className="text-base font-bold text-gray-800">{title}</h3>
            </div>
          </div>
        </div>
        <div className="space-y-2.5 pl-1">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-sm text-gray-600 capitalize">
                {key === 'enUso' ? 'En Uso' :
                  key === 'enLimpieza' ? 'En Limpieza' :
                    key === 'tasaCompletitud' ? 'Tasa Completitud' :
                      key.charAt(0).toUpperCase() + key.slice(1)}
              </span>
              <span className={`text-base font-bold ${key === 'disponibles' ? 'text-green-600' :
                key === 'enUso' ? 'text-blue-600' :
                  key === 'bloqueadas' ? 'text-red-600' :
                    key === 'enLimpieza' ? 'text-yellow-600' :
                      key === 'activas' ? 'text-green-600' :
                        key === 'inactivas' ? 'text-gray-500' :
                          key === 'nuevas' ? 'text-orange-600' :
                            key === 'enRevision' ? 'text-orange-600' :
                              key === 'resueltas' ? 'text-green-600' :
                                'text-gray-900'
                }`}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const QuickActionButton = ({ icon: Icon, label, sublabel, onClick, iconColor }) => (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
    >
      <div className="w-8 h-8 rounded-2xl flex items-center justify-center mb-3 shadow-sm">
        <Icon className="w-7 h-7" style={{ color: iconColor }} />
      </div>
      <span className="text-sm font-bold text-gray-900">{label}</span>
      <span className="text-xs text-gray-500 mt-1">{sublabel}</span>
    </button>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Título */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Estadísticas Generales</h2>
        <p className="text-sm text-gray-500 mt-1">Resumen del día de hoy</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4">
        <StatCard
          title="Total Habitaciones"
          data={{
            total: stats.habitaciones.total,
            disponibles: stats.habitaciones.disponibles,
            enUso: stats.habitaciones.enUso,
            bloqueadas: stats.habitaciones.bloqueadas,
            enLimpieza: stats.habitaciones.enLimpieza
          }}
          icon={Building2}
          color="#2563eb"
          borderColor="#2563eb"
        />

        <StatCard
          title="Personal"
          data={{
            total: stats.personal.total,
            activas: stats.personal.activas,
            inactivas: stats.personal.inactivas
          }}
          icon={Users}
          color="bg-green-600"
          borderColor="#16a34a"
        />

        <StatCard
          title="Tareas Hoy"
          data={{
            total: stats.tareas.total,
            completadas: stats.tareas.completadas,
            pendientes: stats.tareas.pendientes,
            tasaCompletitud: stats.tareas.tasaCompletitud
          }}
          icon={ClipboardPlus}
          color="bg-purple-600"
          borderColor="#9333ea"
        />

        <StatCard
          title="Incidencias"
          data={{
            total: stats.incidencias.total,
            nuevas: stats.incidencias.nuevas,
            enRevision: stats.incidencias.enRevision,
            resueltas: stats.incidencias.resueltas
          }}
          icon={AlertCircle}
          color="bg-red-600"
          borderColor="#ea0c0cff"
        />
      </div>

      {/* Acciones Rápidas */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-3 gap-3">
          <QuickActionButton
            icon={ClipboardPlus}
            label="Nueva"
            sublabel="Asignación"
            onClick={() => navigate('/admin/mobile/asignar')}
            iconColor="#9333ea"
          />
          <QuickActionButton
            icon={Building2}
            label="Ver"
            sublabel="Habitaciones"
            onClick={() => navigate('/admin/mobile/habitaciones')}
            iconColor="#2563eb"
          />
          <QuickActionButton
            icon={AlertCircle}
            label="Ver"
            sublabel="Incidencias"
            onClick={() => navigate('/admin/mobile/incidencias')}
            iconColor="#dc2626"
          />
        </div>
      </div>

      {/* Asignaciones Pendientes Hoy */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Asignaciones Pendientes Hoy</h3>
        <div className="space-y-3">
          {asignacionesPendientes.length > 0 ? (
            asignacionesPendientes.map((asignacion) => (
              <div key={asignacion.id} className="bg-white rounded-2xl shadow-md border-l-4 border-yellow-500 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-base font-bold text-gray-900">
                          Habitación {asignacion.roomNumber}
                        </h4>
                        <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                          {getEstadoLabel(asignacion.roomStatus)}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <p className="text-sm text-gray-700 font-medium">
                            {asignacion.userName || 'Sin asignar'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatTime(asignacion.createdAt)}</span>
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="capitalize font-medium">Piso {asignacion.floor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center shadow-md">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ClipboardPlus className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-base font-semibold text-gray-900 mb-1">¡Todo al día!</p>
              <p className="text-sm text-gray-500">No hay asignaciones pendientes en este momento</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inicio;
