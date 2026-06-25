import { AuthProvider } from '@/context/AuthContext';
import { AppDataProvider } from '@/context/AppDataContext';
import { ToastProvider } from '@/ToastContext';
import { AppRouter } from '@/routes/AppRouter';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppDataProvider>
          <AppRouter />
        </AppDataProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
