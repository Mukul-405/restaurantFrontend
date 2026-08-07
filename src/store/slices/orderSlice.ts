import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetcher } from '../../lib/fetcher';

export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  quantity: number;
  name: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  phoneNumber: string;
  baseAmount: number;
  gstAmount: number;
  discountAmount: number;
  finalDiscountedAmount: number;
  status: OrderStatus;
  paymentMode?: 'CASH' | 'CARD' | 'UPI';
  cancellationReason: string | null;
  tableNumber: number | null;
  items: OrderItem[];
  kotHistory: {
    menuItemId: number;
    name: string;
    qty: number;
  }[];
  user?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// /orders/kots returns a lean projection, not a full Order.
export interface Kot {
  id: number;
  tableNumber: number | null;
  kotHistory: Order['kotHistory'];
  createdAt: string;
  user?: { id: string; name: string };
}

export interface OrderState {
  orders: Order[];
  meta: PageMeta;
  kots: Kot[];
  kotMeta: PageMeta;
  kotStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  selectedOrder: Order | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const emptyMeta: PageMeta = { total: 0, page: 1, limit: 10, totalPages: 0 };

const initialState: OrderState = {
  orders: [],
  meta: emptyMeta,
  kots: [],
  kotMeta: { ...emptyMeta, limit: 20 },
  kotStatus: 'idle',
  selectedOrder: null,
  status: 'idle',
  error: null,
};

export const fetchOrders = createAsyncThunk(
  'order/fetchOrders',
  async (params: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      const response = await fetcher.getOrders(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const fetchKots = createAsyncThunk(
  'order/fetchKots',
  async (params: { page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      const response = await fetcher.getKots(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch KOTs');
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'order/fetchOrderById',
  async (id: number | string, { rejectWithValue }) => {
    try {
      const response = await fetcher.getOrderById(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order details');
    }
  }
);

export const createOrder = createAsyncThunk(
  'order/createOrder',
  async (orderData: any, { rejectWithValue }) => {
    try {
      const response = await fetcher.createOrder(orderData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create order');
    }
  }
);

export const updateOrder = createAsyncThunk(
  'order/updateOrder',
  async ({ id, data }: { id: number | string; data: any }, { rejectWithValue }) => {
    try {
      const response = await fetcher.updateOrder(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update order');
    }
  }
);

export const transferOrderToRoom = createAsyncThunk(
  'order/transferOrderToRoom',
  async ({ id, guestPhone }: { id: number | string; guestPhone: string }, { rejectWithValue }) => {
    try {
      const response = await fetcher.transferOrderToRoom(id, guestPhone);
      return { id, response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to transfer order');
    }
  }
);

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    clearOrderError(state) {
      state.error = null;
    },
    setSelectedOrder(state, action: PayloadAction<Order | null>) {
      state.selectedOrder = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Orders
      .addCase(fetchOrders.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action: PayloadAction<{ data: Order[], meta: any }>) => {
        state.status = 'succeeded';
        state.orders = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Fetch KOTs
      .addCase(fetchKots.pending, (state) => {
        state.kotStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchKots.fulfilled, (state, action: PayloadAction<{ data: Kot[], meta: PageMeta }>) => {
        state.kotStatus = 'succeeded';
        state.kots = action.payload.data;
        state.kotMeta = action.payload.meta;
      })
      .addCase(fetchKots.rejected, (state, action) => {
        state.kotStatus = 'failed';
        state.error = action.payload as string;
      })
      // Fetch Order By Id
      .addCase(fetchOrderById.fulfilled, (state, action: PayloadAction<Order>) => {
        state.selectedOrder = action.payload;
      })
      // Create Order
      .addCase(createOrder.fulfilled, (state, action: PayloadAction<Order>) => {
        state.orders.unshift(action.payload); // Add new order to the beginning
      })
      // Update Order
      .addCase(updateOrder.fulfilled, (state, action: PayloadAction<Order>) => {
        const index = state.orders.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        if (state.selectedOrder?.id === action.payload.id) {
          state.selectedOrder = action.payload;
        }
      })
      // Transfer Order To Room
      .addCase(transferOrderToRoom.fulfilled, (state, action) => {
        const orderId = action.payload.id;
        const index = state.orders.findIndex(order => order.id === orderId);
        if (index !== -1) {
          state.orders[index].status = 'COMPLETED';
        }
        if (state.selectedOrder?.id === orderId) {
          state.selectedOrder.status = 'COMPLETED';
        }
      });
  },
});

export const { clearOrderError, setSelectedOrder } = orderSlice.actions;
export default orderSlice.reducer;
