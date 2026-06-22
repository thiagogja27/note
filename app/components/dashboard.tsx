
"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Bar } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface ProductData {
  name: string;
  value: number;
}

interface DashboardProps {
  spoutTracks: any[];
}

export function Dashboard({ spoutTracks }: DashboardProps) {
  const processDataForPieChart = (): ProductData[] => {
    if (!spoutTracks.length) return [];
    const productCount = spoutTracks.reduce((acc, track) => {
      const product = track.product || 'Não especificado';
      acc[product] = (acc[product] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(productCount).map(([name, value]) => ({ name, value }));
  };

  const processDataForTerminalBarChart = () => {
    if (!spoutTracks.length) return [];
    const durations: Record<string, { totalMinutes: number, count: number }> = { TEG: { totalMinutes: 0, count: 0 }, TEAG: { totalMinutes: 0, count: 0 } };
    spoutTracks.forEach(track => {
      if (!track.startTimestamp || !track.endTimestamp || !track.destination) return;
      const start = new Date(track.startTimestamp).getTime();
      const end = new Date(track.endTimestamp).getTime();
      const durationMinutes = (end - start) / (1000 * 60);
      if (durations[track.destination]) {
        durations[track.destination].totalMinutes += durationMinutes;
        durations[track.destination].count += 1;
      }
    });
    return Object.entries(durations).map(([name, data]) => ({
      name,
      "Tempo Médio (min)": data.count > 0 ? parseFloat((data.totalMinutes / data.count).toFixed(2)) : 0,
    }));
  };

  const processDataForCellBarChart = () => {
    if (!spoutTracks.length) return { tegData: [], teagData: [] };

    const durations: { TEG: Record<string, { totalMinutes: number, count: number }>, TEAG: Record<string, { totalMinutes: number, count: number }> } = { TEG: {}, TEAG: {} };

    spoutTracks.forEach(track => {
      if (!track.startTimestamp || !track.endTimestamp || !track.destination || !track.cell) return;
      const dest = track.destination as 'TEG' | 'TEAG';
      if (dest !== 'TEG' && dest !== 'TEAG') return;

      const start = new Date(track.startTimestamp).getTime();
      const end = new Date(track.endTimestamp).getTime();
      const durationMinutes = (end - start) / (1000 * 60);

      if (!durations[dest][track.cell]) {
        durations[dest][track.cell] = { totalMinutes: 0, count: 0 };
      }
      durations[dest][track.cell].totalMinutes += durationMinutes;
      durations[dest][track.cell].count += 1;
    });

    const calculateAverage = (data: Record<string, { totalMinutes: number, count: number }>) => {
      return Object.entries(data).map(([name, stats]) => ({
        name,
        "Tempo Médio (min)": stats.count > 0 ? parseFloat((stats.totalMinutes / stats.count).toFixed(2)) : 0,
      })).sort((a, b) => a.name.localeCompare(b.name));
    };

    return {
      tegData: calculateAverage(durations.TEG),
      teagData: calculateAverage(durations.TEAG)
    };
  };

  const pieData = processDataForPieChart();
  const terminalBarData = processDataForTerminalBarChart();
  const { tegData: tegCellBarData, teagData: teagCellBarData } = processDataForCellBarChart();

  return (
    <div className="bg-card border rounded-lg p-6 mt-6">
      <h2 className="text-xl font-semibold mb-6 text-primary">Análise de Operações</h2>
      <div className="space-y-10">
        <div className="grid md:grid-cols-2 gap-8">
          <div style={{ width: '100%', height: 400 }}>
              <h3 className="text-lg font-semibold mb-2 text-center">Operações por Produto</h3>
              <ResponsiveContainer>
                  <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={120} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} operações`} />
                      <Legend />
                  </PieChart>
              </ResponsiveContainer>
          </div>
          <div style={{ width: '100%', height: 400 }}>
              <h3 className="text-lg font-semibold mb-2 text-center">Tempo Médio por Terminal</h3>
              <ResponsiveContainer>
                  <BarChart data={terminalBarData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value} min`} />
                      <Legend />
                      <Bar dataKey="Tempo Médio (min)" fill="#82ca9d" />
                  </BarChart>
              </ResponsiveContainer>
          </div>
        </div>

        <div>
            <h3 className="text-lg font-semibold mb-4 text-center">Tempo Médio de Descarga por Célula</h3>
            <div className="grid md:grid-cols-2 gap-8 mt-4">
              <div style={{ width: '100%', height: 400 }}>
                  <h4 className="text-md font-semibold mb-2 text-center text-muted-foreground">Terminal TEG</h4>
                  <ResponsiveContainer>
                      <BarChart data={tegCellBarData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => `${value} min`} />
                          <Bar dataKey="Tempo Médio (min)" fill="#0088FE" />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
              <div style={{ width: '100%', height: 400 }}>
                  <h4 className="text-md font-semibold mb-2 text-center text-muted-foreground">Terminal TEAG</h4>
                  <ResponsiveContainer>
                      <BarChart data={teagCellBarData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => `${value} min`} />
                          <Bar dataKey="Tempo Médio (min)" fill="#00C49F" />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
