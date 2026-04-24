import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, UserCircle, UserCheck, Store, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import DocumentUpload from '../../components/auth/DocumentUpload';
import toast from 'react-hot-toast';

const Signup = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', password: '', confirmPassword: '', role: '',
  });

  const [documents, setDocuments] = useState({ idCard: null, utilityBill: null });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    { value: 'client', label: 'Cliente', icon: ShoppingBag, description: 'Realiza pedidos' },
    { value: 'delivery_driver', label: 'Domiciliario', icon: UserCheck, description: 'Entrega pedidos' },
    { value: 'store', label: 'Tienda', icon: Store, description: 'Gestiona productos' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleRoleChange = (role) => {
    setFormData((prev) => ({ ...prev, role }));
    if (errors.role) setErrors((prev) => ({ ...prev, role: '' }));
  };

  const handleDocumentsChange = (newDocuments) => setDocuments(newDocuments);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = 'El nombre es requerido';
    if (!formData.email) newErrors.email = 'El email es requerido';
    if (!formData.phone) newErrors.phone = 'El teléfono es requerido';
    if (!formData.password) newErrors.password = 'La contraseña es requerida';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
    if (!formData.role) newErrors.role = 'Debes seleccionar un rol';
    if (formData.role === 'delivery_driver' && (!documents.idCard || !documents.utilityBill)) {
      newErrors.idCard = 'Faltan documentos requeridos';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) { toast.error('Corrige los errores'); return; }
    setIsLoading(true);

    try {
      const userData = { full_name: formData.full_name.trim(), role: formData.role, phone: formData.phone };
      const { data, error } = await signUp(formData.email, formData.password, userData, formData.role === 'delivery_driver' ? documents : null);

      if (error) { toast.error('Error al crear la cuenta.'); return; }

      if (data) {
        toast.success('Cuenta creada. Inicia sesión para continuar.');
        // Nota: NO borramos el 'returnUrl' aquí. Si venía de una tienda, 
        // cuando inicie sesión se activará la magia de retorno automáticamente.
        navigate('/auth/login');
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 px-4 py-12">
      {/* BOTÓN FLOTANTE PARA VOLVER AL HOME */}
      <Link to="/" className="absolute top-6 left-6 p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-gray-100 text-gray-700 hover:text-orange-500 hover:bg-white hover:scale-105 transition-all z-50 flex items-center justify-center">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
      </Link>
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-4 shadow-lg"><UserCircle className="text-white" size={32} /></div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Crea tu cuenta</h1>
          <p className="text-gray-600">Únete a la comunidad</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="Nombre completo" type="text" name="full_name" value={formData.full_name} onChange={handleChange} error={errors.full_name} icon={User} required disabled={isLoading} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} error={errors.email} icon={Mail} required disabled={isLoading} />
              <Input label="Teléfono" type="tel" name="phone" value={formData.phone} onChange={handleChange} error={errors.phone} icon={Phone} required disabled={isLoading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Contraseña" type="password" name="password" value={formData.password} onChange={handleChange} error={errors.password} icon={Lock} required disabled={isLoading} />
              <Input label="Confirmar contraseña" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} icon={Lock} required disabled={isLoading} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Selecciona tu rol <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isSelected = formData.role === role.value;
                  return (
                    <button key={role.value} type="button" onClick={() => handleRoleChange(role.value)} disabled={isLoading} className={`p-6 rounded-xl border-2 transition-all duration-200 text-center ${isSelected ? 'border-orange-500 bg-orange-50 shadow-lg' : 'border-gray-200 hover:border-orange-300 bg-white'}`}>
                      <Icon className={`mx-auto mb-3 ${isSelected ? 'text-orange-500' : 'text-gray-400'}`} size={32} />
                      <p className={`text-base font-semibold mb-1 ${isSelected ? 'text-orange-900' : 'text-gray-700'}`}>{role.label}</p>
                      <p className={`text-sm ${isSelected ? 'text-orange-600' : 'text-gray-500'}`}>{role.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {formData.role === 'delivery_driver' && <div className="pt-2"><DocumentUpload onDocumentsChange={handleDocumentsChange} disabled={isLoading} /></div>}

            <div className="flex items-start mt-4">
              <input type="checkbox" id="terms" required className="w-4 h-4 mt-1 text-orange-500 border-gray-300 rounded focus:ring-orange-500" />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">Acepto los <Link to="/terms" className="text-orange-500 hover:text-orange-600 font-medium">términos y condiciones</Link></label>
            </div>

            <Button type="submit" variant="primary" fullWidth disabled={isLoading} className="bg-orange-500 hover:bg-orange-600 focus:ring-orange-500 mt-6">
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-600">¿Ya tienes una cuenta? <Link to="/auth/login" className="text-orange-500 hover:text-orange-600 font-semibold transition-colors">Inicia sesión aquí</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;