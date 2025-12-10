import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { RoomService } from '../../config/http-gateway/room-service';
import { alertaError } from '../../config/context/alerts';

const TodasHabitaciones = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('Todos los estados');
  const [filterPiso, setFilterPiso] = useState('Todos los pisos');
  const [showEstadoDropdown, setShowEstadoDropdown] = useState(false);
  const [showPisoDropdown, setShowPisoDropdown] = useState(false);
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const { data, error } = await RoomService.getAllRooms();
      if (error) {
        alertaError('Error', 'No se pudieron cargar las habitaciones');
        console.error('Error cargando habitaciones:', error);
      } else {
        setHabitaciones(data || []);
      }
    } catch (error) {
      alertaError('Error', 'Error al cargar las habitaciones');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const estadoOptions = ['Todos los estados', 'LIMPIA', 'EN_USO', 'EN_LIMPIEZA', 'BLOQUEADA_INCIDENCIA', 'PENDIENTE_LIMPIEZA'];

  const pisosUnicos = ['Todos los pisos', ...new Set(habitaciones.map(h => h.floor).filter(Boolean))].sort();

  const filteredHabitaciones = habitaciones.filter(hab => {
    const matchSearch = hab.roomNumber?.includes(searchTerm);
    const matchEstado = filterEstado === 'Todos los estados' || hab.currentStatus === filterEstado;
    const matchPiso = filterPiso === 'Todos los pisos' || hab.floor === filterPiso;

    return matchSearch && matchEstado && matchPiso;
  });

  const handleEstadoChange = (newEstado) => {
    setFilterEstado(newEstado);
    setShowEstadoDropdown(false);
  };

  const handlePisoChange = (newPiso) => {
    setFilterPiso(newPiso);
    setShowPisoDropdown(false);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Todas las Habitaciones</h2>
        <p className="text-sm text-gray-500 mt-1">Mostrando {filteredHabitaciones.length} de {habitaciones.length} habitaciones</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por número..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <button
            onClick={() => {
              setShowEstadoDropdown(!showEstadoDropdown);
              setShowPisoDropdown(false);
            }}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl flex items-center justify-between text-sm hover:bg-gray-50 transition-colors"
          >
            <span className="text-gray-700">
              {filterEstado === 'Todos los estados' 
                ? filterEstado 
                : estadoConfig[filterEstado]?.label || filterEstado}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          
          {showEstadoDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
              {estadoOptions.map((estado) => (
                <button
                  key={estado}
                  onClick={() => handleEstadoChange(estado)}
                  className={`w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors ${
                    filterEstado === estado ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  {estado === 'Todos los estados' 
                    ? estado 
                    : estadoConfig[estado]?.label || estado}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative flex-1">
          <button
            onClick={() => {
              setShowPisoDropdown(!showPisoDropdown);
              setShowEstadoDropdown(false);
            }}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl flex items-center justify-between text-sm hover:bg-gray-50 transition-colors"
          >
            <span className="text-gray-700">{filterPiso}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          
          {showPisoDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
              {pisosUnicos.map((piso) => (
                <button
                  key={piso}
                  onClick={() => handlePisoChange(piso)}
                  className={`w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors ${
                    filterPiso === piso ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  {piso}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && habitaciones.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay habitaciones registradas</p>
        </div>
      )}

      {/* Habitaciones Grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredHabitaciones.map((habitacion) => {
            const config = estadoConfig[habitacion.currentStatus];
            return (
              <div key={habitacion.id} className="bg-white rounded-2xl p-4 shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {habitacion.roomNumber}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${config?.color || 'bg-gray-100 text-gray-700'}`}>
                    {config?.label || habitacion.currentStatus}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-gray-600">
                    {habitacion.floor ? `Piso ${habitacion.floor}` : 'Sin piso asignado'}
                  </p>
                  {habitacion.notes && (
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {habitacion.notes}
                    </p>
                  )}
                  {habitacion.barcodeValue && (
                    <p className="text-xs text-gray-500">
                      Código: {habitacion.barcodeValue}
                    </p>
                  )}
                  {habitacion.lastStatusChange && (
                    <p className="text-xs text-gray-500">
                      Última actualización: {new Date(habitacion.lastStatusChange).toLocaleDateString('es-MX')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TodasHabitaciones;
