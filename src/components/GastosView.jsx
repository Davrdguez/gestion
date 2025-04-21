import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import Papa from 'papaparse';

export default function GastosView() {
  const [gastos, setGastos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);
  const [etiquetasMap, setEtiquetasMap] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    const [gastosResult, categoriasResult, etiquetasResult, relacionesResult] = await Promise.all([
      supabase.from('gastos').select('*').order('fecha', { ascending: false }),
      supabase.from('categorias').select('*').eq('tipo', 'gasto').order('nombre'),
      supabase.from('etiquetas').select('*').order('nombre'),
      supabase.from('gasto_etiqueta').select('*'),
    ]);

    const etiquetasByGasto = {};
    relacionesResult.data?.forEach(({ gasto_id, etiqueta_id }) => {
      if (!etiquetasByGasto[gasto_id]) etiquetasByGasto[gasto_id] = [];
      const nombreEtiqueta = etiquetasResult.data.find(et => et.id === etiqueta_id)?.nombre;
      if (nombreEtiqueta) etiquetasByGasto[gasto_id].push(nombreEtiqueta);
    });

    setGastos(gastosResult.data || []);
    setCategorias(categoriasResult.data || []);
    setEtiquetas(etiquetasResult.data || []);
    setEtiquetasMap(etiquetasByGasto);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;

    const nuevoGasto = {
      descripcion: form.descripcion.value,
      cantidad: parseFloat(form.cantidad.value),
      fecha: form.fecha.value,
      categoria: form.categoria.value,
      cliente: form.cliente.value
    };

    const { data, error } = await supabase
      .from('gastos')
      .insert([nuevoGasto])
      .select();

    if (error) {
      console.error('❌ Error al insertar gasto:', error);
      return;
    }

    const etiquetasSeleccionadas = Array.from(
      form.querySelectorAll('input[name="etiquetas"]:checked')
    ).map((input) => input.value);

    if (etiquetasSeleccionadas.length > 0) {
      const relaciones = etiquetasSeleccionadas.map((id) => ({
        gasto_id: data[0].id,
        etiqueta_id: id
      }));

      const { error: etiquetasError } = await supabase.from('gasto_etiqueta').insert(relaciones);
      if (etiquetasError) console.error('❌ Error al vincular etiquetas:', etiquetasError);
    }

    form.reset();
    fetchAll();
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('gastos').delete().eq('id', id);
    if (error) {
      console.error('❌ Error al eliminar gasto:', error);
    } else {
      fetchAll();
    }
  };

  const exportCSV = () => {
    const filas = gastos.map((gasto) => ({
      Descripción: gasto.descripcion,
      Cantidad: gasto.cantidad,
      Fecha: gasto.fecha,
      Cliente: gasto.cliente,
      Categoría: gasto.categoria,
      Etiquetas: (etiquetasMap[gasto.id] || []).join(', ')
    }));

    const csv = Papa.unparse(filas);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'gastos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow mb-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <input type="text" name="descripcion" required className="w-full border border-gray-300 rounded p-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Cantidad (€)</label>
            <input type="number" name="cantidad" step="0.01" required className="w-full border border-gray-300 rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha</label>
            <input type="date" name="fecha" required className="w-full border border-gray-300 rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cliente</label>
            <input type="text" name="cliente" required className="w-full border border-gray-300 rounded p-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Categoría</label>
          <select name="categoria" required className="w-full border border-gray-300 rounded p-2">
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
        <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
          Añadir gasto
        </button>
      </form>

      <div className="mb-4">
        <button
          onClick={exportCSV}
          className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          Exportar a CSV
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-4">Lista de gastos</h2>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="min-w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2">Descripción</th>
                <th className="px-4 py-2">Cantidad (€)</th>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2">Categoría</th>
                <th className="px-4 py-2">Etiquetas</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {gastos.map((gasto) => (
                <tr key={gasto.id}>
                  <td className="px-4 py-2">{gasto.descripcion}</td>
                  <td className="px-4 py-2 text-red-600 font-medium">– {gasto.cantidad.toFixed(2)}</td>
                  <td className="px-4 py-2">{gasto.fecha}</td>
                  <td className="px-4 py-2">{gasto.cliente}</td>
                  <td className="px-4 py-2">{gasto.categoria}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {(etiquetasMap[gasto.id] || []).join(', ')}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleDelete(gasto.id)}
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
