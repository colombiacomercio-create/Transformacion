import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-brand-ivory items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Link href="/" className="self-start text-brand-slate hover:text-brand-primary flex items-center gap-2 mb-6 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
          <div className="w-12 h-12 rounded-xl bg-brand-blue flex items-center justify-center text-white font-bold font-heading text-xl mb-4 shadow-sm">
            G
          </div>
          <h1 className="font-heading font-bold text-2xl text-brand-primary">Iniciar sesión</h1>
          <p className="text-brand-slate text-sm mt-2 text-center">
            Bienvenido de nuevo al Gestor Inteligente
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-brand-slate/10 p-8">
          <form className="flex flex-col gap-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-primary mb-1">
                Correo electrónico
              </label>
              <input 
                type="email" 
                id="email" 
                className="w-full px-4 py-2 border border-brand-slate/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-all bg-gray-50/50"
                placeholder="tu@correo.com"
                required
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-brand-primary">
                  Contraseña
                </label>
                <Link href="#" className="text-xs text-brand-blue hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input 
                type="password" 
                id="password" 
                className="w-full px-4 py-2 border border-brand-slate/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-all bg-gray-50/50"
                placeholder="••••••••"
                required
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-medium py-2.5 rounded-lg transition-colors mt-2"
            >
              Iniciar sesión
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-brand-slate">
            <span>¿No tienes una cuenta?</span>
            <Link href="/registro" className="text-brand-blue hover:underline font-medium">
              Crea tu cuenta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
