import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, UserCircle, UserCheck, Store, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import DocumentUpload from '../../components/auth/DocumentUpload';
import toast from 'react-hot-toast';

const Signup = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  console.log('[Signup] Component rendered - role selection should be visible');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: '',
  });

  const [documents, setDocuments] = useState({
    idCard: null,
    utilityBill: null,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    { value: 'client', label: 'Cliente', icon: ShoppingBag, description: 'Realiza pedidos' },
    { value: 'delivery_driver', label: 'Domiciliario', icon: UserCheck, description: 'Entrega pedidos' },
    { value: 'store', label: 'Tienda', icon: Store, description: 'Gestiona productos' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleRoleChange = (role) => {
    console.log('[Signup] Role selected:', role);
    setFormData((prev) => ({
      ...prev,
      role,
    }));
    if (errors.role) {
      setErrors((prev) => ({
        ...prev,
        role: '',
      }));
    }
  };

  const handleDocumentsChange = (newDocuments) => {
    console.log('[Signup] Documents updated:', newDocuments);
    setDocuments(newDocuments);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'El nombre completo es requerido';
    } else if (formData.full_name.trim().length < 3) {
      newErrors.full_name = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.phone) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
      newErrors.phone = 'El teléfono debe tener 10 dígitos';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Debes confirmar la contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.role) {
      newErrors.role = 'Debes seleccionar un rol';
    }

    // Validate documents for delivery drivers
    if (formData.role === 'delivery_driver') {
      if (!documents.idCard) {
        newErrors.idCard = 'La copia de cédula es requerida';
      }
      if (!documents.utilityBill) {
        newErrors.utilityBill = 'El recibo de servicio es requerido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor corrige los errores del formulario');
      return;
    }

    setIsLoading(true);

    try {
      const userData = {
        full_name: formData.full_name.trim(),
        role: formData.role,
        phone: formData.phone,
      };

      console.log('[Signup] Starting registration for role:', formData.role);

      const { data, error } = await signUp(
        formData.email,
        formData.password,
        userData,
        formData.role === 'delivery_driver' ? documents : null
      );

      if (error) {
        console.error('[Signup] Registration error:', error);
        toast.error('Error al crear la cuenta. Intenta de nuevo.');
        return;
      }

      if (data) {
        console.log('[Signup] Registration successful');
        toast.success('Cuenta creada. Revisa tu email para confirmar.');
        navigate('/auth/login');
      }
    } catch (error) {
      console.error('[Signup] Unexpected error:', error);
      toast.error('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-4 shadow-lg">
            <UserCircle className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Crea tu cuenta
          </h1>
          <p className="text-gray-600">
            Únete a la comunidad Rappi
          </p>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <Input
              label="Nombre completo"
              type="text"
              name="full_name"
              placeholder="Juan Pérez"
              value={formData.full_name}
              onChange={handleChange}
              error={errors.full_name}
              icon={User}
              required
              disabled={isLoading}
            />

            {/* Email and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                name="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                icon={Mail}
                required
                disabled={isLoading}
              />

              <Input
                label="Teléfono"
                type="tel"
                name="phone"
                placeholder="3001234567"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                icon={Phone}
                required
                disabled={isLoading}
              />
            </div>

            {/* Password and Confirm Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Contraseña"
                type="password"
                name="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                icon={Lock}
                required
                disabled={isLoading}
              />

              <Input
                label="Confirmar contraseña"
                type="password"
                name="confirmPassword"
                placeholder="Repite tu contraseña"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                icon={Lock}
                required
                disabled={isLoading}
              />
            </div>

            {/* Role Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Selecciona tu rol <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isSelected = formData.role === role.value;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => handleRoleChange(role.value)}
                      disabled={isLoading}
                      className={`
                        p-6 rounded-xl border-2 transition-all duration-200 text-center
                        ${isSelected
                          ? 'border-orange-500 bg-orange-50 shadow-lg'
                          : 'border-gray-200 hover:border-orange-300 bg-white hover:shadow-md'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      <Icon
                        className={`mx-auto mb-3 ${
                          isSelected ? 'text-orange-500' : 'text-gray-400'
                        }`}
                        size={32}
                      />
                      <p className={`text-base font-semibold mb-1 ${
                        isSelected ? 'text-orange-900' : 'text-gray-700'
                      }`}>
                        {role.label}
                      </p>
                      <p className={`text-sm ${
                        isSelected ? 'text-orange-600' : 'text-gray-500'
                      }`}>
                        {role.description}
                      </p>
                    </button>
                  );
                })}
              </div>
              {errors.role && (
                <p className="mt-2 text-sm text-red-600">{errors.role}</p>
              )}
            </div>

            {/* Document Upload for Delivery Drivers */}
            {formData.role === 'delivery_driver' && (
              <div className="pt-2">
                <DocumentUpload
                  onDocumentsChange={handleDocumentsChange}
                  disabled={isLoading}
                />
                {(errors.idCard || errors.utilityBill) && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.idCard || errors.utilityBill}
                  </p>
                )}
              </div>
            )}

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                required
                className="w-4 h-4 mt-1 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                Acepto los{' '}
                <Link to="/terms" className="text-orange-500 hover:text-orange-600 font-medium">
                  términos y condiciones
                </Link>{' '}
                y la{' '}
                <Link to="/privacy" className="text-orange-500 hover:text-orange-600 font-medium">
                  política de privacidad
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600 focus:ring-orange-500 active:bg-orange-700 mt-6"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando cuenta...
                </span>
              ) : (
                'Crear cuenta'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">o</span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link
                to="/auth/login"
                className="text-orange-500 hover:text-orange-600 font-semibold transition-colors"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
