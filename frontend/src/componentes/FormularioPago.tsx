import { useState, type FormEvent } from "react";
import { ErrorApi } from "../api/cliente";
import { pagosApi, type CuotaResumen, type DatosPago, type MedioPago } from "../api/pagos";
import type { Plan } from "../api/planes";
import { formatearFecha, formatearMoneda, hoyComoTexto, sumarMeses } from "../utils/formato";
import { ETIQUETAS_MEDIO, importeParaEditar, textoPrecioPlan } from "../utils/pagos";
import Campo from "./Campo";

type TipoPago = DatosPago["tipo"];

interface Props {
  alumnoId: number;
  plan: Plan | null;
  cuotasConSaldo: CuotaResumen[];
  inicioCuota: string | null; // dónde empieza la cuota que se paga; null = en la fecha de pago
  cantidadAdeudadas: number;
  onGuardado: () => void;
  onCancelar: () => void;
}

// Registro de un pago: nueva cuota, saldo de una cuota anterior u otro concepto.
export default function FormularioPago({
  alumnoId,
  plan,
  cuotasConSaldo,
  inicioCuota,
  cantidadAdeudadas,
  onGuardado,
  onCancelar,
}: Props) {
  // Si el plan todavía no tiene precio (0), el importe queda vacío para completarlo a mano.
  const precioPlan = plan && Number(plan.precioMensual) > 0 ? importeParaEditar(plan.precioMensual) : "";
  // Si hay saldo pendiente se propone pagarlo primero; si no, una cuota nueva.
  const [tipo, setTipo] = useState<TipoPago>(cuotasConSaldo.length > 0 ? "SALDO" : "CUOTA");
  const [fecha, setFecha] = useState(hoyComoTexto());
  const [medio, setMedio] = useState<MedioPago>("EFECTIVO");
  const [importeCuota, setImporteCuota] = useState(precioPlan);
  const [cuotaId, setCuotaId] = useState(cuotasConSaldo[0]?.id ?? 0);
  const [importe, setImporte] = useState(
    cuotasConSaldo.length > 0 ? importeParaEditar(cuotasConSaldo[0].saldo) : precioPlan,
  );
  const [concepto, setConcepto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [errores, setErrores] = useState<Record<string, string[]>>({});

  // Al cambiar de tipo se propone el importe que corresponde.
  function cambiarTipo(nuevo: TipoPago) {
    setTipo(nuevo);
    setErrores({});
    setError("");
    if (nuevo === "SALDO") setImporte(importeParaEditar(cuotasConSaldo.find((c) => c.id === cuotaId)?.saldo ?? 0));
    if (nuevo === "OTRO") setImporte("");
  }

  function cambiarCuota(id: number) {
    setCuotaId(id);
    setImporte(importeParaEditar(cuotasConSaldo.find((c) => c.id === id)?.saldo ?? 0));
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setErrores({});
    setGuardando(true);

    let datos: DatosPago;
    // La cuota se paga completa: lo que paga es el importe de la cuota.
    if (tipo === "CUOTA") datos = { tipo, fecha, importeCuota, importe: importeCuota, medio };
    else if (tipo === "SALDO") datos = { tipo, cuotaId, fecha, importe, medio };
    else datos = { tipo, fecha, importe, concepto, medio };

    try {
      await pagosApi.registrar(alumnoId, datos);
      onGuardado();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el pago");
      if (err instanceof ErrorApi) setErrores(err.campos);
    } finally {
      setGuardando(false);
    }
  }

  // Avisos mientras se escribe.
  const sinPlan = tipo === "CUOTA" && !plan;

  return (
    <form className="formulario-pago" onSubmit={enviar} noValidate>
      <h3>Registrar pago</h3>
      {error && <p className="mensaje-error">{error}</p>}

      <div className="opciones-tipo" role="radiogroup" aria-label="Tipo de pago">
        <label>
          <input type="radio" checked={tipo === "CUOTA"} onChange={() => cambiarTipo("CUOTA")} />
          Cuota mensual
        </label>
        {cuotasConSaldo.length > 0 && (
          <label>
            <input type="radio" checked={tipo === "SALDO"} onChange={() => cambiarTipo("SALDO")} />
            Saldo pendiente
          </label>
        )}
        <label>
          <input type="radio" checked={tipo === "OTRO"} onChange={() => cambiarTipo("OTRO")} />
          Otro concepto
        </label>
      </div>

      {sinPlan && (
        <p className="mensaje-error">
          El alumno no tiene una membresía asignada. Asignásela desde su ficha (Cuota y pagos) o desde Pagos → Membresías para registrar cuotas.
        </p>
      )}

      <div className="grilla">
        <Campo etiqueta="Fecha de pago" obligatorio errores={errores.fecha}>
          <input type="date" value={fecha} max={hoyComoTexto()} onChange={(e) => setFecha(e.target.value)} />
        </Campo>
        <Campo etiqueta="Medio de pago" obligatorio errores={errores.medio}>
          <select value={medio} onChange={(e) => setMedio(e.target.value as MedioPago)}>
            {Object.entries(ETIQUETAS_MEDIO).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </Campo>

        {tipo === "CUOTA" && (
          <Campo
            etiqueta="Importe de la cuota"
            obligatorio
            errores={errores.importeCuota}
            ayuda={plan ? `Precio de la membresía: ${textoPrecioPlan(plan.precioMensual)}` : undefined}
          >
            <input inputMode="decimal" value={importeCuota} onChange={(e) => setImporteCuota(e.target.value)} />
          </Campo>
        )}

        {tipo === "SALDO" && (
          <Campo etiqueta="Cuota" obligatorio errores={errores.cuotaId}>
            <select value={cuotaId} onChange={(e) => cambiarCuota(Number(e.target.value))}>
              {cuotasConSaldo.map((cuota) => (
                <option key={cuota.id} value={cuota.id}>
                  {formatearFecha(cuota.desde)} al {formatearFecha(cuota.vence)} — debe {formatearMoneda(cuota.saldo)}
                </option>
              ))}
            </select>
          </Campo>
        )}

        {tipo === "OTRO" && (
          <Campo etiqueta="Concepto" obligatorio errores={errores.concepto}>
            <input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Ej.: remera, evaluación extra" />
          </Campo>
        )}

        {tipo !== "CUOTA" && (
          <Campo etiqueta="Importe" obligatorio errores={errores.importe}>
            <input inputMode="decimal" value={importe} onChange={(e) => setImporte(e.target.value)} placeholder="Ej.: 25.000" />
          </Campo>
        )}
      </div>

      {tipo === "CUOTA" && (inicioCuota || /^\d{4}-\d{2}-\d{2}$/.test(fecha)) && (
        <p className="texto-suave">
          La cuota cubre del {formatearFecha(inicioCuota ?? fecha)} al {formatearFecha(sumarMeses(inicioCuota ?? fecha, 1))}.
          {cantidadAdeudadas > 1 && ` Debe ${cantidadAdeudadas} cuotas: este pago cubre la más vieja.`}
        </p>
      )}

      <div className="acciones">
        <button type="submit" className="boton" disabled={guardando || sinPlan}>
          {guardando ? "Guardando…" : "Registrar pago"}
        </button>
        <button type="button" className="boton-secundario" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
