import { configureStore } from '@reduxjs/toolkit';
import projectsReducer from './projectsSlice';

export default configureStore({
  reducer: {
    projects: projectsReducer,
  },
});
