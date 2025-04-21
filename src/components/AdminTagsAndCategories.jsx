import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminTagsAndCategories() {
  const [categorias, setCategorias] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);
  const [categoriaForm, setCategoriaForm] = useState({ nombre: '', tipo: 'ingreso' });
  const [etiquetaNombre, setEtiquetaNombre] = useState('');

  useEffect(() => {
    fetchCategorias();
    fetchEtiquetas();
  }, []);

  const fetchCategorias = async () => {
    const { data } = await supabase.from('categorias').select('*').order('nombre');
    setCategorias(data || []);
  };

  const fetchEtiquetas = async () => {
    const { data } = await supabase.from('etiquetas').select('*').order('nombre');
    setEtiquetas(data || []);
  };

  const handleAddCategoria = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('categorias')
      .insert([categoriaForm])
      .select();

    if (!error) {
      setCategorias([data[0], ...categorias]);
      setCategoriaForm({ nombre: '', tipo: 'ingreso' });
    } else {
      console.error('Error creando categoría:', error);
    }
  };

  const handleAddEtiqueta = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('etiquetas')
      .insert([{ nombre: etiquetaNombre }])
      .select();

    if (!error) {
      setEtiquetas([data[0], ...etiquetas]);
      setEtiquetaNombre('');
    } else {
      console.error('Error creando etiqueta:', error);
    }
  };

  const handleDeleteCategoria = async (id) => {
    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (!error) fetchCategorias();
    else console.error('Error eliminando categoría:', error);
  };

  const handleDeleteEtiqueta = async (id) => {
    const { error } = await supabase.from('etiquetas').delete().eq('id', id);
    if (!error) fetchEtiquetas();
    else console.error('Error eliminando etiqueta:', error);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow">
      <div>
        <h2 className="text-lg font-semibold mb-2">Añadir Categoría</h2>
        <form onSubmit={handleAddCategoria} className="space-y-3">
          <input
            type="text"
            placeholder="Nombre"
            value={categoriaForm.nombre}
            onChange={(e) => setCategoriaForm({ ...categoriaForm, nombre: e.target.value })}
            required
            className="w-full border border-gray-300 p-2 rounded"
          />
          <select
            value={categoriaForm.tipo}
            onChange={(e) => setCategoriaForm({ ...categoriaForm, tipo: e.target.value })}
            className="w-full border border-gray-300 p-2 rounded"
          >
            <option value="ingreso">Ingreso</option>
            <option value="gasto">Gasto</option>
          </select>
          <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Añadir Categoría
          </button>
        </form>

        <ul className="mt-4 text-sm text-gray-700 space-y-2">
          {categorias.map((cat) => (
            <li key={cat.id} className="flex justify-between items-center">
              <span>{cat.nombre} <span className="text-gray-400">({cat.tipo})</span></span>
              <button
                onClick={() => handleDeleteCategoria(cat.id)}
                className="text-red-500 hover:underline text-xs"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Añadir Etiqueta</h2>
        <form onSubmit={handleAddEtiqueta} className="space-y-3">
          <input
            type="text"
            placeholder="Nombre de etiqueta"
            value={etiquetaNombre}
            onChange={(e) => setEtiquetaNombre(e.target.value)}
            required
            className="w-full border border-gray-300 p-2 rounded"
          />
          <button type="submit" className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Añadir Etiqueta
          </button>
        </form>

        <ul className="mt-4 text-sm text-gray-700 space-y-2">
          {etiquetas.map((et) => (
            <li key={et.id} className="flex justify-between items-center">
              <span>{et.nombre}</span>
              <button
                onClick={() => handleDeleteEtiqueta(et.id)}
                className="text-red-500 hover:underline text-xs"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
