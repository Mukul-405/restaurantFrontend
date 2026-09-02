import { configureStore } from '@reduxjs/toolkit';
import menuReducer from './slices/menuSlice';
import barMenuReducer from './slices/barMenuSlice';
import inventoryReducer from './slices/inventorySlice';
import orderReducer from './slices/orderSlice';
import roomTypesReducer from './slices/roomTypesSlice';

export const store = configureStore({
  reducer: {
    menu: menuReducer,
    barMenu: barMenuReducer,
    inventory: inventoryReducer,
    order: orderReducer,
    roomTypes: roomTypesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
