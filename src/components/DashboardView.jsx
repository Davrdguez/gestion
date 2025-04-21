import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function DashboardView() {
  const [ingresos, setIngresos] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: ingresosData, error: ingresosError } = await supabase
        .from('ingresos')
        .select('*');

      const { data: gastosData, error: gastosError } = await supabase
        .from('gastos')
        .select('*');

      if (ingresosError) console.error('Error cargando ingresos:', ingresosError);
      if (gastosError) console.error('Error cargando gastos:', gastosError);

      setIngresos(ingresosData || []);
      setGastos(gastosData || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  const totalIngresos = ingresos.reduce((acc, cur) => acc + cur.cantidad, 0);
  const totalGastos = gastos.reduce((acc, cur) => acc + cur.cantidad, 0);
  const balance = totalIngresos - totalGastos;

  const ultimosMovimientos = [
    ...ingresos.map((item) => ({ ...item, tipo: 'ingreso' })),
    ...gastos.map((item) => ({ ...item, tipo: 'gasto' })),
  ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Resumen General</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="text-sm text-gray-500">Ingresos Totales</h2>
          <p className="text-2xl font-bold text-green-600">+ {totalIngresos.toFixed(2)} €</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="text-sm text-gray-500">Gastos Totales</h2>
          <p className="text-2xl font-bold text-red-600">– {totalGastos.toFixed(2)} €</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="text-sm text-gray-500">Balance</h2>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {balance >= 0 ? '+' : '–'} {Math.abs(balance).toFixed(2)} €
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold mb-2">Últimos movimientos</h2>

        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {ultimosMovimientos.map((mov, index) => (
              <li key={index} className="py-2 flex justify-between">
                <span>{mov.descripcion}</span>
                <span className={`font-medium ${mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                  {mov.tipo === 'ingreso' ? '+' : '–'} {mov.cantidad.toFixed(2)} €
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
