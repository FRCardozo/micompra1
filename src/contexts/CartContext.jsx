import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCartContext = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCartContext must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const CART_STORAGE_KEY = 'rappi_cart';

    const [cartItems, setCartItems] = useState(() => {
        try {
            const storedCart = localStorage.getItem(CART_STORAGE_KEY);
            return storedCart ? JSON.parse(storedCart) : [];
        } catch (error) {
            console.error('Error al cargar el carrito:', error);
            return [];
        }
    });

    // Estados para el Modal de Conflicto Multitienda
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [pendingProduct, setPendingProduct] = useState(null);

    useEffect(() => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
        } catch (error) {
            console.error('Error al guardar el carrito:', error);
        }
    }, [cartItems]);

    const addToCart = (product, quantity = 1) => {
        if (!product || !product.id) return;

        const incomingStoreId = product.store_id || (product.store && product.store.id);

        // CANDADO MULTITIENDA CON MODAL PROFESIONAL
        if (cartItems.length > 0 && incomingStoreId) {
            const hasDifferentStore = cartItems.some(item => {
                const currentItemStoreId = item.store_id || (item.store && item.store.id);
                return currentItemStoreId && currentItemStoreId !== incomingStoreId;
            });

            if (hasDifferentStore) {
                // Pausamos el producto y mostramos nuestro modal personalizado
                setPendingProduct({ product, incomingStoreId, quantity });
                setShowConflictModal(true);
                return; // Bloqueamos la ejecución aquí
            }
        }

        // Flujo normal si es la misma tienda
        setCartItems((prevItems) => {
            const existingItemIndex = prevItems.findIndex((item) => item.id === product.id);
            if (existingItemIndex !== -1) {
                const updatedItems = [...prevItems];
                updatedItems[existingItemIndex] = {
                    ...updatedItems[existingItemIndex],
                    quantity: updatedItems[existingItemIndex].quantity + quantity,
                };
                return updatedItems;
            }
            return [...prevItems, { ...product, store_id: incomingStoreId, quantity, addedAt: new Date().toISOString() }];
        });
    };

    // Funciones del Modal
    const confirmClearAndAdd = () => {
        if (pendingProduct) {
            setCartItems([{ 
                ...pendingProduct.product, 
                store_id: pendingProduct.incomingStoreId, 
                quantity: pendingProduct.quantity, 
                addedAt: new Date().toISOString() 
            }]);
        }
        setShowConflictModal(false);
        setPendingProduct(null);
    };

    const cancelConflict = () => {
        setShowConflictModal(false);
        setPendingProduct(null);
    };

    const removeFromCart = (productId) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCartItems((prevItems) =>
            prevItems.map((item) => (item.id === productId ? { ...item, quantity: newQuantity } : item))
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const getTotalItems = () => cartItems.reduce((total, item) => total + item.quantity, 0);
    const getTotalPrice = () => cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const isInCart = (productId) => cartItems.some((item) => item.id === productId);
    const getItemQuantity = (productId) => {
        const item = cartItems.find((item) => item.id === productId);
        return item ? item.quantity : 0;
    };

    const value = {
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        isInCart,
        getItemQuantity,
    };

    return (
        <CartContext.Provider value={value}>
            {children}

            {/* MODAL PROFESIONAL MULTITIENDA */}
            {showConflictModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900 bg-opacity-60 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl transform transition-all animate-in fade-in zoom-in-95 duration-200">
                        
                        {/* Icono animado/llamativo */}
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🛒</span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                            ¿Empezar nueva cotización?
                        </h3>
                        
                        <p className="text-gray-600 text-center text-sm mb-6">
                            Tu lista actual tiene productos de otro comercio. Por logística, debes pedir de un negocio a la vez. ¿Deseas vaciar tu lista actual?
                        </p>

                        <div className="flex flex-col space-y-3">
                            <button
                                onClick={confirmClearAndAdd}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-md"
                            >
                                Sí, vaciar y agregar
                            </button>
                            <button
                                onClick={cancelConflict}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </CartContext.Provider>
    );
};