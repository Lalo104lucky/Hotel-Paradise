import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Search, Users, UserCheck, UserX, X, Eye, EyeOff } from 'lucide-react';
import { UserService, AuthService } from '../../config/http-gateway';
import { alertaError, alertaExito, alertaCargando } from '../../config/context/alerts';
import * as yup from 'yup';
import { useFormik } from 'formik';

const Camareras = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'
    const [camareras, setCamareras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        fetchCamareras();
    }, []);

    const fetchCamareras = async () => {
        try {
            setLoading(true);
            const { data, error } = await UserService.getUsersByRole('CAMARERA');
            
            if (error) {
                console.error('Error al obtener camareras:', error);
                alertaError('Error', 'No se pudieron cargar las camareras');
                return;
            }

            setCamareras(data || []);
        } catch (error) {
            console.error('Error inesperado:', error);
            alertaError('Error', 'Ocurrió un error al cargar los datos');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            alertaCargando('Actualizando estado', 'Por favor espera...');
            
            const newStatus = !currentStatus;
            const { data, error } = await UserService.updateUserStatus(id, newStatus);

            if (error) {
                console.error('Error al actualizar estado:', error);
                alertaError('Error', 'No se pudo actualizar el estado');
                return;
            }

            setCamareras(camareras.map(camarera => 
                camarera.id === id 
                    ? { ...camarera, status: newStatus }
                    : camarera
            ));

            alertaExito('¡Actualizado!', `Estado cambiado a ${newStatus ? 'activa' : 'inactiva'}`);
        } catch (error) {
            console.error('Error inesperado:', error);
            alertaError('Error', 'Ocurrió un error al actualizar');
        }
    };

    const formik = useFormik({
        initialValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: ''
        },
        validationSchema: yup.object({
            name: yup.string()
                .min(3, 'El nombre debe tener al menos 3 caracteres')
                .max(50, 'El nombre no puede exceder 50 caracteres')
                .required('El nombre es obligatorio'),
            email: yup.string()
                .email('Formato de correo inválido')
                .required('El correo es obligatorio'),
            password: yup.string()
                .min(6, 'La contraseña debe tener al menos 6 caracteres')
                .required('La contraseña es obligatoria'),
            confirmPassword: yup.string()
                .oneOf([yup.ref('password'), null], 'Las contraseñas no coinciden')
                .required('Confirma tu contraseña')
        }),
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            try {
                alertaCargando('Registrando camarera', 'Por favor espera...');

                const { data, error } = await AuthService.register({
                    name: values.name,
                    email: values.email,
                    password: values.password,
                });

                if (error) {
                    console.error('Error al registrar:', error);
                    alertaError('Error de registro', error?.message || 'No se pudo completar el registro.');
                    setSubmitting(false);
                    return;
                }

                alertaExito('¡Registro exitoso!', `${values.name} ha sido registrada correctamente.`);
                resetForm();
                setShowRegisterModal(false);
                setShowPassword(false);
                fetchCamareras();

            } catch (error) {
                console.error('Error inesperado al registrar:', error);
                alertaError('Error inesperado', 'Ocurrió un error al procesar el registro.');
            } finally {
                setSubmitting(false);
            }
        }
    });

    const filteredCamareras = camareras.filter(camarera => {
        const matchesSearch = camarera.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            camarera.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || 
                            (filterStatus === 'active' && camarera.status) ||
                            (filterStatus === 'inactive' && !camarera.status);
        return matchesSearch && matchesStatus;
    });

    const activeCount = camareras.filter(c => c.status).length;
    const inactiveCount = camareras.filter(c => !c.status).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4 pb-24">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Personal</h1>
                        <p className="text-sm text-gray-500 mt-1">Gestión de camareras</p>
                    </div>
                    <button
                        onClick={() => setShowRegisterModal(true)}
                        className="bg-gradient-to-r from-green-600 to-green-700 text-white p-2.5 rounded-xl shadow-lg hover:from-green-700 hover:to-green-800 hover:-translate-y-0.5 transition-all duration-200"
                    >
                        <UserPlus className="w-6 h-6" />
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-white rounded-2xl p-4 shadow-md border-l-4 border-blue-500"> 
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-gray-600">Total</p>
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{camareras.length}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-md border-l-4 border-green-500">
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-gray-600">Activas</p>
                                <UserCheck className="w-6 h-6 text-green-600" />
                            </div>
                            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-md border-l-4 border-red-500">
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-gray-600">Inactivas</p>
                                <UserX className="w-6 h-6 text-red-600" />
                            </div>
                            <p className="text-2xl font-bold text-red-600">{inactiveCount}</p>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar camarera..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all duration-200"
                    />
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                            filterStatus === 'all'
                                ? 'text-white'
                                : 'bg-white text-gray-600 border border-gray-200'
                        }`}
                        style={filterStatus === 'all' ? { backgroundColor: '#2563eb' } : {}}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setFilterStatus('active')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                            filterStatus === 'active'
                                ? 'bg-green-600 text-white'
                                : 'bg-white text-gray-600 border border-gray-200'
                        }`}
                    >
                        Activas
                    </button>
                    <button
                        onClick={() => setFilterStatus('inactive')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                            filterStatus === 'inactive'
                                ? 'bg-red-600 text-white'
                                : 'bg-white text-gray-600 border border-gray-200'
                        }`}
                    >
                        Inactivas
                    </button>
                </div>
            </div>

            {/* Lista de Camareras */}
            <div className="space-y-3">
                {filteredCamareras.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No se encontraron camareras</p>
                    </div>
                ) : (
                    filteredCamareras.map((camarera) => {
                        // Formatear nombre para mostrar solo primer nombre y primer apellido
                        const formatName = (fullName) => {
                            if (!fullName) return 'Sin nombre';
                            const nameParts = fullName.trim().split(/\s+/);
                            if (nameParts.length >= 2) {
                                return `${nameParts[0]} ${nameParts[1]}`;
                            }
                            return nameParts[0];
                        };

                        return (
                        <div
                            key={camarera.id}
                            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        camarera.status ? 'bg-green-100' : 'bg-red-100'
                                    }`}>
                                        <span className={`text-lg font-bold ${
                                            camarera.status ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {camarera.name?.charAt(0) || 'U'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-800 truncate">{formatName(camarera.name)}</h3>
                                        <p className="text-sm text-gray-500 truncate">{camarera.email || 'Sin email'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleStatus(camarera.id, camarera.status)}
                                    className={`ml-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 flex-shrink-0 ${
                                        camarera.status
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-300'
                                            : 'bg-red-100 text-red-700 hover:bg-red-200 border-2 border-red-300'
                                    }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${
                                        camarera.status ? 'bg-green-600' : 'bg-red-600'
                                    }`}></span>
                                    {camarera.status ? 'Activa' : 'Inactiva'}
                                </button>
                            </div>
                        </div>
                        );
                    })
                )}
            </div>

            {/* Modal de Registro */}
            {showRegisterModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                            <h2 className="text-xl font-bold text-gray-800">Registrar Camarera</h2>
                            <button
                                onClick={() => {
                                    setShowRegisterModal(false);
                                    formik.resetForm();
                                    setShowPassword(false);
                                    setShowConfirmPassword(false);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        <div className="p-6">
                            <form onSubmit={formik.handleSubmit} className="space-y-4">
                                {/* Campo Nombre */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre Completo
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            placeholder="María García"
                                            value={formik.values.name}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        />
                                    </div>
                                    {formik.touched.name && formik.errors.name && (
                                        <p className="mt-2 text-sm text-red-600">{formik.errors.name}</p>
                                    )}
                                </div>

                                {/* Campo Email */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                        Correo Electrónico
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                            </svg>
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="correo@ejemplo.com"
                                            value={formik.values.email}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        />
                                    </div>
                                    {formik.touched.email && formik.errors.email && (
                                        <p className="mt-2 text-sm text-red-600">{formik.errors.email}</p>
                                    )}
                                </div>

                                {/* Campo Contraseña */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                        Contraseña
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={formik.values.password}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-blue-600 transition-colors"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5 text-gray-500" />
                                            ) : (
                                                <Eye className="h-5 w-5 text-gray-500" />
                                            )}
                                        </button>
                                    </div>
                                    {formik.touched.password && formik.errors.password && (
                                        <p className="mt-2 text-sm text-red-600">{formik.errors.password}</p>
                                    )}
                                </div>

                                {/* Campo Confirmar Contraseña */}
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirmar Contraseña
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={formik.values.confirmPassword}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-blue-600 transition-colors"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-5 w-5 text-gray-500" />
                                            ) : (
                                                <Eye className="h-5 w-5 text-gray-500" />
                                            )}
                                        </button>
                                    </div>
                                    {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                                        <p className="mt-2 text-sm text-red-600">{formik.errors.confirmPassword}</p>
                                    )}
                                </div>

                                {/* Botones */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowRegisterModal(false);
                                            formik.resetForm();
                                            setShowPassword(false);
                                            setShowConfirmPassword(false);
                                        }}
                                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={formik.isSubmitting || !formik.isValid}
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {formik.isSubmitting ? 'Registrando...' : 'Registrar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Camareras;
