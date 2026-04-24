import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, UserPlus, LogIn, ShieldAlert } from 'lucide-react';

const AuthModal = ({ isOpen, onClose, title = "¡No te lo pierdas!", message = "Para guardar tus favoritos o hacer un pedido, necesitas una cuenta. ¡Toma solo 1 minuto!" }) => {
  const navigate = useNavigate();
  const location = useLocation(); // Lee exactamente en qué URL estamos (ej. /stores/123)

  if (!isOpen) return null;

  const goToAuth = (path) => {
    // LA MAGIA: Guardamos la ruta actual en el navegador antes de irnos
    localStorage.setItem('returnUrl', location.pathname);
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
      <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl relative">
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors z-10">
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 pt-10 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-5 shadow-inner">
            <ShieldAlert className="w-10 h-10 text-orange-500" />
          </div>
          
          <h3 className="font-black text-2xl text-gray-900 mb-2 leading-tight">{title}</h3>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed px-2">
            {message}
          </p>

          <div className="w-full space-y-3">
            <button 
              onClick={() => goToAuth('/auth/signup')} 
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all"
            >
              <UserPlus className="w-5 h-5" /> Crear mi cuenta
            </button>
            <button 
              onClick={() => goToAuth('/auth/login')} 
              className="w-full bg-white text-gray-900 border-2 border-gray-100 hover:border-gray-200 font-bold py-4 rounded-2xl shadow-sm flex items-center justify-center gap-2 transform active:scale-95 transition-all"
            >
              <LogIn className="w-5 h-5 text-gray-500" /> Ya tengo cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;