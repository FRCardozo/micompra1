import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const DeleteUserModal = ({ isOpen, onClose, user, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (confirmText !== 'ELIMINAR') {
      toast.error('Por favor escribe "ELIMINAR" para confirmar');
      return;
    }

    setLoading(true);

    try {
      console.log('[DeleteUserModal] Deleting user:', user.id);

      // Call Edge Function to delete user (includes auth and profile)
      const { error } = await supabase.functions.invoke('delete-user', {
        body: {
          userId: user.id
        }
      });

      if (error) {
        console.error('[DeleteUserModal] Error deleting user:', error);
        throw error;
      }

      console.log('[DeleteUserModal] User deleted successfully');
      toast.success('Usuario eliminado exitosamente');
      setConfirmText('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('[DeleteUserModal] Error:', error);
      toast.error(error.message || 'Error al eliminar usuario');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="ml-4 text-lg leading-6 font-medium text-gray-900">
                  Eliminar Usuario
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>¡Advertencia!</strong> Esta acción no se puede deshacer.
                </p>
                <p className="text-sm text-red-700 mt-2">
                  Se eliminará permanentemente:
                </p>
                <ul className="list-disc list-inside text-sm text-red-700 mt-1 ml-2">
                  <li>La cuenta de autenticación</li>
                  <li>El perfil del usuario</li>
                  <li>Toda la información asociada</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Usuario a eliminar:</strong>
                </p>
                <p className="text-sm text-gray-900 mt-1">{user.full_name}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Para confirmar, escribe <strong>ELIMINAR</strong> en el campo de abajo:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="ELIMINAR"
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || confirmText !== 'ELIMINAR'}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Eliminando...' : 'Eliminar Usuario'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;
