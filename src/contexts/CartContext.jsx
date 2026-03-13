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
            console.error('Error al cargar el carrito desde localStorage:', error);
            return [];
        }
    });

    // Sync with localStorage
    useEffect(() => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
        } catch (error) {
            console.error('Error al guardar el carrito en localStorage:', error);
        }
    }, [cartItems]);

    const addToCart = (product, quantity = 1) => {
        if (!product || !product.id) return;

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
            return [...prevItems, { ...product, quantity, addedAt: new Date().toISOString() }];
        });
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

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
