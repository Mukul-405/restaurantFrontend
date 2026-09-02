import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetcher } from '../../lib/fetcher';

export interface InventoryItemLine {
  name: string;
  quantity: number;
  perItemPrice: number;
  totalPrice: number;
}

export interface InventoryRecord {
  id: number | string;
  date: string;
  metaInfo: InventoryItemLine[];
  totalPrice: number | string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryState {
  records: InventoryRecord[];
  totalRecords: number;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: InventoryState = {
  records: [],
  totalRecords: 0,
  status: 'idle',
  error: null,
};

export const fetchInventory = createAsyncThunk(
  'inventory/fetchInventory',
  async (params: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      const response = await fetcher.getInventory(params);
      return response; // { items: InventoryRecord[], total: number }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch inventory records');
    }
  }
);

export const createInventoryRecord = createAsyncThunk(
  'inventory/createInventoryRecord',
  async (inventoryData: any, { rejectWithValue }) => {
    try {
      const response = await fetcher.createInventory(inventoryData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create inventory record');
    }
  }
);

export const updateInventoryRecord = createAsyncThunk(
  'inventory/updateInventoryRecord',
  async ({ id, data }: { id: string | number; data: any }, { rejectWithValue }) => {
    try {
      const response = await fetcher.updateInventory(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update inventory record');
    }
  }
);

export const deleteInventoryRecord = createAsyncThunk(
  'inventory/deleteInventoryRecord',
  async (id: string | number, { rejectWithValue }) => {
    try {
      await fetcher.deleteInventory(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete inventory record');
    }
  }
);

export const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Inventory
      .addCase(fetchInventory.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action: PayloadAction<{ items: InventoryRecord[]; total: number }>) => {
        state.status = 'succeeded';
        state.records = action.payload.items || [];
        state.totalRecords = action.payload.total || 0;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Create Inventory Record
      .addCase(createInventoryRecord.fulfilled, (state, action: PayloadAction<InventoryRecord>) => {
        state.records.unshift(action.payload);
        state.totalRecords += 1;
      })
      // Update Inventory Record
      .addCase(updateInventoryRecord.fulfilled, (state, action: PayloadAction<InventoryRecord>) => {
        const index = state.records.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.records[index] = action.payload;
        }
      })
      // Delete Inventory Record
      .addCase(deleteInventoryRecord.fulfilled, (state, action) => {
        state.records = state.records.filter(item => item.id !== action.payload);
        state.totalRecords = Math.max(0, state.totalRecords - 1);
      });
  },
});

export default inventorySlice.reducer;
