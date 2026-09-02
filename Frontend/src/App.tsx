import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.tsx";
import { ToastProvider } from "./components/ToastProvider";
import { AppRoutes } from "./routes/AppRoutes";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
