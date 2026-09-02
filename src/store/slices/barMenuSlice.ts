import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetcher } from '../../lib/fetcher';

export interface Category {
  id: number | string;
  name: string;
}

export interface BarMenuItem {
  id: number | string;
  name: string;
  description?: string;
  price: string | number;
  isAvailable: boolean;
  categoryName?: string;
  categoryId?: number | string;
}

export interface BarMenuState {
  items: BarMenuItem[];
  categories: Category[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: BarMenuState = {
  items: [],
  categories: [],
  status: 'idle',
  error: null,
};

export const fetchBarMenu = createAsyncThunk(
  'barMenu/fetchBarMenu',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetcher.getBarMenu();
      return response; // Expected to be { categories: [], items: [] }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bar menu');
    }
  }
);

export const createBarMenuItem = createAsyncThunk(
  'barMenu/createBarMenuItem',
  async (menuData: any, { rejectWithValue }) => {
    try {
      const response = await fetcher.createBarMenuItem(menuData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create bar menu item');
    }
  }
);

export const updateBarMenuItem = createAsyncThunk(
  'barMenu/updateBarMenuItem',
  async ({ id, data }: { id: string | number; data: any }, { rejectWithValue }) => {
    try {
      const response = await fetcher.updateBarMenuItem(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update bar menu item');
    }
  }
);

export const deleteBarMenuItem = createAsyncThunk(
  'barMenu/deleteBarMenuItem',
  async (id: string | number, { rejectWithValue }) => {
    try {
      await fetcher.deleteBarMenuItem(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete bar menu item');
    }
  }
);

export const createBarCategories = createAsyncThunk(
  'barMenu/createBarCategories',
  async (categories: string[], { rejectWithValue }) => {
    try {
      const response = await fetcher.bulkCreateBarCategories(categories);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create categories');
    }
  }
);

const rememberCategory = (state: BarMenuState, name?: string) => {
  if (name && !state.categories.some((cat) => cat.name === name)) {
    state.categories.push({ id: name, name });
  }
};

export const barMenuSlice = createSlice({
  name: 'barMenu',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Bar Menu
      .addCase(fetchBarMenu.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchBarMenu.fulfilled, (state, action: PayloadAction<{ categories: Category[]; items: BarMenuItem[] }>) => {
        state.status = 'succeeded';
        state.categories = action.payload.categories || [];
        state.items = action.payload.items || [];
      })
      .addCase(fetchBarMenu.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Create Bar Menu Item
      .addCase(createBarMenuItem.fulfilled, (state, action: PayloadAction<BarMenuItem>) => {
        state.items.unshift(action.payload);
        rememberCategory(state, action.payload.categoryName);
      })
      // Update Bar Menu Item
      .addCase(updateBarMenuItem.fulfilled, (state, action: PayloadAction<BarMenuItem>) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        rememberCategory(state, action.payload.categoryName);
      })
      // Delete Bar Menu Item
      .addCase(deleteBarMenuItem.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      });
  },
});

export default barMenuSlice.reducer;
