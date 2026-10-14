import type { ReactNode } from "react";

interface Props {
  titulo: string;
  children: ReactNode;
}

// Sección que muestra solo su título; al hacer clic se despliega el contenido hacia abajo.
// Usa el elemento nativo <details> del navegador: no necesita estado y funciona con teclado (Enter / Espacio).
export default function Desplegable({ titulo, children }: Props) {
  return (
    <details className="tarjeta seccion desplegable">
      <summary>
        <h2>{titulo}</h2>
      </summary>
      <div className="desplegable-contenido">{children}</div>
    </details>
  );
}
