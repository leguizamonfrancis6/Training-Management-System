import { useState } from "react";

// Lista que muestra solo los primeros elementos hasta que se pide verla completa (ver BotonVerTodos).
export function useListaCorta<T>(elementos: T[], cantidadInicial: number) {
  const [abierta, setAbierta] = useState(false);
  return {
    visibles: abierta ? elementos : elementos.slice(0, cantidadInicial),
    ocultos: elementos.length - cantidadInicial,
    abierta,
    alternar: () => setAbierta((valor) => !valor),
  };
}

export type ListaCorta = ReturnType<typeof useListaCorta>;
