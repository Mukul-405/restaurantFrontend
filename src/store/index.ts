import { configureStore } from '@reduxjs/toolkit';
import menuReducer from './slices/menuSlice';
import orderReducer from './slices/orderSlice';
import roomTypesReducer from './slices/roomTypesSlice';

export const store = configureStore({
  reducer: {
    menu: menuReducer,
    order: orderReducer,
    roomTypes: roomTypesReducer,

  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
