import { configureStore } from '@reduxjs/toolkit';
import { searchApi } from '@/redux/features/search/searchApi';
import { rootReducer } from '@/redux/root-reducer';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(searchApi.middleware),
  devTools: true,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
