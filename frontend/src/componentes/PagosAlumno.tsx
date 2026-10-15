import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { alumnosApi } from "../api/alumnos";
import { pagosApi, type CuotaResumen, type Pago, type PagosAlumno as DatosPagos } from "../api/pagos";
import { formatearFecha, formatearMoneda } from "../utils/formato";
import {
  claseEstadoCuota,
  ETIQUETAS_ESTADO_CUOTA,
  ETIQUETAS_MEDIO,
  linkWhatsApp,
  requiereAviso,
  textoVencimiento,
} from "../utils/pagos";
import FormularioPago from "./FormularioPago";
import SelectorPlan from "./SelectorPlan";
import Desplegable from "./Desplegable";

// Cantidad de pagos que se ven sin desplegar la lista.
const CANTIDAD_INICIAL = 3;

interface Props {
  alumno: { id: number; nombre: string; apellido: string; telefono: string; activo: boolean };
  onCambio: () => void; // para que la ficha actualice el historial y el estado del alumno
  enFicha?: boolean; // true (ficha): sección desplegable con "Ir a Pagos"; false: abierta, en la pantalla de Pagos
}

// Contenedor de la sección: desplegable en la ficha, tarjeta abierta en la pantalla de Pagos.
function Contenedor({ enFicha, children }: { enFicha: boolean; children: ReactNode }) {
  return enFicha ? <Desplegable titulo="Cuota y pagos">{children}</Desplegable> : <div className="tarjeta seccion">{children}</div>;
}

// Sección "Cuota y pagos" de la ficha del alumno.
export default function PagosAlumno({ alumno, onCambio, enFicha = true }: Props) {
  const [datos, setDatos] = useState<DatosPagos | null>(null);
  const [error, setError] = useState("");
  const [registrando, setRegistrando] = useState(false);
  const [verTodos, setVerTodos] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setDatos(await pagosApi.obtener(alumno.id));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los pagos");
    }
  }, [alumno.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function planCambiado() {
    await cargar();
    onCambio();
  }

  // El alumno avisó que no sigue: las cuotas adeudadas no se le cobran.
  // Después se ofrece darlo de baja (si sigue activo, se le vuelven a acumular cuotas).
  async function anularDeuda() {
    if (!datos) return;
    const { cuotasAdeudadas, deudaTotal } = datos.situacion;
    const cantidad = `${cuotasAdeudadas.length} ${cuotasAdeudadas.length === 1 ? "cuota" : "cuotas"}`;
    const monto = Number(deudaTotal) > 0 ? ` (${formatearMoneda(deudaTotal)})` : "";
    if (!window.confirm(`¿Anular la deuda de ${cantidad}${monto}? No se le van a cobrar.`)) return;
    try {
      await pagosApi.anularDeuda(alumno.id);
      if (
        alumno.activo &&
        window.confirm(`¿Dar de baja a ${alumno.nombre} ${alumno.apellido}? Si sigue activo, se le van a volver a acumular cuotas.`)
      ) {
        await alumnosApi.cambiarEstado(alumno.id, false);
      }
      await cargar();
      onCambio();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo anular la deuda");
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
      <Contenedor enFicha={enFicha}>
        {error ? <p className="mensaje-error">{error}</p> : <p className="texto-suave">Cargando…</p>}
      </Contenedor>
    );
  }

  const { plan, situacion, pagos } = datos;
  const adeudadas = situacion.cuotasAdeudadas;
  const aviso = { nombre: alumno.nombre, telefono: alumno.telefono, cantidadAdeudadas: adeudadas.length, ...situacion };
  const visibles = verTodos ? pagos : pagos.slice(0, CANTIDAD_INICIAL);

  return (
    <Contenedor enFicha={enFicha}>
      {error && <p className="mensaje-error">{error}</p>}

      <div className="fila-plan">
        <SelectorPlan alumnoId={alumno.id} planActual={plan} onCambio={planCambiado} />
        {enFicha && (
          <Link to="/pagos" className="link-discreto">
            Ir a Pagos →
          </Link>
        )}
      </div>

      <div className="pago-estado">
        <span className={claseEstadoCuota(situacion.estado)}>{ETIQUETAS_ESTADO_CUOTA[situacion.estado]}</span>
        {situacion.vence && <span>{textoVencimiento(situacion.estado, situacion.vence, situacion.diasRestantes)}</span>}
        {requiereAviso(aviso) && (
          <a className="boton-whatsapp" href={linkWhatsApp(aviso)} target="_blank" rel="noopener noreferrer">
            Comunicarse vía WhatsApp
          </a>
        )}
      </div>

      {adeudadas.length > 0 && (
        <div className="pago-saldo">
          <div>
            <p className="deuda-titulo">
              Debe {adeudadas.length} {adeudadas.length === 1 ? "cuota" : "cuotas"}
              {situacion.precioCuotaAdeudada ? (
                <>
                  : <strong>{formatearMoneda(Number(situacion.precioCuotaAdeudada) * adeudadas.length)}</strong>
                </>
              ) : (
                <span className="texto-suave"> (la membresía no tiene precio definido)</span>
              )}
            </p>
            <ul className="lista-deuda">
              {adeudadas.map((periodo) => (
                <li key={periodo.desde}>
                  Del {formatearFecha(periodo.desde)} al {formatearFecha(periodo.vence)}
                </li>
              ))}
            </ul>
          </div>
          <button type="button" className="boton-link peligro" onClick={anularDeuda}>
            Anular deuda
          </button>
        </div>
      )}

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
          inicioCuota={situacion.inicioProximaCuota}
          cantidadAdeudadas={adeudadas.length}
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
    </Contenedor>
  );
}
