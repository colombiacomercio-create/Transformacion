import os
import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    app = f.read()

# 1. Reduce radar logo
app = app.replace('className="h-16 md:h-20 w-auto object-contain"', 'className="h-12 md:h-14 w-auto object-contain"')

# 2. Put user and logout BELOW the Bogota logo
old_right = '''{/* Derecha: Logo Bogota + Usuario Desktop */}
            <div className="flex flex-col xl:items-end gap-3 w-full xl:w-auto mt-2 xl:mt-0">
              <div className="hidden xl:flex items-center gap-4 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-200">
                <span className="text-sm font-semibold text-gray-700">{userName}</span>
                <button onClick={handleLogout} className="text-xs font-bold text-bogota-primary hover:text-red-700 transition-colors uppercase tracking-wide">Salir</button>
              </div>
              <div className="hidden xl:flex items-center justify-end">
                 <img src="/Logo_Bogota.jpg" alt="Bogot\u00e1" className="h-16 md:h-20 object-contain" />
              </div>
            </div>'''
new_right = '''{/* Derecha: Logo Bogota + Usuario Desktop */}
            <div className="flex flex-col xl:items-end gap-2 w-full xl:w-auto mt-2 xl:mt-0">
              <div className="hidden xl:flex items-center justify-end">
                 <img src="/Logo_Bogota.jpg" alt="Bogot\u00e1" className="h-16 md:h-20 object-contain" />
              </div>
              <div className="hidden xl:flex items-center gap-4 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                <span className="text-xs font-semibold text-gray-700">{userName}</span>
                <button onClick={handleLogout} className="text-xs font-bold text-bogota-primary hover:text-red-700 transition-colors uppercase tracking-wide">Salir</button>
              </div>
            </div>'''
app = app.replace(old_right.encode('utf-8').decode('unicode_escape'), new_right.encode('utf-8').decode('unicode_escape'))

# 3. AI assistant button -> "no se lee bien" (I made it small circular `w-14 h-14` but didn't put text? Oh, the user wants the text back!)
old_button = '''className="fixed bottom-6 right-6 w-14 h-14 bg-bogota-primary hover:bg-red-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all z-40 group" title="Asistente IA"
          >
            <Sparkles className="w-6 h-6 group-hover:animate-pulse text-bogota-secondary"/>
          </button>'''
new_button = '''className="fixed bottom-6 right-6 bg-bogota-primary hover:bg-red-700 text-white px-5 py-3 rounded-full shadow-2xl flex items-center justify-center gap-2 transition-all z-40 group border-2 border-bogota-secondary" title="Asistente IA"
          >
            <Sparkles className="w-5 h-5 group-hover:animate-pulse text-bogota-secondary"/>
            <span className="font-bold text-sm tracking-wide">Asistente IA</span>
          </button>'''
app = app.replace(old_button, new_button)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(app)
print("Updated App.tsx")
