import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, ChevronDown, Plus, X, Edit2, Trash2, Download, Printer, Clock, Building2, Info } from 'lucide-react';
import * as yup from 'yup';
import { useFormik } from 'formik';
import { QRCodeSVG } from 'qrcode.react';
import { RoomService, RoomStatus } from '../../config/http-gateway/room-service';
import { HotelSettingsService } from '../../config/http-gateway';
import { alertaExito, alertaError, alertaCargando, alertaPregunta } from '../../config/context/alerts';
import Swal from 'sweetalert2';

const Habitaciones = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('Todos los estados');
  const [filterPiso, setFilterPiso] = useState('Todos los pisos');
  const [showEstadoDropdown, setShowEstadoDropdown] = useState(false);
  const [showPisoDropdown, setShowPisoDropdown] = useState(false);
  const [showNewRoomModal, setShowNewRoomModal] = useState(false);
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [showConfigHorarioModal, setShowConfigHorarioModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [defaultCleaningTime, setDefaultCleaningTime] = useState('14:00');
  const [newDefaultTime, setNewDefaultTime] = useState('14:00');
  const qrRef = useRef(null);

  useEffect(() => {
    loadRooms();
    loadHotelSettings();

    const intervalId = setInterval(() => {
      loadRooms();
    }, 60000);

    return () => clearInterval(intervalId);
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

  const loadHotelSettings = async () => {
    try {
      const { data, error } = await HotelSettingsService.getSettings();
      if (!error && data) {
        setDefaultCleaningTime(data.cleaningStartTime || '14:00');
        setNewDefaultTime(data.cleaningStartTime || '14:00');
      }
    } catch (error) {
      console.error('Error loading hotel settings:', error);
    }
  };

  const handleUpdateDefaultTime = async () => {
    alertaCargando('Actualizando horario...', 'Se están actualizando todas las habitaciones');

    const { error } = await HotelSettingsService.updateSettings({
      cleaningStartTime: newDefaultTime,
      allowOffline: true
    });

    Swal.close();

    if (!error) {
      setDefaultCleaningTime(newDefaultTime);
      setShowConfigHorarioModal(false);

      await loadRooms();

      alertaExito(
        '¡Horario Actualizado!',
        `Todas las habitaciones ahora tienen el horario ${newDefaultTime}`
      );
    } else {
      alertaError('Error', error?.message || 'No se pudo actualizar el horario');
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

  const generateBarcodeValue = (floor, roomNumber) => {
    if (!floor || !roomNumber) return '';
    return `HTL-P${floor}-${roomNumber}`;
  };

  const formik = useFormik({
    initialValues: {
      roomNumber: editingRoom?.roomNumber || '',
      floor: editingRoom?.floor || '',
      barcodeValue: editingRoom?.barcodeValue || '',
      scheduledCleaningTime: editingRoom?.scheduledCleaningTime || defaultCleaningTime,
      notes: editingRoom?.notes || ''
    },
    enableReinitialize: true,
    validationSchema: yup.object({
      roomNumber: yup.string()
        .required('El número de habitación es obligatorio')
        .matches(/^[0-9]+$/, 'Solo se permiten números'),
      floor: yup.string()
        .required('El piso es obligatorio'),
      barcodeValue: yup.string(),
      scheduledCleaningTime: yup.string()
        .required('El horario de limpieza es obligatorio'),
      notes: yup.string()
        .max(200, 'Las notas no pueden exceder 200 caracteres')
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        alertaCargando('Guardando', 'Por favor espera...');

        let result;
        if (editingRoom) {
          result = await RoomService.updateRoom(editingRoom.id, values);
        } else {
          result = await RoomService.createRoom(values);
        }

        Swal.close();

        if (result.error) {
          alertaError('Error', result.error.message || 'No se pudo guardar la habitación');
          return;
        }

        alertaExito(
          editingRoom ? 'Actualizada' : 'Creada',
          `Habitación ${values.roomNumber} ${editingRoom ? 'actualizada' : 'creada'} exitosamente`
        );

        resetForm();
        setShowNewRoomModal(false);
        setShowEditRoomModal(false);
        setEditingRoom(null);
        loadRooms(); 
      } catch (error) {
        Swal.close();
        console.error('Error al guardar habitación:', error);
        alertaError('Error inesperado', 'Ocurrió un error al guardar la habitación');
      } finally {
        setSubmitting(false);
      }
    }
  });

  useEffect(() => {
    const newBarcodeValue = generateBarcodeValue(formik.values.floor, formik.values.roomNumber);
    if (newBarcodeValue && newBarcodeValue !== formik.values.barcodeValue) {
      formik.setFieldValue('barcodeValue', newBarcodeValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.floor, formik.values.roomNumber]);

  const handleStatusChange = async (roomId, newStatus) => {
    try {
      alertaCargando('Actualizando', 'Cambiando estado...');

      const { data, error } = await RoomService.updateRoomStatus(roomId, { status: newStatus });

      Swal.close();

      if (error) {
        alertaError('Error', 'No se pudo actualizar el estado');
        return;
      }

      alertaExito('Actualizado', 'Estado de habitación actualizado exitosamente');
      loadRooms(); 
    } catch (error) {
      Swal.close();
      console.error('Error al actualizar estado:', error);
      alertaError('Error', 'Ocurrió un error al actualizar el estado');
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setShowEditRoomModal(true);
  };

  const handleDeleteRoom = async (room) => {
    const confirmado = await alertaPregunta(
      '¿Eliminar habitación?',
      `¿Estás seguro de eliminar la habitación ${room.roomNumber}? Esta acción no se puede deshacer.`
    );

    if (!confirmado) return;

    try {
      alertaCargando('Eliminando', 'Por favor espera...');

      const { error } = await RoomService.deleteRoom(room.id);

      Swal.close();

      if (error) {
        alertaError('Error', 'No se pudo eliminar la habitación');
        return;
      }

      alertaExito('Eliminada', `Habitación ${room.roomNumber} eliminada exitosamente`);
      loadRooms(); 
    } catch (error) {
      Swal.close();
      console.error('Error al eliminar habitación:', error);
      alertaError('Error', 'Ocurrió un error al eliminar la habitación');
    }
  };

  const handleDownloadQR = () => {
    if (!formik.values.barcodeValue) {
      alertaError('Error', 'Primero ingresa el piso y número de habitación');
      return;
    }

    const svg = qrRef.current.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 300;
    canvas.height = 300;

    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, 300, 300);

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `QR-Habitacion-${formik.values.roomNumber}.png`;
        link.click();
        URL.revokeObjectURL(url);
        alertaExito('Descargado', 'Código QR descargado exitosamente');
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrintQR = () => {
    if (!formik.values.barcodeValue) {
      alertaError('Error', 'Primero ingresa el piso y número de habitación');
      return;
    }

    const printWindow = window.open('', '_blank');
    const qrElement = qrRef.current.innerHTML;

    printWindow.document.write(`
      <html>
        <head>
          <title>Código QR - Habitación ${formik.values.roomNumber}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .qr-container {
              text-align: center;
              padding: 20px;
              border: 2px solid #000;
              border-radius: 10px;
            }
            h1 {
              margin-bottom: 10px;
              font-size: 24px;
            }
            p {
              margin: 5px 0;
              color: #666;
            }
            .qr-code {
              margin: 20px 0;
            }
            @media print {
              body {
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>Habitación ${formik.values.roomNumber}</h1>
            <p>Piso ${formik.values.floor}</p>
            <p>Código: ${formik.values.barcodeValue}</p>
            <div class="qr-code">
              ${qrElement}
            </div>
            <p style="font-size: 12px; margin-top: 20px;">Escanea este código con la app para acceder a la información de la habitación</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Habitaciones</h2>
          <p className="text-sm text-gray-500 mt-1">Mostrando {filteredHabitaciones.length} de {habitaciones.length} habitaciones</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowConfigHorarioModal(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2.5 rounded-xl shadow-md hover:from-purple-700 hover:to-purple-800 transition-all flex items-center gap-2"
            title="Configurar horario por defecto"
          >
            <Clock className="w-5 h-5" />
            <span className="text-sm font-semibold">Horario</span>
          </button>
          <button
            onClick={() => setShowNewRoomModal(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-2.5 rounded-xl shadow-md hover:from-blue-700 hover:to-blue-800 transition-all"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por número..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
          <button
            onClick={() => setShowNewRoomModal(true)}
            className="mt-4 px-4 py-2 text-white rounded-lg hover:bg-blue-700 transition-colors"
            style={{ backgroundColor: '#2563eb' }}
          >
            Crear primera habitación
          </button>
        </div>
      )}

      {/* Habitaciones Grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredHabitaciones.map((habitacion) => {
            const config = estadoConfig[habitacion.currentStatus];
            return (
              <div key={habitacion.id} className="bg-white rounded-2xl p-4 shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-blue-600 font-bold text-base">
                    {habitacion.roomNumber}
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${config?.color || 'bg-gray-100 text-gray-700'}`}>
                  {config?.label || habitacion.currentStatus}
                </span>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs text-gray-600 font-medium">
                  {habitacion.floor ? `Piso ${habitacion.floor}` : 'Sin piso asignado'}
                </p>
                {habitacion.scheduledCleaningTime && (
                  <p className="text-xs text-purple-600 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Limpieza: {habitacion.scheduledCleaningTime}
                  </p>
                )}
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
              </div>

              {/* Action Buttons */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => handleEditRoom(habitacion)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-semibold bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteRoom(habitacion)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-semibold bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              </div>

              {/* Change Status Dropdown */}
              <div className="mt-2.5">
                <p className="text-xs font-medium text-gray-600 mb-1.5">Cambiar estado:</p>
                <select
                  className="w-full px-2.5 py-2 text-[11px] font-medium bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.25em 1.25em',
                    paddingRight: '2rem'
                  }}
                  value={habitacion.currentStatus}
                  onChange={(e) => handleStatusChange(habitacion.id, e.target.value)}
                >
                  <option value="LIMPIA">Limpia</option>
                  <option value="EN_USO">En Uso</option>
                  <option value="EN_LIMPIEZA">En Limpieza</option>
                  <option value="BLOQUEADA_INCIDENCIA">Bloqueada</option>
                  <option value="PENDIENTE_LIMPIEZA">Pendiente</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Modal de Nueva Habitación */}
      {showNewRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-gray-800">Nueva Habitación</h2>
              <button
                onClick={() => {
                  setShowNewRoomModal(false);
                  formik.resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={formik.handleSubmit} className="space-y-4">
                {/* Campo Número de Habitación */}
                <div>
                  <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Habitación <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                    </div>
                    <input
                      id="roomNumber"
                      name="roomNumber"
                      type="text"
                      placeholder="101"
                      value={formik.values.roomNumber}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  {formik.touched.roomNumber && formik.errors.roomNumber && (
                    <p className="mt-2 text-sm text-red-600">{formik.errors.roomNumber}</p>
                  )}
                </div>

                {/* Campo Piso */}
                <div>
                  <label htmlFor="floor" className="block text-sm font-medium text-gray-700 mb-2">
                    Piso <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <select
                      id="floor"
                      name="floor"
                      value={formik.values.floor}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none"
                    >
                      <option value="">Selecciona un piso</option>
                      <option value="1">Piso 1</option>
                      <option value="2">Piso 2</option>
                      <option value="3">Piso 3</option>
                      <option value="4">Piso 4</option>
                      <option value="5">Piso 5</option>
                    </select>
                  </div>
                  {formik.touched.floor && formik.errors.floor && (
                    <p className="mt-2 text-sm text-red-600">{formik.errors.floor}</p>
                  )}
                </div>

                {/* Campo Código de Barras */}
                <div>
                  <label htmlFor="barcodeValue" className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Barras (Generado automáticamente)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <input
                      id="barcodeValue"
                      name="barcodeValue"
                      type="text"
                      placeholder="Se generará automáticamente"
                      value={formik.values.barcodeValue}
                      readOnly
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                  <p className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Se genera automáticamente al ingresar piso y número de habitación
                  </p>
                </div>

                {/* Código QR Visual */}
                {formik.values.barcodeValue && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-blue-900">Código QR para Escanear</h3>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleDownloadQR}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          title="Descargar QR"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handlePrintQR}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          title="Imprimir QR"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div ref={qrRef} className="flex flex-col items-center bg-white p-4 rounded-lg">
                      <QRCodeSVG
                        value={formik.values.barcodeValue}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                      <p className="text-xs text-gray-600 mt-2 text-center">
                        {formik.values.barcodeValue}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        Habitación {formik.values.roomNumber} - Piso {formik.values.floor}
                      </p>
                    </div>
                  </div>
                )}

                {/* Campo Notas */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notas
                  </label>
                  <div className="relative">
                    <textarea
                      id="notes"
                      name="notes"
                      rows="3"
                      placeholder="Observaciones o características especiales de la habitación..."
                      value={formik.values.notes}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                    />
                  </div>
                  {formik.touched.notes && formik.errors.notes && (
                    <p className="mt-2 text-sm text-red-600">{formik.errors.notes}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {formik.values.notes.length}/200 caracteres
                  </p>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewRoomModal(false);
                      formik.resetForm();
                    }}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formik.isSubmitting || !formik.isValid}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    {formik.isSubmitting ? 'Creando...' : 'Registrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar Habitación */}
      {showEditRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-gray-800">Editar Habitación</h2>
              <button
                onClick={() => {
                  setShowEditRoomModal(false);
                  setEditingRoom(null);
                  formik.resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={formik.handleSubmit} className="space-y-4">
                {/* Campo Número de Habitación */}
                <div>
                  <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Habitación <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                    </div>
                    <input
                      id="roomNumber"
                      name="roomNumber"
                      type="text"
                      placeholder="101"
                      value={formik.values.roomNumber}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  {formik.touched.roomNumber && formik.errors.roomNumber && (
                    <p className="mt-2 text-sm text-red-600">{formik.errors.roomNumber}</p>
                  )}
                </div>

                {/* Campo Piso */}
                <div>
                  <label htmlFor="floor" className="block text-sm font-medium text-gray-700 mb-2">
                    Piso <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <select
                      id="floor"
                      name="floor"
                      value={formik.values.floor}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none"
                    >
                      <option value="">Selecciona un piso</option>
                      <option value="1">Piso 1</option>
                      <option value="2">Piso 2</option>
                      <option value="3">Piso 3</option>
                      <option value="4">Piso 4</option>
                      <option value="5">Piso 5</option>
                    </select>
                  </div>
                  {formik.touched.floor && formik.errors.floor && (
                    <p className="mt-2 text-sm text-red-600">{formik.errors.floor}</p>
                  )}
                </div>

                {/* Campo Código de Barras */}
                <div>
                  <label htmlFor="barcodeValue" className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Barras (Generado automáticamente)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <input
                      id="barcodeValue"
                      name="barcodeValue"
                      type="text"
                      placeholder="Se generará automáticamente"
                      value={formik.values.barcodeValue}
                      readOnly
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                  <p className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Se genera automáticamente al ingresar piso y número de habitación
                  </p>
                </div>

                {/* Código QR Visual */}
                {formik.values.barcodeValue && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-blue-900">Código QR para Escanear</h3>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleDownloadQR}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          title="Descargar QR"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handlePrintQR}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          title="Imprimir QR"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div ref={qrRef} className="flex flex-col items-center bg-white p-4 rounded-lg">
                      <QRCodeSVG
                        value={formik.values.barcodeValue}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                      <p className="text-xs text-gray-600 mt-2 text-center">
                        {formik.values.barcodeValue}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        Habitación {formik.values.roomNumber} - Piso {formik.values.floor}
                      </p>
                    </div>
                  </div>
                )}

                {/* Campo Notas */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notas
                  </label>
                  <div className="relative">
                    <textarea
                      id="notes"
                      name="notes"
                      rows="3"
                      placeholder="Observaciones o características especiales de la habitación..."
                      value={formik.values.notes}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                    />
                  </div>
                  {formik.touched.notes && formik.errors.notes && (
                    <p className="mt-2 text-sm text-red-600">{formik.errors.notes}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {formik.values.notes?.length || 0}/200 caracteres
                  </p>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditRoomModal(false);
                      setEditingRoom(null);
                      formik.resetForm();
                    }}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formik.isSubmitting || !formik.isValid}
                    className="flex-1 px-4 py-3 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#2563eb' }}
                  >
                    {formik.isSubmitting ? 'Actualizando...' : 'Actualizar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuración de Horario */}
      {showConfigHorarioModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-800">Horario por Defecto</h2>
              </div>
              <button
                onClick={() => {
                  setShowConfigHorarioModal(false);
                  setNewDefaultTime(defaultCleaningTime);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horario de Limpieza <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="time"
                    value={newDefaultTime}
                    onChange={(e) => setNewDefaultTime(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-lg"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowConfigHorarioModal(false);
                    setNewDefaultTime(defaultCleaningTime);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateDefaultTime}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Habitaciones;
