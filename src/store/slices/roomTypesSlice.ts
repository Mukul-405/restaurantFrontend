import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as roomsApi from '../../lib/roomsApi';
import { RoomType } from '../../lib/roomsApi';

interface RoomTypesState {
  roomTypes: RoomType[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: RoomTypesState = { roomTypes: [], status: 'idle', error: null };

export const fetchRoomTypes = createAsyncThunk('roomTypes/fetchAll', async (params: { startDate?: string; endDate?: string } | void, { rejectWithValue }) => {
  try { return await roomsApi.getRoomTypes(params?.startDate, params?.endDate); }  
  catch (error: any) { return rejectWithValue(error.response?.data?.message || 'Failed to fetch room types'); }
});

export const createRoomType = createAsyncThunk('roomTypes/create', async (data: Partial<RoomType>, { rejectWithValue }) => {
  try { return await roomsApi.createRoomType(data); } 
  catch (error: any) { return rejectWithValue(error.response?.data?.message || 'Failed to create room type'); }
});

export const updateRoomType = createAsyncThunk('roomTypes/update', async ({ id, data }: { id: number, data: Partial<RoomType> }, { rejectWithValue }) => {
  try { return await roomsApi.updateRoomType(id, data); } 
  catch (error: any) { return rejectWithValue(error.response?.data?.message || 'Failed to update room type'); }
});

export const addRoomToType = createAsyncThunk('roomTypes/addRoom', async ({ id, roomData }: { id: number, roomData: { roomNumber: string; status?: string } }, { rejectWithValue }) => {
  try { return await roomsApi.addRoomToType(id, roomData); } 
  catch (error: any) { return rejectWithValue(error.response?.data?.message || 'Failed to add room'); }
});

export const deleteRoomFromType = createAsyncThunk('roomTypes/deleteRoom', async ({ id, roomNumber }: { id: number, roomNumber: string }, { rejectWithValue }) => {
  try { return await roomsApi.deleteRoomFromType(id, roomNumber); } 
  catch (error: any) { return rejectWithValue(error.response?.data?.message || 'Failed to delete room'); }
});

export const deleteRoomType = createAsyncThunk('roomTypes/delete', async (id: number, { rejectWithValue }) => {
  try { await roomsApi.deleteRoomType(id); return id; } 
  catch (error: any) { return rejectWithValue(error.response?.data?.message || 'Failed to delete room type'); }
});

const roomTypesSlice = createSlice({
  name: 'roomTypes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoomTypes.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchRoomTypes.fulfilled, (state, action) => { state.status = 'succeeded'; state.roomTypes = action.payload; })
      .addCase(fetchRoomTypes.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload as string; })
      .addCase(createRoomType.fulfilled, (state, action) => { state.roomTypes.push(action.payload); })
      .addCase(updateRoomType.fulfilled, (state, action) => {
        const index = state.roomTypes.findIndex(rt => rt.id === action.payload.id);
        if (index !== -1) state.roomTypes[index] = action.payload;
      })
      .addCase(addRoomToType.fulfilled, (state, action) => {
        const index = state.roomTypes.findIndex(rt => rt.id === action.payload.id);
        if (index !== -1) state.roomTypes[index] = action.payload;
      })
      .addCase(deleteRoomFromType.fulfilled, (state, action) => {
        const index = state.roomTypes.findIndex(rt => rt.id === action.payload.id);
        if (index !== -1) state.roomTypes[index] = action.payload;
      })
      .addCase(deleteRoomType.fulfilled, (state, action) => {
        state.roomTypes = state.roomTypes.filter(rt => rt.id !== action.payload);
      });
  },
});

export default roomTypesSlice.reducer;
