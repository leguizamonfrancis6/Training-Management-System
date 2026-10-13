import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Layout from "./componentes/Layout";
import RutaProtegida from "./componentes/RutaProtegida";
import { ProveedorSesion } from "./componentes/Sesion";
import AlumnoEvaluaciones from "./paginas/AlumnoEvaluaciones";
import AlumnoFicha from "./paginas/AlumnoFicha";
import AlumnoFormulario from "./paginas/AlumnoFormulario";
import Alumnos from "./paginas/Alumnos";
import EvaluacionFormulario from "./paginas/EvaluacionFormulario";
import Ingresos from "./paginas/Ingresos";
import Inicio from "./paginas/Inicio";
import Login from "./paginas/Login";
import Pagos from "./paginas/Pagos";
import Planes from "./paginas/Planes";
import Pruebas from "./paginas/Pruebas";

export default function App() {
  return (
    <BrowserRouter>
      <ProveedorSesion>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Todo lo de adentro requiere sesión */}
          <Route element={<RutaProtegida />}>
            <Route element={<Layout />}>
              <Route index element={<Inicio />} />
              <Route path="alumnos" element={<Alumnos />} />
              <Route path="alumnos/nuevo" element={<AlumnoFormulario />} />
              <Route path="alumnos/:id" element={<AlumnoFicha />} />
              <Route path="alumnos/:id/editar" element={<AlumnoFormulario />} />
              <Route path="alumnos/:id/evaluaciones" element={<AlumnoEvaluaciones />} />
              <Route path="alumnos/:id/evaluaciones/nueva" element={<EvaluacionFormulario />} />
              <Route path="evaluaciones/:evaluacionId/editar" element={<EvaluacionFormulario />} />
              <Route path="pruebas" element={<Pruebas />} />
              <Route path="pagos" element={<Pagos />} />
              <Route path="ingresos" element={<Ingresos />} />
              <Route path="planes" element={<Planes />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProveedorSesion>
    </BrowserRouter>
  );
}
