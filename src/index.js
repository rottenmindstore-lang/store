import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Loja from './Loja';
import AdminShell from './AdminShell';
import LojaAdminLogin from './LojaAdminLogin';
import RequireAuth from './RequireAuth';
import { AuthProvider } from './authContext';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* loja pública */}
          <Route path="/*" element={<Loja />} />

          {/* admin */}
          <Route path="/admin/login" element={<LojaAdminLogin />} />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminShell />
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
