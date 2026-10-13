import { useSesion } from "../componentes/Sesion";

// Pantalla provisoria: el panel principal se construye en el último módulo.
export default function Inicio() {
  const { usuario } = useSesion();

  return (
    <section>
      <h1>Hola, {usuario?.nombre}</h1>
      <p className="texto-suave">El panel principal se va a armar cuando estén los demás módulos.</p>
    </section>
  );
}
