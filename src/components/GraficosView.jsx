import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Legend, Tooltip } from 'chart.js';
import { supabase } from '../lib/supabase';
import dayjs from 'dayjs';

ChartJS.register(BarElement, CategoryScale, LinearScale, Legend, Tooltip);

const filtros = {
  'mes': 'Último mes',
  'ano': 'Año actual',
  'ano_completo': 'Últimos 12 meses'
};

export default function GraficosView() {
  const [ingresos, setIngresos] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [filtro, setFiltro] = useState('ano');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [filtro]);

  const fetchData = async () => {
    setLoading(true);

    let fechaDesde;
    const hoy = dayjs();

    if (filtro === 'mes') {
      fechaDesde = hoy.subtract(1, 'month').format('YYYY-MM-DD');
    } else if (filtro === 'ano_completo') {
      fechaDesde = hoy.subtract(1, 'year').format('YYYY-MM-DD');
    } else {
      // Año actual
      fechaDesde = dayjs().startOf('year').format('YYYY-MM-DD');
    }

    const [ingresosResult, gastosResult] = await Promise.all([
      supabase.from('ingresos').select('*').gte('fecha', fechaDesde),
      supabase.from('gastos').select('*').gte('fecha', fechaDesde)
    ]);

    setIngresos(ingresosResult.data || []);
    setGastos(gastosResult.data || []);
    setLoading(false);
  };

  const agruparPorMes = (datos) => {
    const agrupado = {};

    datos.forEach((item) => {
      const mes = dayjs(item.fecha).format('YYYY-MM');
      agrupado[mes] = (agrupado[mes] || 0) + item.cantidad;
    });

    return agrupado;
  };

  const datosIngresos = agruparPorMes(ingresos);
  const datosGastos = agruparPorMes(gastos);
  const meses = Array.from(new Set([...Object.keys(datosIngresos), ...Object.keys(datosGastos)])).sort();

  const data = {
    labels: meses,
    datasets: [
      {
        label: 'Ingresos',
        data: meses.map(m => datosIngresos[m] || 0),
        backgroundColor: 'rgba(34,197,94,0.7)'
      },
      {
        label: 'Gastos',
        data: meses.map(m => datosGastos[m] || 0),
        backgroundColor: 'rgba(239,68,68,0.7)'
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <label className="font-medium text-sm text-gray-700">Filtrar por:</label>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="border rounded p-2 text-sm"
        >
          {Object.entries(filtros).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando datos...</p>
      ) : (
        <div className="bg-white p-4 rounded-xl shadow">
          <Bar data={data} options={options} />
        </div>
      )}
    </div>
  );
}
