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

export interface OrderState {
  orders: Order[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  selectedOrder: Order | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: OrderState = {
  orders: [],
  meta: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
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
      });
  },
});

export const { clearOrderError, setSelectedOrder } = orderSlice.actions;
export default orderSlice.reducer;
