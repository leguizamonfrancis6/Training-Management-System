import { useCallback, useEffect, useState } from "react";
import { alumnosApi } from "../api/alumnos";
import { pagosApi, type CuotaResumen, type Pago, type PagosAlumno as DatosPagos } from "../api/pagos";
import { planesApi, type Plan } from "../api/planes";
import { formatearFecha, formatearMoneda } from "../utils/formato";
import {
  claseEstadoCuota,
  ETIQUETAS_ESTADO_CUOTA,
  ETIQUETAS_MEDIO,
  ETIQUETAS_MODALIDAD,
  linkWhatsApp,
  requiereAviso,
  textoVencimiento,
} from "../utils/pagos";
import FormularioPago from "./FormularioPago";

// Cantidad de pagos que se ven sin desplegar la lista.
const CANTIDAD_INICIAL = 3;

interface Props {
  alumno: { id: number; nombre: string; telefono: string };
  onCambioPlan: () => void; // para que la ficha actualice el historial
}

// Sección "Cuota y pagos" de la ficha del alumno.
export default function PagosAlumno({ alumno, onCambioPlan }: Props) {
  const [datos, setDatos] = useState<DatosPagos | null>(null);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [error, setError] = useState("");
  const [registrando, setRegistrando] = useState(false);
  const [verTodos, setVerTodos] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [pagos, listaPlanes] = await Promise.all([pagosApi.obtener(alumno.id), planesApi.listar()]);
      setDatos(pagos);
      setPlanes(listaPlanes);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los pagos");
    }
  }, [alumno.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function cambiarPlan(valor: string) {
    try {
      await alumnosApi.cambiarPlan(alumno.id, valor ? Number(valor) : null);
      await cargar();
      onCambioPlan();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el plan");
    }
  }

  async function anularSaldo(cuota: CuotaResumen) {
    const pregunta = `¿Anular el saldo pendiente de ${formatearMoneda(cuota.saldo)}? La cuota queda saldada con lo que ya pagó.`;
    if (!window.confirm(pregunta)) return;
    try {
      await pagosApi.anularSaldo(cuota.id);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo anular el saldo");
    }
  }

  async function eliminarPago(pago: Pago) {
    const pregunta = `¿Eliminar el pago de ${formatearMoneda(pago.importe)} del ${formatearFecha(pago.fecha)}? No se puede deshacer.`;
    if (!window.confirm(pregunta)) return;
    try {
      await pagosApi.eliminar(pago.id);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el pago");
    }
  }

  async function pagoRegistrado() {
    setRegistrando(false);
    await cargar();
  }

  if (!datos) {
    return (
      <div className="tarjeta seccion">
        <h2>Cuota y pagos</h2>
        {error ? <p className="mensaje-error">{error}</p> : <p className="texto-suave">Cargando…</p>}
      </div>
    );
  }

  const { plan, situacion, pagos } = datos;
  // Si el plan actual fue eliminado, igual se muestra en la lista para que el select lo refleje.
  const opcionesPlan = plan && !planes.some((p) => p.id === plan.id) ? [plan, ...planes] : planes;
  const aviso = { nombre: alumno.nombre, telefono: alumno.telefono, ...situacion };
  const visibles = verTodos ? pagos : pagos.slice(0, CANTIDAD_INICIAL);

  return (
    <div className="tarjeta seccion">
      <h2>Cuota y pagos</h2>
      {error && <p className="mensaje-error">{error}</p>}

      <div className="pago-plan">
        <label htmlFor="plan-alumno">Plan:</label>
        <select id="plan-alumno" value={plan?.id ?? ""} onChange={(e) => cambiarPlan(e.target.value)}>
          <option value="">Sin plan</option>
          {opcionesPlan.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} — {formatearMoneda(p.precioMensual)} ({ETIQUETAS_MODALIDAD[p.modalidad]})
            </option>
          ))}
        </select>
      </div>

      <div className="pago-estado">
        <span className={claseEstadoCuota(situacion.estado)}>{ETIQUETAS_ESTADO_CUOTA[situacion.estado]}</span>
        <span>{textoVencimiento(situacion.estado, situacion.vence, situacion.diasRestantes)}</span>
        {requiereAviso(aviso) && (
          <a className="boton-whatsapp" href={linkWhatsApp(aviso)} target="_blank" rel="noopener noreferrer">
            Avisar por WhatsApp
          </a>
        )}
      </div>

      {situacion.cuotasConSaldo.map((cuota) => (
        <div key={cuota.id} className="pago-saldo">
          <span>
            Saldo pendiente: <strong>{formatearMoneda(cuota.saldo)}</strong>{" "}
            <span className="texto-suave">
              (cuota del {formatearFecha(cuota.desde)} al {formatearFecha(cuota.vence)}: pagó{" "}
              {formatearMoneda(cuota.pagado)} de {formatearMoneda(cuota.importe)})
            </span>
          </span>
          <button type="button" className="boton-link peligro" onClick={() => anularSaldo(cuota)}>
            Anular saldo
          </button>
        </div>
      ))}

      {registrando ? (
        <FormularioPago
          alumnoId={alumno.id}
          plan={plan}
          cuotasConSaldo={situacion.cuotasConSaldo}
          onGuardado={pagoRegistrado}
          onCancelar={() => setRegistrando(false)}
        />
      ) : (
        <button type="button" className="boton" onClick={() => setRegistrando(true)}>
          Registrar pago
        </button>
      )}

      <div className="separador" />

      {pagos.length === 0 ? (
        <p className="texto-suave">Todavía no hay pagos registrados.</p>
      ) : (
        <>
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Concepto</th>
                  <th>Medio</th>
                  <th className="numero">Importe</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visibles.map((pago) => (
                  <tr key={pago.id}>
                    <td className="sin-salto">{formatearFecha(pago.fecha)}</td>
                    <td>
                      {pago.concepto}
                      {pago.cuota && (
                        <span className="texto-suave">
                          {" "}
                          ({formatearFecha(pago.cuota.desde)} al {formatearFecha(pago.cuota.vence)})
                        </span>
                      )}
                    </td>
                    <td>{ETIQUETAS_MEDIO[pago.medio]}</td>
                    <td className="numero sin-salto">{formatearMoneda(pago.importe)}</td>
                    <td>
                      <button type="button" className="boton-link peligro" onClick={() => eliminarPago(pago)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagos.length > CANTIDAD_INICIAL && (
            <button type="button" className="boton-secundario boton-desplegar" onClick={() => setVerTodos(!verTodos)}>
              {verTodos ? "Ver solo los últimos" : `Ver todos (${pagos.length - CANTIDAD_INICIAL} más)`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
