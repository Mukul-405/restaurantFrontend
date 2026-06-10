import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetcher } from '../../lib/fetcher';

export interface Category {
  id: number | string;
  name: string;
}

export interface MenuItem {
  id: number | string;
  name: string;
  description?: string;
  price: string | number;
  isAvailable: boolean;
  categoryName?: string;
  categoryId?: number | string;
}

export interface MenuState {
  items: MenuItem[];
  categories: Category[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: MenuState = {
  items: [],
  categories: [],
  status: 'idle',
  error: null,
};

export const fetchMenu = createAsyncThunk(
  'menu/fetchMenu',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetcher.getMenu();
      return response; // Expected to be { categories: [], items: [] }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch menu');
    }
  }
);

export const createMenuItem = createAsyncThunk(
  'menu/createMenuItem',
  async (menuData: any, { rejectWithValue }) => {
    try {
      const response = await fetcher.createMenuItem(menuData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create menu item');
    }
  }
);

export const updateMenuItem = createAsyncThunk(
  'menu/updateMenuItem',
  async ({ id, data }: { id: string | number; data: any }, { rejectWithValue }) => {
    try {
      const response = await fetcher.updateMenuItem(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update menu item');
    }
  }
);

export const deleteMenuItem = createAsyncThunk(
  'menu/deleteMenuItem',
  async (id: string | number, { rejectWithValue }) => {
    try {
      await fetcher.deleteMenuItem(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete menu item');
    }
  }
);

export const createCategories = createAsyncThunk(
  'menu/createCategories',
  async (categories: string[], { rejectWithValue }) => {
    try {
      const response = await fetcher.bulkCreateCategories(categories);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create categories');
    }
  }
);

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    clearMenuError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Menu
      .addCase(fetchMenu.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMenu.fulfilled, (state, action: PayloadAction<{ items: MenuItem[]; categories: Category[] }>) => {
        state.status = 'succeeded';
        state.items = action.payload.items || [];
        state.categories = action.payload.categories || [];
      })
      .addCase(fetchMenu.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Create Menu Item
      .addCase(createMenuItem.fulfilled, (state, action: PayloadAction<MenuItem>) => {
        state.items.push(action.payload);
        // We might need to refresh categories if a new one was created, 
        // but typically we can rely on a full refetch or user seeing it.
        // For now we add the item.
      })
      // Update Menu Item
      .addCase(updateMenuItem.fulfilled, (state, action: PayloadAction<MenuItem>) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      // Delete Menu Item
      .addCase(deleteMenuItem.fulfilled, (state, action: PayloadAction<string | number>) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      });
  },
});

export const { clearMenuError } = menuSlice.actions;
export default menuSlice.reducer;
