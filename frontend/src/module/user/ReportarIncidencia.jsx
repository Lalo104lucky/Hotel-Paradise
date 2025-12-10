import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Camera, X, Image, CheckCircle } from 'lucide-react';
import { OfflineIncidentService } from '../../services';
import { alertaExito, alertaError, alertaCargando } from '../../config/context/alerts';
import Swal from 'sweetalert2';

const ReportarIncidencia = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const roomId = location.state?.roomId;
  const roomNumber = location.state?.roomNumber || 'Desconocida';
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fotos, setFotos] = useState([]);
  const [fotosArchivos, setFotosArchivos] = useState([]); // Para guardar los File objects
  const [camaraAbierta, setCamaraAbierta] = useState(false);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);

    if (fotos.length + files.length > 3) {
      alertaError('Límite excedido', 'Solo puedes subir máximo 3 fotos');
      return;
    }

    // Validar tamaño (máximo 5MB por archivo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    for (const file of files) {
      if (file.size > maxSize) {
        alertaError('Archivo muy grande', `${file.name} supera los 5MB`);
        return;
      }
    }

    // Crear URLs para preview
    const nuevasFotosUrls = files.map(file => URL.createObjectURL(file));
    setFotos([...fotos, ...nuevasFotosUrls]);
    setFotosArchivos([...fotosArchivos, ...files]);
  };

  const handleAgregarFoto = () => {
    if (fotos.length >= 3) {
      alertaError('Límite alcanzado', 'Ya tienes 3 fotos agregadas');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleEliminarFoto = (index) => {
    // Liberar URL del objeto
    URL.revokeObjectURL(fotos[index]);
    setFotos(fotos.filter((_, i) => i !== index));
    setFotosArchivos(fotosArchivos.filter((_, i) => i !== index));
  };

  const abrirCamara = async () => {
    if (fotos.length >= 3) {
      alertaError('Límite alcanzado', 'Ya tienes 3 fotos. Elimina una para tomar otra');
      return;
    }

    try {
      console.log('[DEBUG] Solicitando acceso a cámara...');

      let stream = null;

      // Intentar primero con cámara trasera
      try {
        const constraints = {
          video: {
            facingMode: { exact: 'environment' }, // Cámara trasera
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('[DEBUG] Cámara trasera obtenida');
      } catch (err) {
        console.log('[DEBUG] Cámara trasera no disponible, intentando con cualquier cámara...');
        // Si falla, usar cualquier cámara disponible
        const fallbackConstraints = {
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        };
        stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        console.log('[DEBUG] Cámara alternativa obtenida');
      }
      console.log('[DEBUG] Stream obtenido:', stream);
      console.log('[DEBUG] Video tracks:', stream.getVideoTracks());

      // Verificar que el stream tenga tracks activos
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) {
        throw new Error('No se pudo obtener el track de video');
      }
      console.log('[DEBUG] Video track state:', videoTrack.readyState);
      console.log('[DEBUG] Video track settings:', videoTrack.getSettings());

      streamRef.current = stream;
      setCamaraAbierta(true);

      // Usar setTimeout para asegurar que el DOM se actualice
      setTimeout(() => {
        if (videoRef.current) {
          console.log('[DEBUG] Asignando stream a video element...');
          videoRef.current.srcObject = stream;

          // Forzar atributos necesarios
          videoRef.current.setAttribute('autoplay', '');
          videoRef.current.setAttribute('playsinline', '');
          videoRef.current.setAttribute('muted', '');

          // Esperar a que el video esté listo
          videoRef.current.onloadedmetadata = () => {
            console.log('[DEBUG] Video metadata cargada');
            console.log('[DEBUG] Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);

            videoRef.current.play()
              .then(() => {
                console.log('[DEBUG] Video playing successfully');
              })
              .catch(err => {
                console.error('[DEBUG] Error al reproducir video:', err);
                alertaError('Error de reproducción', 'No se pudo iniciar la vista previa');
              });
          };

          // Timeout de seguridad
          setTimeout(() => {
            if (videoRef.current && videoRef.current.readyState === 0) {
              console.error('[DEBUG] Video no se cargó después de 3 segundos');
              alertaError('Error de carga', 'La cámara tardó demasiado en responder');
            }
          }, 3000);
        }
      }, 100);

    } catch (err) {
      console.error('[DEBUG] Error al abrir cámara:', err);
      cerrarCamara();
      alertaError(
        'Error de cámara',
        err.name === 'NotAllowedError'
          ? 'Permisos de cámara denegados. Por favor, permite el acceso.'
          : 'No se pudo acceder a la cámara. Verifica los permisos o usa HTTPS'
      );
    }
  };

  const cerrarCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCamaraAbierta(false);
  };

  const tomarFoto = () => {
    if (!streamRef.current) {
      alertaError('Error', 'Primero abre la cámara');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      alertaError('Error', 'Error al acceder al video o canvas');
      return;
    }

    // Verificar que el video tenga dimensiones válidas
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      alertaError('Error', 'La cámara aún no está lista. Espera un momento e intenta de nuevo');
      return;
    }

    // Verificar que el video esté reproduciendo
    if (video.paused || video.readyState < 2) {
      alertaError('Error', 'El video no está listo. Espera un momento');
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    console.log('[DEBUG] Capturando foto - Dimensiones:', width, 'x', height);
    console.log('[DEBUG] Video readyState:', video.readyState);
    console.log('[DEBUG] Video paused:', video.paused);

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    // Limpiar el canvas antes de dibujar
    ctx.clearRect(0, 0, width, height);

    // Dibujar el frame del video en el canvas
    ctx.drawImage(video, 0, 0, width, height);

    // Convertir canvas a Blob y luego a File
    canvas.toBlob((blob) => {
      if (blob && blob.size > 0) {
        console.log('[DEBUG] Blob creado:', blob.size, 'bytes');
        const timestamp = Date.now();
        const file = new File([blob], `foto-${timestamp}.jpg`, { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);

        setFotos([...fotos, url]);
        setFotosArchivos([...fotosArchivos, file]);

        // Cerrar cámara después de tomar la foto
        cerrarCamara();

        alertaExito('¡Foto capturada!', 'Foto agregada exitosamente');
      } else {
        console.error('[DEBUG] Blob vacío o nulo');
        alertaError('Error', 'No se pudo crear la imagen. El video podría estar en negro');
      }
    }, 'image/jpeg', 0.95);
  };

  // Cleanup: cerrar cámara al desmontar componente
  useEffect(() => {
    return () => {
      cerrarCamara();
      // Liberar URLs de objetos
      fotos.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const handleEnviar = async () => {
    if (!roomId) {
      alertaError('Error', 'No se pudo identificar la habitación');
      return;
    }

    if (!titulo.trim()) {
      alertaError('Falta título', 'Por favor ingresa un título para la incidencia');
      return;
    }

    if (!descripcion.trim()) {
      alertaError('Falta descripción', 'Por favor describe la incidencia');
      return;
    }

    alertaCargando('Reportando incidencia...', 'Guardando información y fotos');

    const { data, error, isQueued, offlineMode } = await OfflineIncidentService.createIncidentWithFiles({
      roomId,
      title: titulo,
      description: descripcion,
      photos: fotosArchivos
    });

    Swal.close();

    if (!error) {
      if (offlineMode || isQueued) {
        alertaExito(
          '¡Incidencia Guardada!',
          'Se guardó localmente y se enviará cuando haya conexión. La habitación quedará bloqueada al sincronizar.'
        );
      } else {
        alertaExito(
          '¡Incidencia Reportada!',
          'La habitación ha sido bloqueada y el admin fue notificado'
        );
      }
      // Liberar URLs de objetos
      fotos.forEach(url => URL.revokeObjectURL(url));
      navigate(-1);
    } else {
      alertaError('Error', error?.message || 'No se pudo reportar la incidencia');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-lg bg-gradient-to-r from-gray-100 to-gray-200">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-black" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-black">Reportar Incidencia</h2>
          <p className="text-xs text-gray-800">Habitación {roomNumber}</p>
        </div>
      </div>

      

      {/* Input oculto para archivos */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/jpg,image/png"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Canvas oculto para capturar fotos */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="p-4 space-y-6">
        {/* Título */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <label className="block text-sm font-bold text-gray-900 mb-3">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Fuga de agua en baño, TV dañada, etc."
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            maxLength={150}
          />
          <p className="text-xs text-gray-500 mt-2">
            Un título breve y descriptivo del problema
          </p>
        </div>

        {/* Descripción */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <label className="block text-sm font-bold text-gray-900 mb-3">
            Descripción de la Incidencia <span className="text-red-500">*</span>
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe detalladamente el problema encontrado..."
            rows={5}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-500 mt-2">
            Sé específico: tipo de daño, ubicación, urgencia, etc.
          </p>
        </div>

        {/* Fotos */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-gray-900">
              Fotos (Opcional - Máximo 3)
            </label>
            <span className="text-xs text-gray-500 font-medium">{fotos.length}/3</span>
          </div>

          {/* Vista de cámara */}
          {camaraAbierta && (
            <div className="mb-4 space-y-3">
              <div className="relative w-full bg-black rounded-xl overflow-hidden" style={{ minHeight: '300px' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full"
                  style={{
                    maxHeight: '500px',
                    minHeight: '300px',
                    objectFit: 'cover',
                    transform: 'scaleX(1)' // Asegurar que no esté volteado
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={tomarFoto}
                  className="flex-1 py-3 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#2563eb' }}
                >
                  <Camera className="w-5 h-5" />
                  Capturar Foto
                </button>
                <button
                  onClick={cerrarCamara}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Botones para agregar fotos */}
          {!camaraAbierta && fotos.length < 3 && (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50">
                <p className="text-sm font-medium text-gray-700 text-center mb-3">
                  Agrega fotos de la incidencia
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={abrirCamara}
                    type="button"
                    className="flex flex-col items-center gap-2 py-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Camera className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-xs font-medium text-blue-700">Tomar Foto</p>
                  </button>
                  <button
                    onClick={handleAgregarFoto}
                    type="button"
                    className="flex flex-col items-center gap-2 py-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Image className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-xs font-medium text-purple-700">Subir Archivo</p>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  PNG, JPG hasta 5MB - {fotos.length}/3 fotos
                </p>
              </div>
            </div>
          )}

          {!camaraAbierta && fotos.length >= 3 && (
            <div className="border-2 border-dashed border-green-300 rounded-xl p-4 bg-green-50">
              <p className="text-sm text-green-700 text-center font-medium flex items-center justify-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Máximo de fotos alcanzado (3/3)
              </p>
            </div>
          )}

          {/* Preview de fotos */}
          {fotos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
              {fotos.map((foto, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={foto}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleEliminarFoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-3 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleEnviar}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportarIncidencia;
