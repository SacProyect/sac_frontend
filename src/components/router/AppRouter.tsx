// Router.tsx
import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { router } from '@/App'; // Import your existing routes

const AppRouter: React.FC = () => {
    return <RouterProvider router={router} />;
};

export default AppRouter;
