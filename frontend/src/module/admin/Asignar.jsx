import React, { useState, useEffect } from "react";
import { Plus, X, Clock, User, MapPin } from "lucide-react";
import { RoomService } from "../../config/http-gateway";
import { UserService } from "../../config/http-gateway";
import { AssignmentService } from "../../config/http-gateway";
import {
  alertaExito,
  alertaError,
  alertaCargando,
  alertaPregunta,
} from "../../config/context/alerts";
import Swal from "sweetalert2";

const Asignar = () => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [habitacionesDisponibles, setHabitacionesDisponibles] = useState([]);
  const [camarerasActivas, setCamarerasActivas] = useState([]);
  const [asignacionesHoy, setAsignacionesHoy] = useState([]);
  const [formData, setFormData] = useState({
    habitacion: "",
    camarera: "",
    horaInicio: "09:00",
    tipoTarea: "limpieza",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadRooms(), loadCamareras(), loadAssignments()]);
    setLoading(false);
  };

  const loadRooms = async () => {
    const { data, error } = await RoomService.getAllRooms();
    if (!error && data) {
      // Filtrar habitaciones que NO están limpias (solo se asignan tareas a habitaciones que necesitan limpieza)
      const habitacionesQueNecesitanLimpieza = data.filter(
        (hab) => hab.currentStatus !== 'LIMPIA'
      );
      setHabitacionesDisponibles(habitacionesQueNecesitanLimpieza);
    } else {
      console.error("Error loading rooms:", error);
    }
  };

  const loadCamareras = async () => {
    const { data, error } = await UserService.getCamareras();
    if (!error && data) {
      const camareras = data.filter((user) => user.status === true);
      setCamarerasActivas(camareras);
    } else {
      console.error("Error loading camareras:", error);
    }
  };

  const loadAssignments = async () => {
    const { data, error } = await AssignmentService.getAllAssignments();
    if (!error && data) {
      setAsignacionesHoy(data);
    } else {
      console.error("Error loading assignments:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    alertaCargando("Creando asignación...", "Por favor espera");

    const assignmentData = {
      roomId: parseInt(formData.habitacion),
      userId: parseInt(formData.camarera),
    };

    const { data, error } = await AssignmentService.createAssignment(
      assignmentData
    );

    Swal.close();

    if (!error && data) {
      alertaExito(
        "¡Asignación creada!",
        "La tarea ha sido asignada correctamente"
      );
      setShowModal(false);
      setFormData({
        habitacion: "",
        camarera: "",
        horaInicio: "09:00",
        tipoTarea: "limpieza",
      });
      await loadAssignments();
    } else {
      alertaError("Error", error?.message || "No se pudo crear la asignación");
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = await alertaPregunta(
      "¿Eliminar asignación?",
      "Esta acción marcará la asignación como inactiva"
    );

    if (confirmDelete) {
      alertaCargando("Eliminando...", "Por favor espera");

      const { error } = await AssignmentService.deleteAssignment(id);

      Swal.close();

      if (!error) {
        alertaExito("¡Eliminada!", "La asignación ha sido eliminada");
        await loadAssignments();
      } else {
        alertaError(
          "Error",
          error?.message || "No se pudo eliminar la asignación"
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Asignación de Tareas
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {asignacionesHoy.length} asignaciones activas
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center p-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h3 className="text-xl font-bold text-gray-800">
                Nueva Asignación
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Habitación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Habitación <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.habitacion}
                  onChange={(e) =>
                    setFormData({ ...formData, habitacion: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="">Selecciona habitación</option>
                  {habitacionesDisponibles.map((hab) => (
                    <option key={hab.id} value={hab.id}>
                      {hab.roomNumber} - Piso {hab.floor}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1.5">
                  {habitacionesDisponibles.length} habitaciones disponibles
                </p>
              </div>

              {/* Camarera */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Camarera <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.camarera}
                  onChange={(e) =>
                    setFormData({ ...formData, camarera: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="">Selecciona camarera</option>
                  {camarerasActivas.map((cam) => {
                    const assignmentCount = asignacionesHoy.filter(
                      (a) => a.userId === cam.id
                    ).length;
                    return (
                      <option key={cam.id} value={cam.id}>
                        {cam.name} ({assignmentCount} asignaciones)
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-gray-500 mt-1.5">
                  {camarerasActivas.length} camareras activas
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asignaciones Activas */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Asignaciones Activas
        </h3>
        {asignacionesHoy.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border-l-4 border-purple-500 shadow-md">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-base font-semibold text-gray-900 mb-1">No hay asignaciones activas</p>
            <p className="text-sm text-gray-500">Crea una nueva asignación para comenzar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {asignacionesHoy.map((asignacion) => (
              <div
                key={asignacion.id}
                className="bg-white rounded-2xl p-5 shadow-md border-l-4 border-purple-500 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="text-base font-bold text-gray-900 truncate">
                        Habitación {asignacion.roomNumber}
                      </h4>
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${asignacion.roomStatus === "LIMPIA"
                            ? "bg-green-100 text-green-700"
                            : asignacion.roomStatus === "PENDIENTE_LIMPIEZA"
                              ? "bg-yellow-100 text-yellow-700"
                              : asignacion.roomStatus === "EN_LIMPIEZA"
                                ? "bg-purple-100 text-purple-700"
                                : asignacion.roomStatus === "EN_USO"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-red-100 text-red-700"
                          }`}
                      >
                        {asignacion.roomStatus === "LIMPIA"
                          ? "Limpia"
                          : asignacion.roomStatus === "PENDIENTE_LIMPIEZA"
                            ? "Pendiente"
                            : asignacion.roomStatus === "EN_LIMPIEZA"
                              ? "En Limpieza"
                              : asignacion.roomStatus === "EN_USO"
                                ? "En Uso"
                                : "Bloqueada"}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-700 font-medium">
                          {asignacion.userName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          Piso {asignacion.floor}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(asignacion.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Asignar;
