import { useCallback, useEffect, useState, type DependencyList } from "react";

// Pide datos a la API al mostrar el componente y cada vez que cambian las dependencias.
// datos es null mientras carga; recargar() los vuelve a pedir (ej.: después de guardar un cambio).
export function useCarga<T>(pedir: () => Promise<T>, dependencias: DependencyList) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState("");

  const recargar = useCallback(async () => {
    try {
      setDatos(await pedir());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los datos");
    }
  }, dependencias);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { datos, error, setError, recargar };
}
