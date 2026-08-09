import { combineReducers } from '@reduxjs/toolkit';
import { searchApi } from '@/redux/features/search/searchApi';
import hoverModalReducer from '@/features/modals/hoverModalSlice';
import previewModalReducer from '@/features/modals/previewModalSlice';
import searchReducer from '@/redux/features/search/searchSlice';

export const rootReducer = combineReducers({
  previewModal: previewModalReducer,
  hoverModal: hoverModalReducer,
  search: searchReducer,
  [searchApi.reducerPath]: searchApi.reducer,
});
