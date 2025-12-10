import React, { useState, useEffect } from 'react';
import { ChevronDown, Eye, ChevronLeft, CheckCircle, AlertCircle, X, ChevronRight, FileText, AlertTriangle, CloudOff } from 'lucide-react';
import { IncidentService, IncidentStatus } from '../../config/http-gateway';
import { OfflineIncidentService } from '../../services';
import { alertaExito, alertaError, alertaCargando, alertaPregunta } from '../../config/context/alerts';
import Swal from 'sweetalert2';

const Incidencias = () => {
  const [filterEstado, setFilterEstado] = useState('Todas');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIncidencia, setSelectedIncidencia] = useState(null);
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isFromCache, setIsFromCache] = useState(false);

  const estadoOptions = ['Todas', 'ABIERTA', 'EN_REVISION', 'RESUELTA'];

  const estadoConfig = {
    'ABIERTA': {
      label: 'Abierta',
      color: 'bg-red-100 text-red-700 border-red-200',
      icon: AlertCircle
    },
    'EN_REVISION': {
      label: 'En Revisión',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: Eye
    },
    'RESUELTA': {
      label: 'Resuelta',
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: CheckCircle
    }
  };

  // Cargar incidencias al montar
  useEffect(() => {
    loadIncidencias();
  }, []);

  // Cerrar lightbox con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;

      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, selectedIncidencia]);

  // Log de debug cuando se selecciona una incidencia
  useEffect(() => {
    if (selectedIncidencia) {
      console.log('[DEBUG] selectedIncidencia completa:', selectedIncidencia);
      console.log('[DEBUG] photoUrls:', selectedIncidencia.photoUrls);
      console.log('[DEBUG] room:', selectedIncidencia.room);
      console.log('[DEBUG] roomNumber directo:', selectedIncidencia.roomNumber);
    }
  }, [selectedIncidencia]);

  const loadIncidencias = async () => {
    setLoading(true);
    const { data, error, isFromCache: fromCache } = await OfflineIncidentService.getAllIncidents();

    if (!error && data) {
      console.log('[DEBUG] Incidencias cargadas:', data);
      console.log('[DEBUG] Total incidencias:', data.length);
      console.log('[DEBUG] Desde caché:', fromCache);
      data.forEach((inc, idx) => {
        if (inc.photoUrls && inc.photoUrls.length > 0) {
          console.log(`[DEBUG] Incidencia ${idx} tiene ${inc.photoUrls.length} fotos:`, inc.photoUrls);
        }
      });
      setIncidencias(data);
      setIsFromCache(fromCache || false);
    } else {
      alertaError('Error', error?.message || 'No se pudieron cargar las incidencias');
      setIsFromCache(false);
    }
    setLoading(false);
  };

  const filteredIncidencias = incidencias.filter(inc => {
    return filterEstado === 'Todas' || inc.status === filterEstado;
  });

  const handleFilterChange = (newEstado) => {
    setFilterEstado(newEstado);
    setShowDropdown(false);
  };

  const handleCambiarEstado = async (incidentId, nuevoEstado) => {
    if (nuevoEstado === 'RESUELTA') {
      const confirmar = await alertaPregunta(
        '¿Resolver incidencia?',
        'La habitación cambiará a PENDIENTE_LIMPIEZA y las fotos se eliminarán permanentemente'
      );

      if (!confirmar) return;
    }

    alertaCargando('Actualizando estado...', 'Por favor espera');

    const { data, error, offlineMode } = await OfflineIncidentService.updateIncidentStatus(incidentId, {
      status: nuevoEstado
    });

    Swal.close();

    if (!error) {
      let mensajeEstado = 'Estado actualizado';
      if (nuevoEstado === 'RESUELTA') {
        mensajeEstado = 'Incidencia resuelta. Habitación lista para limpieza';
      } else if (nuevoEstado === 'EN_REVISION') {
        mensajeEstado = 'Incidencia marcada en revisión';
      }

      if (offlineMode) {
        mensajeEstado += ' (se sincronizará cuando haya conexión)';
      }

      alertaExito('¡Actualizado!', mensajeEstado);

      // Si estamos en detalle, actualizar la incidencia seleccionada
      if (selectedIncidencia && selectedIncidencia.id === incidentId) {
        setSelectedIncidencia(data || selectedIncidencia);
      }

      await loadIncidencias();
    } else {
      alertaError('Error', error?.message || 'No se pudo actualizar el estado');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX');
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const openLightbox = (index) => {
    setCurrentPhotoIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextPhoto = () => {
    if (selectedIncidencia?.photoUrls) {
      setCurrentPhotoIndex((prev) =>
        prev === selectedIncidencia.photoUrls.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevPhoto = () => {
    if (selectedIncidencia?.photoUrls) {
      setCurrentPhotoIndex((prev) =>
        prev === 0 ? selectedIncidencia.photoUrls.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando incidencias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {selectedIncidencia ? (
        // Detalle de Incidencia
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedIncidencia(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Habitación {selectedIncidencia.roomNumber || selectedIncidencia.room?.roomNumber || 'N/A'}
              </h2>
              <p className="text-sm text-gray-500">{selectedIncidencia.title}</p>
            </div>
          </div>

          {/* Card con Información */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-700">Estado</span>
              <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${estadoConfig[selectedIncidencia.status]?.color || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                {estadoConfig[selectedIncidencia.status]?.label || selectedIncidencia.status}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-gray-500 block mb-1">Reportada por:</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedIncidencia.reportedByUserName || 'Usuario'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-gray-500 block mb-1">Fecha: </span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(selectedIncidencia.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">Hora</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatTime(selectedIncidencia.createdAt)}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs text-gray-500 block mb-1">Habitación</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedIncidencia.roomNumber || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-xs text-gray-500 block mb-2">Descripción</span>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                  {selectedIncidencia.description || 'Sin descripción'}
                </p>
              </div>

              {selectedIncidencia.photoUrls && selectedIncidencia.photoUrls.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-medium text-gray-700">
                      {selectedIncidencia.photoUrls.length} foto{selectedIncidencia.photoUrls.length !== 1 ? 's' : ''} adjunta{selectedIncidencia.photoUrls.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedIncidencia.photoUrls.map((photoUrl, index) => (
                      <button
                        key={index}
                        onClick={() => openLightbox(index)}
                        className="relative aspect-square overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all group"
                      >
                        <img
                          src={IncidentService.getImageUrl(photoUrl)}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                          <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedIncidencia.status === 'RESUELTA' && selectedIncidencia.resolvedAt && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <p className="text-xs text-green-700 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Resuelta el {formatDate(selectedIncidencia.resolvedAt)} a las {formatTime(selectedIncidencia.resolvedAt)}
                  </p>
                </div>
              )}
            </div>

            {/* Cambiar Estado */}
            {selectedIncidencia.status !== 'RESUELTA' && (
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Cambiar Estado
                </label>
                <div className="flex gap-2">
                  {selectedIncidencia.status === 'ABIERTA' && (
                    <button
                      onClick={() => handleCambiarEstado(selectedIncidencia.id, 'EN_REVISION')}
                      className="flex-1 py-2.5 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                      style={{ backgroundColor: '#2563eb' }}
                    >
                      Marcar En Revisión
                    </button>
                  )}
                  <button
                    onClick={() => handleCambiarEstado(selectedIncidencia.id, 'RESUELTA')}
                    className="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-medium rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Marcar Resuelta
                  </button>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-800">
                    Al resolver, la habitación cambiará a Pendiente Limpieza y las fotos se eliminarán
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Lista de Incidencias
        <>
          {/* Header */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Gestión de Incidencias</h2>
              {isFromCache && (
                <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                  <CloudOff className="w-3 h-3" />
                  <span>Caché</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">{incidencias.length} incidencias totales</p>
          </div>

          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between text-sm hover:bg-gray-50 transition-colors"
            >
              <span className="text-gray-700">
                {filterEstado === 'Todas'
                  ? 'Todas las incidencias'
                  : estadoConfig[filterEstado]?.label || filterEstado}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                {estadoOptions.map((estado) => (
                  <button
                    key={estado}
                    onClick={() => handleFilterChange(estado)}
                    className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors ${
                      filterEstado === estado ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {estado === 'Todas'
                      ? 'Todas las incidencias'
                      : estadoConfig[estado]?.label || estado}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lista de Incidencias */}
          <div className="space-y-3">
            {filteredIncidencias.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-md border-l-4 border-red-500">
                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mb-4 shadow-md">
                  <FileText className="w-10 h-10 text-red-600" />
                </div>
                <p className="text-base font-bold text-gray-900 mb-1">No hay incidencias</p>
                <p className="text-sm text-gray-500 text-center">
                  {filterEstado === 'Todas' ? 'No se han reportado incidencias' : `No hay incidencias con estado ${estadoConfig[filterEstado]?.label}`}
                </p>
              </div>
            ) : (
              filteredIncidencias.map((incidencia) => {
                const config = estadoConfig[incidencia.status] || estadoConfig['ABIERTA'];
                const Icon = config.icon;
                const borderColor = incidencia.status === 'ABIERTA' ? '#ea0c0cff' :
                                   incidencia.status === 'EN_REVISION' ? '#2563eb' : '#16a34a';
                return (
                  <div key={incidencia.id} className="bg-white rounded-2xl p-5 shadow-md border-l-4 hover:shadow-lg transition-all" style={{ borderLeftColor: borderColor }}>
                    <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        incidencia.status === 'ABIERTA' ? 'bg-red-100' :
                        incidencia.status === 'EN_REVISION' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        <Icon className={`w-7 h-7 ${
                          incidencia.status === 'ABIERTA' ? 'text-red-600' :
                          incidencia.status === 'EN_REVISION' ? 'text-blue-600' : 'text-green-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0 flex-wrap">
                          <h4 className="text-base font-bold text-gray-900 break-words">
                            {incidencia.title}
                          </h4>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.color} flex-shrink-0`}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                        <p className="text-sm text-gray-700 font-medium mb-1">
                          Habitación {incidencia.roomNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(incidencia.createdAt)}, {formatTime(incidencia.createdAt)}
                        </p>
                        {incidencia.photoUrls && incidencia.photoUrls.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-1.5">
                              <Eye className="w-4 h-4 text-blue-500" />
                              <span className="text-xs font-semibold text-blue-600">
                                {incidencia.photoUrls.length} foto{incidencia.photoUrls.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              {incidencia.photoUrls.slice(0, 3).map((photoUrl, idx) => (
                                <div
                                  key={idx}
                                  className="w-14 h-14 rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm"
                                >
                                  <img
                                    src={IncidentService.getImageUrl(photoUrl)}
                                    alt={`Preview ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                              {incidencia.photoUrls.length > 3 && (
                                <div className="w-14 h-14 rounded-xl bg-gray-100 border-2 border-gray-200 flex items-center justify-center shadow-sm">
                                  <span className="text-xs font-bold text-gray-600">
                                    +{incidencia.photoUrls.length - 3}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedIncidencia(incidencia)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                      >
                        <Eye className="w-5 h-5 text-blue-600" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Lightbox Modal para fotos */}
      {lightboxOpen && selectedIncidencia?.photoUrls && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Botón Cerrar */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Contador de fotos */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 px-4 py-2 rounded-full">
            <span className="text-white text-sm font-medium">
              {currentPhotoIndex + 1} / {selectedIncidencia.photoUrls.length}
            </span>
          </div>

          {/* Botón Anterior */}
          {selectedIncidencia.photoUrls.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevPhoto();
              }}
              className="absolute left-4 p-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Imagen */}
          <div
            className="flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={IncidentService.getImageUrl(
                selectedIncidencia.photoUrls[currentPhotoIndex]
              )}
              alt={`Foto ${currentPhotoIndex + 1}`}
              className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg"
              style={{ width: 'auto', height: 'auto' }}
            />
            <div className="mt-4 text-center">
              <p className="text-white text-sm bg-black bg-opacity-50 inline-block px-4 py-2 rounded-lg">
                Usa las flechas del teclado o los botones para navegar
              </p>
            </div>
          </div>

          {/* Botón Siguiente */}
          {selectedIncidencia.photoUrls.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextPhoto();
              }}
              className="absolute right-4 p-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Miniaturas */}
          {selectedIncidencia.photoUrls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-[calc(100%-2rem)] max-w-md">
              <div className="flex gap-2 bg-black bg-opacity-50 p-3 rounded-xl overflow-x-auto scrollbar-hide">
              {selectedIncidencia.photoUrls.map((photoUrl, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPhotoIndex(index);
                  }}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                    index === currentPhotoIndex
                      ? 'border-blue-500 scale-110'
                      : 'border-white border-opacity-30 hover:border-opacity-60'
                  }`}
                >
                  <img
                    src={IncidentService.getImageUrl(photoUrl)}
                    alt={`Miniatura ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Incidencias;
