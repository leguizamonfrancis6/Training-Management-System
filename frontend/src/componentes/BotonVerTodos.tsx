import type { ListaCorta } from "../hooks/useListaCorta";

// "Ver todas (3 más)" / "Ver solo las últimas". No se muestra si no hay nada oculto.
export default function BotonVerTodos({ lista, femenino = false }: { lista: ListaCorta; femenino?: boolean }) {
  if (lista.ocultos <= 0) return null;
  const [todos, ultimos] = femenino ? ["todas", "las últimas"] : ["todos", "los últimos"];
  return (
    <button type="button" className="boton-secundario boton-desplegar" onClick={lista.alternar}>
      {lista.abierta ? `Ver solo ${ultimos}` : `Ver ${todos} (${lista.ocultos} más)`}
    </button>
  );
}
