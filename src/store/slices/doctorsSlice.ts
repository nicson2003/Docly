import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Doctor, DoctorsState } from '../../types';
import { doctorService } from '../../services/api';
import { processDoctors } from '../../utils';

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export const fetchDoctors = createAsyncThunk<
  Doctor[],
  { forceRefresh?: boolean } | undefined,
  { rejectValue: string; state: { doctors: DoctorsState } }
>('doctors/fetchDoctors', async (args, { rejectWithValue, getState }) => {
  // Skip fetch if data is fresh and no force refresh
  const { lastFetched, items } = getState().doctors;
  if (
    !args?.forceRefresh &&
    lastFetched &&
    items.length > 0 &&
    Date.now() - new Date(lastFetched).getTime() < STALE_THRESHOLD_MS
  ) {
    return items;
  }

  try {
    const raw = await doctorService.fetchAvailability();
    const doctors = processDoctors(raw);

    if (doctors.length === 0) {
      return rejectWithValue('No doctors found in the API response.');
    }

    return doctors;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to fetch doctors.';
    return rejectWithValue(message);
  }
});

const initialState: DoctorsState = {
  items: [],
  loading: false,
  error: null,
  lastFetched: null,
};

const doctorsSlice = createSlice({
  name: 'doctors',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDoctors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDoctors.fulfilled, (state, action: PayloadAction<Doctor[]>) => {
        state.loading = false;
        state.items = action.payload;
        state.lastFetched = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchDoctors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'An unexpected error occurred.';
      });
  },
});

export const { clearError } = doctorsSlice.actions;
export default doctorsSlice.reducer;
