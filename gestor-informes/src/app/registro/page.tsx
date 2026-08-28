import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-brand-ivory items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        
        {/* Lado izquierdo - Beneficios */}
        <div className="hidden md:flex flex-col pr-8">
          <Link href="/" className="self-start text-brand-slate hover:text-brand-primary flex items-center gap-2 mb-10 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
          <div className="w-12 h-12 rounded-xl bg-brand-blue flex items-center justify-center text-white font-bold font-heading text-xl mb-6 shadow-sm">
            G
          </div>
          <h2 className="font-heading font-extrabold text-4xl text-brand-primary mb-6 leading-tight">
            Prueba gratis cómo quedaría tu informe.
          </h2>
          
          <ul className="space-y-4">
            <li className="flex items-start gap-3 text-brand-slate">
              <CheckCircle2 className="w-5 h-5 text-brand-green mt-0.5 shrink-0" />
              <span>Conecta tus fuentes de manera segura (sin compartir contraseñas).</span>
            </li>
            <li className="flex items-start gap-3 text-brand-slate">
              <CheckCircle2 className="w-5 h-5 text-brand-green mt-0.5 shrink-0" />
              <span>Extrae automáticamente tus obligaciones del contrato anterior.</span>
            </li>
            <li className="flex items-start gap-3 text-brand-slate">
              <CheckCircle2 className="w-5 h-5 text-brand-green mt-0.5 shrink-0" />
              <span>Genera un informe preliminar con 1 actividad por obligación.</span>
            </li>
          </ul>
        </div>

        {/* Lado derecho - Formulario */}
        <div className="bg-white rounded-3xl shadow-sm border border-brand-slate/10 p-8 md:p-10">
          <div className="md:hidden mb-8 flex flex-col items-center">
            <Link href="/" className="self-start text-brand-slate hover:text-brand-primary flex items-center gap-2 mb-6 text-sm font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Link>
            <h1 className="font-heading font-bold text-2xl text-brand-primary">Crea tu cuenta</h1>
          </div>
          
          <h2 className="hidden md:block font-heading font-bold text-2xl text-brand-primary mb-6">Regístrate</h2>
          
          <form className="flex flex-col gap-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-brand-primary mb-1">
                Nombre completo
              </label>
              <input 
                type="text" 
                id="name" 
                className="w-full px-4 py-2 border border-brand-slate/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-all bg-gray-50/50"
                placeholder="Ej. Roberto Carlos"
                required
              />
            </div>

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
              <label htmlFor="password" className="block text-sm font-medium text-brand-primary mb-1">
                Contraseña
              </label>
              <input 
                type="password" 
                id="password" 
                className="w-full px-4 py-2 border border-brand-slate/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-all bg-gray-50/50"
                placeholder="Mínimo 8 caracteres"
                required
              />
            </div>

            <p className="text-xs text-brand-slate mt-1">
              Al registrarte, aceptas nuestros <Link href="#" className="text-brand-blue hover:underline">Términos de servicio</Link> y <Link href="#" className="text-brand-blue hover:underline">Política de privacidad</Link>.
            </p>

            <button 
              type="submit" 
              className="w-full bg-brand-blue hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors mt-2 shadow-md shadow-brand-blue/20"
            >
              Comenzar prueba gratuita
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-brand-slate/10 text-center text-sm text-brand-slate">
            <span>¿Ya tienes una cuenta?</span>
            <Link href="/login" className="ml-2 text-brand-primary hover:text-brand-blue font-bold transition-colors">
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
