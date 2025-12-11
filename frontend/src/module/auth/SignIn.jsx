import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import { useFormik } from 'formik';
import AuthContext from '../../config/context/auth-context';
import { AuthService } from '../../config/http-gateway';
import { alertaError, alertaExito, alertaCargando } from '../../config/context/alerts';
import { requestNotificationPermission } from '../../services/firebase-notification-service';

const SignIn = () => {
    const [showPassword, setShowPassword] = useState(false);
    const { dispatch } = useContext(AuthContext);
    const navigate = useNavigate();

    const formik = useFormik({
        initialValues: {
            email: '',
            password: '',
        },
        validationSchema: yup.object({
            email: yup.string()
                .email('Formato de correo inválido')
                .required('El correo es obligatorio'),
            password: yup.string()
                .min(6, 'La contraseña debe tener al menos 6 caracteres')
                .required('La contraseña es obligatoria'),
        }),
        onSubmit: async (values, { setSubmitting }) => {
            try {
                alertaCargando('Iniciando sesión', 'Por favor espera...');

                const { data, error } = await AuthService.login({
                    email: values.email,
                    password: values.password
                });

                if (error) {
                    console.error('Error al iniciar sesión:', error);
                    alertaError('Error de autenticación', error?.message || 'Verifica tus credenciales e intenta nuevamente.');
                    setSubmitting(false);
                    return;
                }

                const { access_token, user } = data;

                if (!user || !user.rol) {
                    alertaError('Error', 'No se recibió información del usuario');
                    setSubmitting(false);
                    return;
                }

                const authData = {
                    token: access_token,
                    user: user,
                    signed: true
                };

                dispatch({
                    type: 'SIGNIN',
                    payload: authData,
                });

                localStorage.setItem('token', access_token);
                localStorage.setItem('user', JSON.stringify(authData));

                alertaExito('¡Bienvenido!', `Hola ${user.name}`);

                // Solicitar permisos de notificación y registrar FCM token
                setTimeout(async () => {
                    try {
                        await requestNotificationPermission();
                    } catch (error) {
                        console.error('[Firebase] Error al solicitar permisos de notificación:', error);
                    }
                }, 500);

                setTimeout(() => {
                    const redirectTo = user.rol === 'ADMIN_ROLE' ? '/admin/mobile' : '/user/mobile';
                    navigate(redirectTo, { replace: true });
                }, 1500);

            } catch (error) {
                console.error('Error inesperado al iniciar sesión:', error);
                alertaError('Error inesperado', 'Ocurrió un error al procesar tu solicitud. Intenta nuevamente.');
            } finally {
                setSubmitting(false);
            }
        }
    });

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#e5f0fe' }}>
            <div className="w-full max-w-md">
                {/* Card principal */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Header con gradiente */}
                    <div className="bg-gradient-to-r from-blue-100 to-blue-200 px-8 pt-8 pb-6">
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-24 bg-white rounded-2xl shadow-lg p-3 mb-4">
                                <img src="/imgs/logo.svg" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <h1 className="text-3xl font-bold text-black mb-2">Hola papirrin :v</h1>
                            <p className="text-gray-800 text-sm">Inicia sesión para continuar</p>
                        </div>
                    </div>

                    {/* Formulario */}
                    <div className="px-8 py-8">
                        <form onSubmit={formik.handleSubmit} className="space-y-5">
                            {/* Campo Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Correo Electrónico
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                        </svg>
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="tucorreo@ejemplo.com"
                                        value={formik.values.email}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-400"
                                    />
                                </div>
                                {formik.touched.email && formik.errors.email && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {formik.errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Campo Contraseña */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                        className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-blue-600 transition-colors"
                                    >
                                        {showPassword ? (
                                            <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {formik.touched.password && formik.errors.password && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {formik.errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Botón de submit */}
                            <button
                                type="submit"
                                disabled={formik.isSubmitting || !formik.isValid}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg flex items-center justify-center gap-2"
                            >
                                {formik.isSubmitting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Ingresando...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Iniciar Sesión</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SignIn;
