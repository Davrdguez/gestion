import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import Papa from 'papaparse';

export default function IngresosView() {
  const [ingresos, setIngresos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);
  const [etiquetasMap, setEtiquetasMap] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    const [ingresosResult, categoriasResult, etiquetasResult, relacionesResult] = await Promise.all([
      supabase.from('ingresos').select('*').order('fecha', { ascending: false }),
      supabase.from('categorias').select('*').eq('tipo', 'ingreso').order('nombre'),
      supabase.from('etiquetas').select('*').order('nombre'),
      supabase.from('ingreso_etiqueta').select('*'),
    ]);

    const etiquetasByIngreso = {};
    relacionesResult.data?.forEach(({ ingreso_id, etiqueta_id }) => {
      if (!etiquetasByIngreso[ingreso_id]) etiquetasByIngreso[ingreso_id] = [];
      const nombreEtiqueta = etiquetasResult.data.find(et => et.id === etiqueta_id)?.nombre;
      if (nombreEtiqueta) etiquetasByIngreso[ingreso_id].push(nombreEtiqueta);
    });

    setIngresos(ingresosResult.data || []);
    setCategorias(categoriasResult.data || []);
    setEtiquetas(etiquetasResult.data || []);
    setEtiquetasMap(etiquetasByIngreso);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;

    const nuevoIngreso = {
      descripcion: form.descripcion.value,
      cantidad: parseFloat(form.cantidad.value),
      fecha: form.fecha.value,
      categoria: form.categoria.value,
      cliente: form.cliente.value
    };

    const { data, error } = await supabase
      .from('ingresos')
      .insert([nuevoIngreso])
      .select();

    if (error) {
      console.error('❌ Error al insertar ingreso:', error);
      return;
    }

    const etiquetasSeleccionadas = Array.from(
      form.querySelectorAll('input[name="etiquetas"]:checked')
    ).map((input) => input.value);

    if (etiquetasSeleccionadas.length > 0) {
      const relaciones = etiquetasSeleccionadas.map((id) => ({
        ingreso_id: data[0].id,
        etiqueta_id: id
      }));

      const { error: etiquetasError } = await supabase.from('ingreso_etiqueta').insert(relaciones);
      if (etiquetasError) console.error('❌ Error al vincular etiquetas:', etiquetasError);
    }

    form.reset();
    fetchAll();
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('ingresos').delete().eq('id', id);
    if (error) {
      console.error('❌ Error al eliminar ingreso:', error);
    } else {
      fetchAll();
    }
  };

  const exportCSV = () => {
    const filas = ingresos.map((ingreso) => ({
      Descripción: ingreso.descripcion,
      Cantidad: ingreso.cantidad,
      Fecha: ingreso.fecha,
      Cliente: ingreso.cliente,
      Categoría: ingreso.categoria,
      Etiquetas: (etiquetasMap[ingreso.id] || []).join(', ')
    }));

    const csv = Papa.unparse(filas);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ingresos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl px-4 mx-auto">
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <input type="text" name="descripcion" required className="w-full border border-gray-300 rounded p-2 text-sm" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Cantidad (€)</label>
            <input type="number" name="cantidad" step="0.01" required className="w-full border border-gray-300 rounded p-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha</label>
            <input type="date" name="fecha" required className="w-full border border-gray-300 rounded p-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cliente</label>
            <input type="text" name="cliente" required className="w-full border border-gray-300 rounded p-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Categoría</label>
          <select name="categoria" required className="w-full border border-gray-300 rounded p-2 text-sm">
            <option value="">Selecciona una categoría</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Etiquetas (cuentas contables)</label>
          <div className="flex flex-wrap gap-2">
            {etiquetas.map((etiqueta) => (
              <label key={etiqueta.id} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  name="etiquetas"
                  value={etiqueta.id}
                  className="rounded border-gray-300"
                />
                {etiqueta.nombre}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm w-full sm:w-auto">
            Añadir ingreso
          </button>
          <button onClick={exportCSV} type="button" className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 text-sm w-full sm:w-auto">
            Exportar a CSV
          </button>
        </div>
      </form>

      <h2 className="text-lg md:text-xl font-semibold">Lista de ingresos</h2>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-2 py-2 md:px-4">Descripción</th>
                <th className="px-2 py-2 md:px-4">Cantidad (€)</th>
                <th className="px-2 py-2 md:px-4">Fecha</th>
                <th className="px-2 py-2 md:px-4">Cliente</th>
                <th className="px-2 py-2 md:px-4">Categoría</th>
                <th className="px-2 py-2 md:px-4">Etiquetas</th>
                <th className="px-2 py-2 md:px-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {ingresos.map((ingreso) => (
                <tr key={ingreso.id}>
                  <td className="px-2 py-2 md:px-4">{ingreso.descripcion}</td>
                  <td className="px-2 py-2 md:px-4 text-green-600 font-medium">+ {ingreso.cantidad.toFixed(2)}</td>
                  <td className="px-2 py-2 md:px-4">{ingreso.fecha}</td>
                  <td className="px-2 py-2 md:px-4">{ingreso.cliente}</td>
                  <td className="px-2 py-2 md:px-4">{ingreso.categoria}</td>
                  <td className="px-2 py-2 md:px-4 text-sm text-gray-600">
                    {(etiquetasMap[ingreso.id] || []).join(', ')}
                  </td>
                  <td className="px-2 py-2 md:px-4">
                    <button
                      onClick={() => handleDelete(ingreso.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
