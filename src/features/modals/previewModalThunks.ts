import { createAsyncThunk } from '@reduxjs/toolkit';
import type { MediaType } from '@/services/tmdb/types';
import type { RootState } from '@/redux/store';
import { getShowDetails } from '@/server/actions/get-show-details';
import { setIsLoading, setDetailedShow, setShow } from './previewModalSlice';

export const fetchDetailedShow = createAsyncThunk(
  'previewModal/fetchDetailedShow',
  async (
    { id, mediaType }: { id: number; mediaType: MediaType },
    thunkApi,
  ) => {
    thunkApi.dispatch(setIsLoading(true));
    try {
      const data = await getShowDetails({
        id,
        mediaType,
        includeExtras: true,
      });

      // Sync the effective media type resolved server-side (tv <-> movie 404 flip)
      const state = thunkApi.getState() as RootState;
      const currentShow = state.previewModal.show;
      if (currentShow && data.media_type && data.media_type !== currentShow.media_type) {
        thunkApi.dispatch(
          setShow({ ...currentShow, media_type: data.media_type }),
        );
      }

      thunkApi.dispatch(setDetailedShow(data));
      thunkApi.dispatch(setIsLoading(false));
      return data;
    } catch (error) {
      console.error('Failed to fetch detailed show info:', error);
      thunkApi.dispatch(setIsLoading(false));
      throw error;
    }
  },
);
