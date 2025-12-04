import React, { useContext } from 'react';
import { LogOut, Sun, Moon, Snowflake, Briefcase } from 'lucide-react';
import { DataContext } from '../contexts/DataContext';
import { AuthContext } from '../contexts/AuthContext';
import { Button } from './ui/Button';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { themeMode, isChristmasEnabled, isDarkMode, toggleDarkMode, toggleThemeMode } = useContext(DataContext);
  const { currentUser, logout } = useContext(AuthContext);
  const isChristmas = themeMode === 'christmas';

  // Dynamic Backgrounds
  const bgClass = isChristmas 
    ? (isDarkMode ? "bg-slate-900" : "bg-christmas-cream") 
    : (isDarkMode ? "bg-gray-900" : "bg-gray-50");

  const headerClass = isChristmas
    ? "bg-christmas-red text-white border-b-4 border-christmas-gold"
    : "bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white";

  return (
    <div className={`min-h-screen flex flex-col ${bgClass} transition-colors duration-300 font-sans relative`}>
      {/* Snow Effect Overlay */}
      {isChristmas && (
        <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden" aria-hidden="true">
            <div className="snowflake">❅</div>
            <div className="snowflake">❆</div>
            <div className="snowflake">❅</div>
            <div className="snowflake">❆</div>
            <div className="snowflake">❅</div>
            <div className="snowflake">❆</div>
            <div className="snowflake">❅</div>
            <div className="snowflake">❆</div>
            <div className="snowflake">❅</div>
            <div className="snowflake">❆</div>
        </div>
      )}

      {/* Navigation Bar */}
      <header className={`${headerClass} shadow-md sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isChristmas ? <Snowflake className="h-6 w-6 text-white animate-pulse" /> : <Briefcase className="h-6 w-6 text-blue-500" />}
            <h1 className="text-xl font-bold tracking-tight">
              {isChristmas ? "Gestor Navideño" : "Gestor de Turnos"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-sm font-semibold">{currentUser?.fullName}</span>
              <span className="text-xs opacity-80">{currentUser?.role}</span>
            </div>

            <div className="flex items-center gap-2 bg-black/10 dark:bg-white/10 p-1 rounded-lg">
              {/* Only show Christmas Toggle if Admin enabled it */}
              {isChristmasEnabled && (
                  <button
                    onClick={toggleThemeMode}
                    title="Cambiar Tema"
                    className={`p-2 rounded-md transition-colors ${isChristmas ? 'bg-white text-christmas-green' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                  >
                    <Snowflake size={18} />
                  </button>
              )}
              
              <button
                onClick={toggleDarkMode}
                title="Modo Oscuro/Claro"
                className="p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>

            <Button 
              variant="ghost" 
              isChristmas={isChristmas}
              onClick={logout} 
              className={isChristmas ? "text-white hover:bg-christmas-green" : ""}
            >
              <LogOut size={18} />
              <span className="hidden sm:inline ml-2">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10 relative">
        {children}
      </main>
      
      {isChristmas && (
        <div className="fixed bottom-0 left-0 w-full h-2 bg-christmas-gold z-50" />
      )}
    </div>
  );
};