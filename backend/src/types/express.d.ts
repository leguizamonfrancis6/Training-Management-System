// Agrega a Request de Express la propiedad "usuario", que completa el middleware requiereSesion.
import type { UsuarioSesion } from "../modulos/auth/auth.service";

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioSesion;
    }
  }
}

export {};
