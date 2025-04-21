import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const toggleMenu = () => setOpen(!open);

  return (
    <nav className="bg-white shadow-md md:hidden px-4 py-3 sticky top-0 z-50">
      <div className="flex justify-between items-center">
        <a href="/" className="text-lg font-bold text-blue-600">Gestión</a>
        <button onClick={toggleMenu} className="text-gray-700">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="mt-3 flex flex-col gap-3">
          <a href="/ingresos" className="hover:text-blue-600">Ingresos</a>
          <a href="/gastos" className="hover:text-blue-600">Gastos</a>
          <a href="/categorias" className="hover:text-blue-600">Categorías</a>
          <a href="/graficos" className="hover:text-blue-600">Gráficos</a>
        </div>
      )}
    </nav>
  );
}
