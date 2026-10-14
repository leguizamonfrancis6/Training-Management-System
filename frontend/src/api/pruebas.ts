import { pedir } from "./cliente";

export type CategoriaPrueba = "FUERZA" | "POTENCIA" | "VELOCIDAD" | "MOVILIDAD" | "RESISTENCIA";

export interface Prueba {
  id: number;
  nombre: string;
  categoria: CategoriaPrueba;
  unidad: string;
  porLado: boolean; // se carga por lado (izquierdo / derecho)
  activa: boolean;
}

export interface DatosPrueba {
  nombre: string;
  categoria: CategoriaPrueba | "";
  unidad: string;
  porLado: boolean; // se carga por lado (izquierdo / derecho)
  activa: boolean;
}

export const pruebasApi = {
  listar: (incluirInactivas = false) =>
    pedir<Prueba[]>(`/pruebas${incluirInactivas ? "?incluirInactivas=true" : ""}`),

  crear: (datos: DatosPrueba) => pedir<Prueba>("/pruebas", { metodo: "POST", datos }),

  actualizar: (id: number, datos: DatosPrueba) => pedir<Prueba>(`/pruebas/${id}`, { metodo: "PUT", datos }),
};
