import React, { createContext, useContext, useReducer, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM':
      const existingItem = state.items.find(
        item => item.id === action.payload.id && 
        JSON.stringify(item.customizations) === JSON.stringify(action.payload.customizations)
      );

      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id && 
            JSON.stringify(item.customizations) === JSON.stringify(action.payload.customizations)
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
          total: state.total + (action.payload.price * action.payload.quantity),
          itemCount: state.itemCount + action.payload.quantity,
        };
      } else {
        return {
          ...state,
          items: [...state.items, action.payload],
          total: state.total + (action.payload.price * action.payload.quantity),
          itemCount: state.itemCount + action.payload.quantity,
        };
      }

    case 'REMOVE_ITEM':
      const itemToRemove = state.items.find(
        item => item.id === action.payload.id && 
        JSON.stringify(item.customizations) === JSON.stringify(action.payload.customizations)
      );

      return {
        ...state,
        items: state.items.filter(item =>
          !(item.id === action.payload.id && 
            JSON.stringify(item.customizations) === JSON.stringify(action.payload.customizations))
        ),
        total: state.total - (itemToRemove.price * itemToRemove.quantity),
        itemCount: state.itemCount - itemToRemove.quantity,
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item => {
          if (item.id === action.payload.id && 
              JSON.stringify(item.customizations) === JSON.stringify(action.payload.customizations)) {
            const quantityDiff = action.payload.quantity - item.quantity;
            return {
              ...item,
              quantity: action.payload.quantity,
            };
          }
          return item;
        }),
        total: state.items.reduce((sum, item) => {
          if (item.id === action.payload.id && 
              JSON.stringify(item.customizations) === JSON.stringify(action.payload.customizations)) {
            return sum + (item.price * action.payload.quantity);
          }
          return sum + (item.price * item.quantity);
        }, 0),
        itemCount: state.items.reduce((sum, item) => {
          if (item.id === action.payload.id && 
              JSON.stringify(item.customizations) === JSON.stringify(action.payload.customizations)) {
            return sum + action.payload.quantity;
          }
          return sum + item.quantity;
        }, 0),
      };

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        total: 0,
        itemCount: 0,
      };

    case 'LOAD_CART':
      return {
        ...state,
        ...action.payload,
      };

    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('paradise-cart');
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartData });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('paradise-cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('paradise-cart', JSON.stringify(state));
  }, [state]);

  const addItem = (item) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
    toast.success(`${item.name} added to cart!`);
  };

  const removeItem = (item) => {
    dispatch({ type: 'REMOVE_ITEM', payload: item });
    toast.success(`${item.name} removed from cart!`);
  };

  const updateQuantity = (item, quantity) => {
    if (quantity <= 0) {
      removeItem(item);
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { ...item, quantity } });
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    toast.success('Cart cleared!');
  };

  const getItemQuantity = (itemId, customizations = {}) => {
    const item = state.items.find(
      item => item.id === itemId && 
      JSON.stringify(item.customizations) === JSON.stringify(customizations)
    );
    return item ? item.quantity : 0;
  };

  const getCartTotal = () => {
    return state.total;
  };

  const getCartItemCount = () => {
    return state.itemCount;
  };

  const getCartItems = () => {
    return state.items;
  };

  const isCartEmpty = () => {
    return state.items.length === 0;
  };

  const value = {
    items: state.items,
    total: state.total,
    itemCount: state.itemCount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemQuantity,
    getCartTotal,
    getCartItemCount,
    getCartItems,
    isCartEmpty,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
