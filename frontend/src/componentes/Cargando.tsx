// Lo que se muestra mientras una pantalla espera sus datos: "Cargando…" o el error, si falló.
export default function Cargando({ error }: { error: string }) {
  return error ? <p className="mensaje-error">{error}</p> : <p className="texto-suave">Cargando…</p>;
}
