import { useEffect, useState } from "react";
import { Link } from "react-router";
import { pagosApi, type EstadoCuotaAlumno } from "../api/pagos";
import { formatearMoneda } from "../utils/formato";
import {
  claseEstadoCuota,
  ETIQUETAS_ESTADO_CUOTA,
  linkWhatsApp,
  requiereAviso,
  textoVencimiento,
} from "../utils/pagos";

type Filtro = "TODOS" | "VENCIDA" | "POR_VENCER" | "CON_SALDO" | "SIN_PAGOS" | "AL_DIA";

const FILTROS: { valor: Filtro; etiqueta: string; cumple: (fila: EstadoCuotaAlumno) => boolean }[] = [
  { valor: "TODOS", etiqueta: "Todos", cumple: () => true },
  { valor: "VENCIDA", etiqueta: "Vencidas", cumple: (f) => f.estado === "VENCIDA" },
  { valor: "POR_VENCER", etiqueta: "Por vencer", cumple: (f) => f.estado === "POR_VENCER" },
  { valor: "CON_SALDO", etiqueta: "Con saldo pendiente", cumple: (f) => Number(f.deudaTotal) > 0 },
  { valor: "SIN_PAGOS", etiqueta: "Sin pagos", cumple: (f) => f.estado === "SIN_PAGOS" },
  { valor: "AL_DIA", etiqueta: "Al día", cumple: (f) => f.estado === "AL_DIA" },
];

// Estado de las cuotas de todos los alumnos activos. El backend ya los ordena: lo urgente primero.
export default function Pagos() {
  const [filas, setFilas] = useState<EstadoCuotaAlumno[] | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [error, setError] = useState("");

  useEffect(() => {
    pagosApi
      .estadoCuotas()
      .then(setFilas)
      .catch((err: Error) => setError(err.message));
  }, []);

  const criterio = FILTROS.find((f) => f.valor === filtro)!;
  const visibles = filas?.filter(criterio.cumple) ?? [];

  return (
    <section>
      <div className="pagina-encabezado">
        <h1>Pagos</h1>
        <Link to="/ingresos" className="boton-secundario">
          Ver ingresos
        </Link>
      </div>
      <p className="texto-suave">
        Estado de la cuota de los alumnos activos. Para registrar un pago, entrá a la ficha del alumno.
      </p>

      {error && <p className="mensaje-error">{error}</p>}

      {filas && (
        <>
          <div className="filtros-chips">
            {FILTROS.map((f) => (
              <button
                key={f.valor}
                type="button"
                className={f.valor === filtro ? "chip chip-activo" : "chip"}
                onClick={() => setFiltro(f.valor)}
              >
                {f.etiqueta} ({filas.filter(f.cumple).length})
              </button>
            ))}
          </div>

          {visibles.length === 0 ? (
            <p className="texto-suave">No hay alumnos en esta categoría.</p>
          ) : (
            <div className="tabla-contenedor">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Alumno</th>
                    <th>Plan</th>
                    <th>Estado</th>
                    <th>Vencimiento</th>
                    <th className="numero">Saldo pendiente</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((fila) => (
                    <tr key={fila.id}>
                      <td>
                        <Link to={`/alumnos/${fila.id}`}>
                          {fila.apellido}, {fila.nombre}
                        </Link>
                      </td>
                      <td>{fila.plan ?? <span className="texto-suave">Sin plan</span>}</td>
                      <td>
                        <span className={claseEstadoCuota(fila.estado)}>{ETIQUETAS_ESTADO_CUOTA[fila.estado]}</span>
                      </td>
                      <td>{textoVencimiento(fila.estado, fila.vence, fila.diasRestantes)}</td>
                      <td className="numero sin-salto">
                        {Number(fila.deudaTotal) > 0 ? formatearMoneda(fila.deudaTotal) : <span className="texto-suave">—</span>}
                      </td>
                      <td className="sin-salto">
                        {requiereAviso(fila) && (
                          <a className="boton-whatsapp" href={linkWhatsApp(fila)} target="_blank" rel="noopener noreferrer">
                            WhatsApp
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
