import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { authApi } from "../api/auth";
import { ErrorApi } from "../api/cliente";
import Campo from "../componentes/Campo";

// Cambio de contraseña del usuario. Las demás sesiones abiertas (ej.: en otra computadora) se cierran.
export default function CambiarPassword() {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repeticion, setRepeticion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState("");
  const [errores, setErrores] = useState<Record<string, string[]>>({});

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setErrores({});
    if (nueva !== repeticion) {
      setErrores({ repeticion: ["Las contraseñas no coinciden"] });
      return;
    }
    setGuardando(true);
    try {
      await authApi.cambiarPassword(actual, nueva);
      setListo(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar la contraseña");
      if (err instanceof ErrorApi) setErrores(err.campos);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section>
      <Link to="/" className="volver">
        ← Inicio
      </Link>
      <h1>Cambiar contraseña</h1>

      {listo ? (
        <div className="tarjeta seccion">
          <p>La contraseña se cambió. Si había otra sesión abierta, se cerró.</p>
          <Link to="/" className="boton">
            Volver al inicio
          </Link>
        </div>
      ) : (
        <form className="tarjeta seccion" onSubmit={enviar} noValidate>
          {error && <p className="mensaje-error">{error}</p>}
          <div className="grilla">
            <Campo etiqueta="Contraseña actual" obligatorio errores={errores.actual}>
              <input type="password" value={actual} onChange={(e) => setActual(e.target.value)} autoComplete="current-password" />
            </Campo>
            <Campo etiqueta="Contraseña nueva" obligatorio errores={errores.nueva} ayuda="Al menos 8 caracteres">
              <input type="password" value={nueva} onChange={(e) => setNueva(e.target.value)} autoComplete="new-password" />
            </Campo>
            <Campo etiqueta="Repetir contraseña nueva" obligatorio errores={errores.repeticion}>
              <input type="password" value={repeticion} onChange={(e) => setRepeticion(e.target.value)} autoComplete="new-password" />
            </Campo>
          </div>
          <div className="acciones">
            <button type="submit" className="boton" disabled={guardando}>
              {guardando ? "Guardando…" : "Cambiar contraseña"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
