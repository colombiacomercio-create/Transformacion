import Link from "next/link";
import { CheckCircle2, ArrowRight, ShieldCheck, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navigation */}
      <header className="border-b border-brand-slate/20 bg-brand-ivory/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-blue flex items-center justify-center text-white font-bold font-heading">
              G
            </div>
            <span className="font-heading font-bold text-xl text-brand-primary">Gestor Inteligente</span>
          </div>
          <nav className="hidden md:flex gap-8 text-brand-slate font-medium text-sm">
            <Link href="#como-funciona" className="hover:text-brand-blue transition-colors">Cómo funciona</Link>
            <Link href="#planes" className="hover:text-brand-blue transition-colors">Planes</Link>
            <Link href="#preguntas" className="hover:text-brand-blue transition-colors">Preguntas frecuentes</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-brand-primary font-medium text-sm hover:text-brand-blue transition-colors">
              Iniciar sesión
            </Link>
            <Link href="/registro" className="bg-brand-primary hover:bg-brand-blue text-white px-5 py-2 rounded-full font-medium text-sm transition-colors shadow-sm">
              Prueba Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col">
        <section className="pt-24 pb-32 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <h1 className="font-heading font-extrabold text-5xl md:text-6xl text-brand-primary tracking-tight mb-6 leading-tight">
            Tu trabajo ya dejó evidencia. <br />
            <span className="text-brand-blue">No pierdas horas reconstruyéndolo.</span>
          </h1>
          <p className="text-lg md:text-xl text-brand-slate max-w-3xl mx-auto mb-10 leading-relaxed">
            Convierte correos, reuniones, actas, documentos y evidencias en un informe contractual organizado, verificable y profesional.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/registro" className="bg-brand-blue hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-md">
              Inicia tu prueba gratis <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#como-funciona" className="bg-white border border-brand-slate/20 text-brand-primary px-8 py-4 rounded-full font-semibold text-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
              Ver cómo funciona
            </Link>
          </div>
          <p className="mt-6 text-sm text-brand-slate flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-green" /> Tu información sigue bajo tu control.
          </p>
        </section>

        {/* Problema / Solución */}
        <section id="como-funciona" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-brand-primary mb-4">Del trabajo disperso a un expediente organizado</h2>
              <p className="text-lg text-brand-slate max-w-2xl mx-auto">La plataforma propone. Tú revisas. Tú apruebas.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-brand-ivory/50 rounded-2xl p-8 border border-brand-slate/10">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-brand-blue mb-6">
                  <span className="font-bold text-xl">1</span>
                </div>
                <h3 className="font-heading font-bold text-xl mb-3 text-brand-primary">Conecta tus fuentes</h3>
                <p className="text-brand-slate leading-relaxed">Selecciona los correos, reuniones y documentos que demuestran tu gestión mensual sin compartir tus contraseñas.</p>
              </div>
              
              <div className="bg-brand-ivory/50 rounded-2xl p-8 border border-brand-slate/10 relative">
                <div className="hidden md:block absolute top-1/2 -left-4 w-8 h-[2px] bg-brand-slate/20"></div>
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-[2px] bg-brand-slate/20"></div>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-brand-amber mb-6">
                  <span className="font-bold text-xl">2</span>
                </div>
                <h3 className="font-heading font-bold text-xl mb-3 text-brand-primary">Organiza e Inteligencia</h3>
                <p className="text-brand-slate leading-relaxed">Detectamos duplicidades, extraemos tus obligaciones del informe anterior y redactamos la actividad con tono profesional.</p>
              </div>
              
              <div className="bg-brand-ivory/50 rounded-2xl p-8 border border-brand-slate/10">
                <div className="w-12 h-12 bg-brand-green text-white rounded-xl flex items-center justify-center shadow-sm mb-6">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-xl mb-3 text-brand-primary">Revisa y Exporta</h3>
                <p className="text-brand-slate leading-relaxed">Tú tienes el control final. Aprueba los hallazgos y genera automáticamente un ZIP con tu Word, Excel, PDF y evidencias numeradas.</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Call to action final */}
        <section className="py-24 bg-brand-primary text-white text-center px-4">
          <div className="max-w-3xl mx-auto">
            <Clock className="w-16 h-16 mx-auto text-brand-blue mb-6 opacity-80" />
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-6">Dedica tu tiempo a generar resultados, no a reconstruirlos</h2>
            <p className="text-xl text-brand-ivory/80 mb-10">Miles de horas se pierden cada fin de mes en tareas operativas. Únete a los profesionales que han recuperado su tiempo.</p>
            <Link href="/registro" className="bg-brand-blue hover:bg-blue-400 text-white px-8 py-4 rounded-full font-bold text-lg inline-flex transition-colors shadow-lg shadow-brand-blue/20">
              Comenzar prueba gratis ahora
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-brand-slate/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-brand-slate text-sm">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-brand-blue flex items-center justify-center text-white font-bold font-heading text-xs">
              G
            </div>
            <span className="font-heading font-bold text-brand-primary text-base">Gestor Inteligente</span>
          </div>
          <p>© {new Date().getFullYear()} Gestor Inteligente de Informes. Todos los derechos reservados.</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="#" className="hover:text-brand-blue">Términos de servicio</Link>
            <Link href="#" className="hover:text-brand-blue">Política de privacidad</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
