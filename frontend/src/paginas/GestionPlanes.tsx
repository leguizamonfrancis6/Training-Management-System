import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { ErrorApi } from "../api/cliente";
import { planesApi, type Plan } from "../api/planes";
import { formatearMoneda } from "../utils/formato";
import { importeParaEditar } from "../utils/pagos";

interface PropsEdicion {
  plan: Plan;
  onGuardado: () => void;
  onCancelar: () => void;
}

// Campo para editar el precio de un plan, dentro de su fila de la tabla.
function EdicionPrecio({ plan, onGuardado, onCancelar }: PropsEdicion) {
  const [precio, setPrecio] = useState(Number(plan.precioMensual) > 0 ? importeParaEditar(plan.precioMensual) : "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setGuardando(true);
    try {
      await planesApi.actualizarPrecio(plan.id, precio);
      onGuardado();
    } catch (err) {
      const mensaje = err instanceof ErrorApi ? err.campos.precioMensual?.[0] ?? err.message : "No se pudo guardar";
      setError(mensaje);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="edicion-precio" onSubmit={enviar} noValidate>
      <input
        inputMode="decimal"
        value={precio}
        onChange={(e) => setPrecio(e.target.value)}
        placeholder="Ej.: 25.000"
        aria-label={`Precio mensual de ${plan.nombre}`}
        autoFocus
      />
      <button type="submit" className="boton" disabled={guardando}>
        {guardando ? "Guardando…" : "Guardar"}
      </button>
      <button type="button" className="boton-secundario" onClick={onCancelar}>
        Cancelar
      </button>
      {error && <span className="error-campo">{error}</span>}
    </form>
  );
}

// Precios de los 4 planes fijos (Presencial, Semi presencial, Online, Otro).
// Se llega desde Pagos → "Configurar pagos" (y desde "Configurar precios" en Pagos → Membresías).
interface PropsGestion {
  titulo: string;
  volverA: string;
  etiquetaVolver: string;
}

export default function GestionPlanes({ titulo, volverA, etiquetaVolver }: PropsGestion) {
  const [planes, setPlanes] = useState<Plan[] | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setPlanes(await planesApi.listar());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las membresías");
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function guardado() {
    setEditandoId(null);
    await cargar();
  }

  return (
    <section>
      <Link to={volverA} className="volver">
        ← {etiquetaVolver}
      </Link>
      <h1>{titulo}</h1>
      <p className="texto-suave">
        Precio mensual de cada membresía. Es el importe que se propone al cobrar la cuota (se puede cambiar en cada pago).
        Cambiar un precio no modifica las cuotas ya cobradas.
      </p>

      {error && <p className="mensaje-error">{error}</p>}

      {planes && (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Membresía</th>
                <th>Precio mensual</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {planes.map((plan) => (
                <tr key={plan.id}>
                  <td>
                    <strong>{plan.nombre}</strong>
                  </td>
                  {editandoId === plan.id ? (
                    <td colSpan={2}>
                      <EdicionPrecio plan={plan} onGuardado={guardado} onCancelar={() => setEditandoId(null)} />
                    </td>
                  ) : (
                    <>
                      <td className="sin-salto">
                        {Number(plan.precioMensual) > 0 ? (
                          formatearMoneda(plan.precioMensual)
                        ) : (
                          <span className="insignia insignia-aviso">Sin precio definido</span>
                        )}
                      </td>
                      <td>
                        <button type="button" className="boton-link" onClick={() => setEditandoId(plan.id)}>
                          {Number(plan.precioMensual) > 0 ? "Cambiar" : "Definir precio"}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
