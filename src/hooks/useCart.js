import { useCartContext } from '../contexts/CartContext';

/**
 * Hook personalizado para manejar el carrito de compras
 * Ahora consume el estado global desde CartContext
 * @returns {Object} Funciones y estado del carrito
 */
const useCart = () => {
  return useCartContext();
};

export default useCart;
