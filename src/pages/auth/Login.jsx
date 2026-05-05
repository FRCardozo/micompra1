import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBranding } from '../../hooks/useBranding';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import BrandedTitle from '../../components/common/BrandedTitle';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { branding } = useBranding();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'El email es requerido';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'El email no es válido';
    if (!formData.password) newErrors.password = 'La contraseña es requerida';
    else if (formData.password.length < 6) newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const { data, error } = await signIn(formData.email, formData.password);

      if (error) {
        toast.error('Error al iniciar sesión. Verifica tus credenciales.');
        return;
      }

      if (data) {
        // --- LA MAGIA DE RETORNO ---
        const returnUrl = localStorage.getItem('returnUrl');
        if (returnUrl) {
          localStorage.removeItem('returnUrl'); // Limpiamos la memoria
          navigate(returnUrl); // Lo devolvemos a la tienda o producto
        } else {
          navigate('/'); // Si entró normal, va al Home
        }
        // ---------------------------
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const primaryColor = branding?.colors?.primary || '#FF6B35';

  return (
    <>
      <BrandedTitle suffix="Iniciar Sesión" />
      <div
        className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ background: `linear-gradient(135deg, ${primaryColor}15, white, ${primaryColor}15)` }}
      >
        {/* BOTÓN FLOTANTE PARA VOLVER AL HOME */}
      <Link to="/" className="absolute top-6 left-6 p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-gray-100 text-gray-700 hover:text-orange-500 hover:bg-white hover:scale-105 transition-all z-50 flex items-center justify-center">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
      </Link>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            {branding?.logoUrl ? (
              <div className="inline-flex items-center justify-center mb-4">
                <img src={branding.logoUrl} alt="Logo" className="h-20 object-contain" />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg" style={{ backgroundColor: primaryColor }}>
                <LogIn className="text-white" size={32} />
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido a {branding?.appName || 'MiCompra'}</h1>
            <p className="text-gray-600">Inicia sesión para continuar</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input label="Email" type="email" name="email" placeholder="tu@email.com" value={formData.email} onChange={handleChange} error={errors.email} icon={Mail} required disabled={isLoading} />
              <Input label="Contraseña" type="password" name="password" placeholder="Tu contraseña" value={formData.password} onChange={handleChange} error={errors.password} icon={Lock} required disabled={isLoading} />

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 border-gray-300 rounded" style={{ color: primaryColor, accentColor: primaryColor }} />
                  <span className="ml-2 text-gray-600">Recordarme</span>
                </label>
                <Link to="/auth/forgot-password" className="font-medium transition-colors" style={{ color: primaryColor }}>¿Olvidaste tu contraseña?</Link>
              </div>

              <Button type="submit" variant="primary" fullWidth disabled={isLoading} className="mt-6" style={{ backgroundColor: primaryColor, borderColor: primaryColor }}>
                {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-500">o</span></div>
            </div>

            <div className="text-center">
              <p className="text-gray-600">¿No tienes una cuenta? <Link to="/auth/signup" className="font-semibold transition-colors" style={{ color: primaryColor }}>Regístrate aquí</Link></p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;