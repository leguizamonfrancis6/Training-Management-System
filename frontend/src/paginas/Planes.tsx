import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ErrorApi } from "../api/cliente";
import { planesApi, type DatosPlan, type Plan } from "../api/planes";
import Campo from "../componentes/Campo";
import { formatearMoneda } from "../utils/formato";
import { ETIQUETAS_MODALIDAD, importeParaEditar } from "../utils/pagos";

const PLAN_VACIO: DatosPlan = { nombre: "", modalidad: "", precioMensual: "", activo: true };

interface PropsFormulario {
  inicial: DatosPlan;
  textoBoton: string;
  onGuardar: (datos: DatosPlan) => Promise<void>;
  onCancelar?: () => void;
}

function FormularioPlan({ inicial, textoBoton, onGuardar, onCancelar }: PropsFormulario) {
  const [datos, setDatos] = useState(inicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [errores, setErrores] = useState<Record<string, string[]>>({});

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setErrores({});
    setGuardando(true);
    try {
      await onGuardar(datos);
      setDatos(PLAN_VACIO);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
      if (err instanceof ErrorApi) setErrores(err.campos);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      {error && <p className="mensaje-error">{error}</p>}
      <div className="formulario-prueba">
        <Campo etiqueta="Nombre" obligatorio errores={errores.nombre}>
          <input
            value={datos.nombre}
            onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
            placeholder="Ej.: 3 veces por semana"
          />
        </Campo>
        <Campo etiqueta="Modalidad" obligatorio errores={errores.modalidad}>
          <select
            value={datos.modalidad}
            onChange={(e) => setDatos({ ...datos, modalidad: e.target.value as DatosPlan["modalidad"] })}
          >
            <option value="">Elegí…</option>
            {Object.entries(ETIQUETAS_MODALIDAD).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Precio mensual" obligatorio errores={errores.precioMensual}>
          <input
            inputMode="decimal"
            value={datos.precioMensual}
            onChange={(e) => setDatos({ ...datos, precioMensual: e.target.value })}
            placeholder="Ej.: 25.000"
          />
        </Campo>
        <div className="acciones formulario-prueba-acciones">
          <button type="submit" className="boton" disabled={guardando}>
            {guardando ? "Guardando…" : textoBoton}
          </button>
          {onCancelar && (
            <button type="button" className="boton-secundario" onClick={onCancelar}>
              Cancelar
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function datosDesdePlan(plan: Plan): DatosPlan {
  return { ...plan, precioMensual: importeParaEditar(plan.precioMensual) };
}

// Planes de entrenamiento con su precio mensual.
export default function Planes() {
  const [planes, setPlanes] = useState<Plan[] | null>(null);
  const [incluirInactivos, setIncluirInactivos] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setPlanes(await planesApi.listar(incluirInactivos));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los planes");
    }
  }, [incluirInactivos]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crear(datos: DatosPlan) {
    await planesApi.crear(datos);
    await cargar();
  }

  async function actualizar(id: number, datos: DatosPlan) {
    await planesApi.actualizar(id, datos);
    setEditandoId(null);
    await cargar();
  }

  // "Eliminar" desactiva el plan (las cuotas ya cobradas lo siguen referenciando); "Restaurar" lo reactiva.
  async function alternarActivo(plan: Plan) {
    if (plan.activo && !window.confirm(`¿Eliminar "${plan.nombre}"? Se puede restaurar más adelante.`)) {
      return;
    }
    try {
      await planesApi.actualizar(plan.id, { ...datosDesdePlan(plan), activo: !plan.activo });
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar");
    }
  }

  return (
    <section>
      <h1>Planes</h1>
      <p className="texto-suave">
        Planes de entrenamiento y su precio mensual. Cambiar un precio no modifica las cuotas ya cobradas.
      </p>

      <div className="tarjeta seccion">
        <h2>Nuevo plan</h2>
        <FormularioPlan inicial={PLAN_VACIO} textoBoton="Agregar" onGuardar={crear} />
      </div>

      {error && <p className="mensaje-error">{error}</p>}

      <label className="casilla">
        <input type="checkbox" checked={incluirInactivos} onChange={(e) => setIncluirInactivos(e.target.checked)} />
        Mostrar también los eliminados
      </label>

      {planes &&
        (planes.length === 0 ? (
          <p className="texto-suave">Todavía no hay planes cargados.</p>
        ) : (
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Modalidad</th>
                  <th className="numero">Precio mensual</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {planes.map((plan) =>
                  editandoId === plan.id ? (
                    <tr key={plan.id}>
                      <td colSpan={5}>
                        <FormularioPlan
                          inicial={datosDesdePlan(plan)}
                          textoBoton="Guardar"
                          onGuardar={(datos) => actualizar(plan.id, datos)}
                          onCancelar={() => setEditandoId(null)}
                        />
                      </td>
                    </tr>
                  ) : (
                    <tr key={plan.id}>
                      <td>{plan.nombre}</td>
                      <td>{ETIQUETAS_MODALIDAD[plan.modalidad]}</td>
                      <td className="numero sin-salto">{formatearMoneda(plan.precioMensual)}</td>
                      <td>
                        <span className={plan.activo ? "insignia insignia-ok" : "insignia"}>
                          {plan.activo ? "Activo" : "Eliminado"}
                        </span>
                      </td>
                      <td className="sin-salto">
                        <button type="button" className="boton-link" onClick={() => setEditandoId(plan.id)}>
                          Editar
                        </button>
                        {plan.activo ? (
                          <button type="button" className="boton-link peligro" onClick={() => alternarActivo(plan)}>
                            Eliminar
                          </button>
                        ) : (
                          <button type="button" className="boton-link" onClick={() => alternarActivo(plan)}>
                            Restaurar
                          </button>
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        ))}
    </section>
  );
}
