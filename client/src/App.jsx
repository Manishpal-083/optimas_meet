import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { MeetingProvider } from './context/MeetingContext';
import AppRoutes from './routes/AppRoutes';

export const App = () => {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <MeetingProvider>
            <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
              <AppRoutes />
            </div>
          </MeetingProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
