import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserCheck, Store, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

const RoleSelector = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    {
      value: 'client',
      label: 'Cliente',
      icon: User,
      description: 'Realiza pedidos y compra productos',
      color: 'blue',
      features: [
        'Realiza pedidos',
        'Rastrea entregas',
        'Guarda favoritos',
        'Historial de pedidos',
      ],
    },
    {
      value: 'delivery',
      label: 'Domiciliario',
      icon: UserCheck,
      description: 'Entrega pedidos a los clientes',
      color: 'green',
      features: [
        'Acepta pedidos',
        'Navegación GPS',
        'Gana comisiones',
        'Gestiona entregas',
      ],
    },
    {
      value: 'store',
      label: 'Tienda',
      icon: Store,
      description: 'Gestiona productos y ventas',
      color: 'purple',
      features: [
        'Gestiona inventario',
        'Recibe pedidos',
        'Analíticas de ventas',
        'Gestión de productos',
      ],
    },
    {
      value: 'super_admin',
      label: 'Super Admin',
      icon: Shield,
      description: 'Administrador del sistema',
      color: 'red',
      features: [
        'Control total',
        'Gestión de usuarios',
        'Analíticas globales',
        'Configuración del sistema',
      ],
    },
  ];

  const getColorClasses = (color, isSelected) => {
    const colors = {
      blue: {
        border: isSelected ? 'border-blue-500' : 'border-gray-200 hover:border-blue-300',
        bg: isSelected ? 'bg-blue-50' : 'bg-white',
        icon: isSelected ? 'text-blue-500' : 'text-gray-400',
        text: isSelected ? 'text-blue-900' : 'text-gray-700',
        subtext: isSelected ? 'text-blue-600' : 'text-gray-500',
      },
      green: {
        border: isSelected ? 'border-green-500' : 'border-gray-200 hover:border-green-300',
        bg: isSelected ? 'bg-green-50' : 'bg-white',
        icon: isSelected ? 'text-green-500' : 'text-gray-400',
        text: isSelected ? 'text-green-900' : 'text-gray-700',
        subtext: isSelected ? 'text-green-600' : 'text-gray-500',
      },
      purple: {
        border: isSelected ? 'border-purple-500' : 'border-gray-200 hover:border-purple-300',
        bg: isSelected ? 'bg-purple-50' : 'bg-white',
        icon: isSelected ? 'text-purple-500' : 'text-gray-400',
        text: isSelected ? 'text-purple-900' : 'text-gray-700',
        subtext: isSelected ? 'text-purple-600' : 'text-gray-500',
      },
      red: {
        border: isSelected ? 'border-red-500' : 'border-gray-200 hover:border-red-300',
        bg: isSelected ? 'bg-red-50' : 'bg-white',
        icon: isSelected ? 'text-red-500' : 'text-gray-400',
        text: isSelected ? 'text-red-900' : 'text-gray-700',
        subtext: isSelected ? 'text-red-600' : 'text-gray-500',
      },
    };
    return colors[color];
  };

  const handleRoleSelect = (roleValue) => {
    setSelectedRole(roleValue);
  };

  const handleContinue = async () => {
    if (!selectedRole) {
      toast.error('Por favor selecciona un rol');
      return;
    }

    setIsLoading(true);

    try {
      // Update user profile with selected role
      const { error } = await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Rol actualizado exitosamente');

      // Refresh profile to get updated data
      await refreshProfile();

      // Navigate to appropriate dashboard
      navigate('/');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Error al actualizar el rol. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 px-4 py-12">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl mb-6 shadow-lg">
            <Shield className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Elige tu rol
          </h1>
          <p className="text-lg text-gray-600">
            Selecciona cómo deseas usar la plataforma
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.value;
            const colors = getColorClasses(role.color, isSelected);

            return (
              <button
                key={role.value}
                type="button"
                onClick={() => handleRoleSelect(role.value)}
                disabled={isLoading}
                className={`
                  relative p-6 rounded-2xl border-2 transition-all duration-200 text-left
                  ${colors.border} ${colors.bg}
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transform hover:scale-105 hover:shadow-xl
                `}
              >
                {/* Selected Badge */}
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className={`w-6 h-6 rounded-full ${colors.icon} bg-current flex items-center justify-center`}>
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Icon and Title */}
                <div className="flex items-start mb-4">
                  <div className={`p-3 rounded-xl ${isSelected ? colors.bg : 'bg-gray-50'} mr-4`}>
                    <Icon className={colors.icon} size={32} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold ${colors.text} mb-1`}>
                      {role.label}
                    </h3>
                    <p className={`text-sm ${colors.subtext}`}>
                      {role.description}
                    </p>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  {role.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <svg className={`w-4 h-4 mr-2 ${colors.icon}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedRole || isLoading}
            variant="primary"
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 focus:ring-orange-500 active:bg-orange-700 min-w-[200px]"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Actualizando...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                Continuar
                <ArrowRight className="ml-2" size={20} />
              </span>
            )}
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Puedes cambiar tu rol más tarde desde la configuración de tu cuenta
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;
