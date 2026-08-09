import { createAsyncThunk } from '@reduxjs/toolkit';
import type { MediaType } from '@/services/tmdb/types';
import type { RootState } from '@/redux/store';
import { fetchDetailedShowData } from '@/redux/features/modals/detail-fetch-helper';
import { setIsLoading, setDetailedShow, setShow } from './hoverModalSlice';

export const fetchPreviewData = createAsyncThunk(
  'hoverModal/fetchPreviewData',
  async (
    { id, mediaType }: { id: number; mediaType: MediaType },
    thunkApi,
  ) => {
    thunkApi.dispatch(setIsLoading(true));
    try {
      const data = await fetchDetailedShowData({
        id,
        mediaType,
        onFlipMediaType: (flippedMediaType) => {
          const state = thunkApi.getState() as RootState;
          const currentShow = state.hoverModal.show;
          if (currentShow) {
            thunkApi.dispatch(
              setShow({ ...currentShow, media_type: flippedMediaType }),
            );
          }
        },
        includeExtras: false,
      });
      thunkApi.dispatch(setDetailedShow(data));
      thunkApi.dispatch(setIsLoading(false));
      return data;
    } catch (error) {
      console.error('Failed to fetch preview data:', error);
      thunkApi.dispatch(setIsLoading(false));
      throw error;
    }
  },
);
