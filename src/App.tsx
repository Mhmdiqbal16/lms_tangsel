import { AuthProvider } from '@/context/AuthContext';
import { AppDataProvider } from '@/context/AppDataContext';
import { AppRouter } from '@/routes/AppRouter';

export default function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <AppRouter />
      </AppDataProvider>
    </AuthProvider>
  );
}

