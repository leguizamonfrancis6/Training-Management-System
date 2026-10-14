import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Layout from "./componentes/Layout";
import RutaProtegida from "./componentes/RutaProtegida";
import { ProveedorSesion } from "./componentes/Sesion";
import AlumnoEvaluaciones from "./paginas/AlumnoEvaluaciones";
import AlumnoFicha from "./paginas/AlumnoFicha";
import AlumnoFormulario from "./paginas/AlumnoFormulario";
import Alumnos from "./paginas/Alumnos";
import EditorRutina from "./paginas/EditorRutina";
import EvaluacionDetalle from "./paginas/EvaluacionDetalle";
import EvaluacionFormulario from "./paginas/EvaluacionFormulario";
import Evaluaciones from "./paginas/Evaluaciones";
import GestionPlanes from "./paginas/GestionPlanes";
import Ingresos from "./paginas/Ingresos";
import Inicio from "./paginas/Inicio";
import Login from "./paginas/Login";
import PagoNuevo from "./paginas/PagoNuevo";
import Pagos from "./paginas/Pagos";
import Planes from "./paginas/Planes";
import PlanesAlumno from "./paginas/PlanesAlumno";
import Pruebas from "./paginas/Pruebas";
import Rutinas from "./paginas/Rutinas";
import RutinasAlumno from "./paginas/RutinasAlumno";

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
              <Route path="evaluaciones" element={<Evaluaciones />} />
              <Route path="evaluaciones/configuracion" element={<Pruebas />} />
              <Route path="evaluaciones/:evaluacionId" element={<EvaluacionDetalle />} />
              <Route path="evaluaciones/:evaluacionId/editar" element={<EvaluacionFormulario />} />
              <Route path="pagos" element={<Pagos />} />
              <Route path="pagos/nuevo" element={<PagoNuevo />} />
              <Route
                path="pagos/configuracion"
                element={<GestionPlanes titulo="Configurar pagos" volverA="/pagos" etiquetaVolver="Pagos" />}
              />
              <Route path="ingresos" element={<Ingresos />} />
              {/* Membresías: se gestionan desde Pagos */}
              <Route path="pagos/membresias" element={<Planes />} />
              <Route path="pagos/membresias/:id" element={<PlanesAlumno />} />
              <Route path="rutinas" element={<Rutinas />} />
              <Route path="rutinas/:alumnoId" element={<RutinasAlumno />} />
              <Route path="rutinas/:alumnoId/nueva" element={<EditorRutina />} />
              <Route path="rutinas/editar/:rutinaId" element={<EditorRutina />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProveedorSesion>
    </BrowserRouter>
  );
}
