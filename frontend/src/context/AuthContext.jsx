import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const CLAVE_STORAGE = "sweet-ice-sesion";

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(() => {
    const guardada = localStorage.getItem(CLAVE_STORAGE);
    return guardada ? JSON.parse(guardada) : null;
  });

  useEffect(() => {
    if (sesion) {
      localStorage.setItem(CLAVE_STORAGE, JSON.stringify(sesion));
    } else {
      localStorage.removeItem(CLAVE_STORAGE);
    }
  }, [sesion]);

  const iniciarSesion = (token, usuario) => {
    setSesion({ token, usuario });
  };

  const cerrarSesion = () => {
    setSesion(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token: sesion?.token ?? null,
        usuario: sesion?.usuario ?? null,
        estaLogueado: Boolean(sesion?.token),
        iniciarSesion,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }

  return contexto;
}