import React from 'react';
import { AreaChart, Area, BarChart, Bar, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useCaseData } from '../../context/DataContext';

const ChartCard: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-component-dark p-6 rounded-lg border border-border-dark">
        <h3 className="text-lg font-bold text-gray-200 mb-4">{title}</h3>
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                {children}
            </ResponsiveContainer>
        </div>
    </div>
);

const formatDKK = (value: number) => {
    if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)} mio.`;
    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)} t.`;
    return `${value}`;
};
const formatDKKTooltip = (value: number) => `${value.toLocaleString('da-DK')} DKK`;
const formatPercent = (value: number) => `${value.toFixed(1)}%`;
const formatNumber = (value: number) => value.toLocaleString('da-DK');

export const FinancialsView: React.FC = () => {
  const { financialData } = useCaseData();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-200 mb-4">Årlige Nøgletal (TS Logistik ApS)</h2>
        <div className="bg-component-dark border border-border-dark rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-border-dark">
            <thead className="bg-gray-800/50">
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">År</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Bruttofortjeneste</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">EBIT</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Årets Resultat</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Egenkapital</th>
                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Ansatte</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">EBIT-margin</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Netto-margin</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Resultat/ansat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark font-mono">
              {financialData.map((d) => (
                <tr key={d.year} className="hover:bg-gray-800/40">
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{d.year}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-gray-300">{formatNumber(d.revenueOrGrossProfit)}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-orange-400">{d.ebit ? formatNumber(d.ebit) : 'N/A'}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-green-400">{formatNumber(d.profitAfterTax)}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-indigo-400">{formatNumber(d.equityEndOfYear)}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-300">{d.staffCount}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-orange-400">{d.ebitMargin ? `${d.ebitMargin.toFixed(1)}%` : 'N/A'}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-green-400">{d.netMargin ? `${d.netMargin.toFixed(1)}%` : 'N/A'}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-gray-300">{d.profitPerEmployee ? formatNumber(d.profitPerEmployee) : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-200 mb-4">Grafisk Udvikling</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartCard title="Resultatudvikling">
            <AreaChart data={financialData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis dataKey="year" stroke="#a0aec0" />
              <YAxis tickFormatter={formatDKK} stroke="#a0aec0" />
              <Tooltip contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #2d3748' }} formatter={(value: number) => formatDKKTooltip(value)} />
              <Legend />
              <Area type="monotone" dataKey="revenueOrGrossProfit" name="Bruttofortjeneste" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="ebit" name="EBIT" stroke="#dd6b20" fill="#dd6b20" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="profitAfterTax" name="Nettoresultat" stroke="#00cc66" fill="#00cc66" fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          </ChartCard>

          <ChartCard title="Kapital & Soliditet">
            <AreaChart data={financialData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis dataKey="year" stroke="#a0aec0" />
              <YAxis yAxisId="left" tickFormatter={formatDKK} stroke="#a0aec0" />
              <YAxis yAxisId="right" orientation="right" tickFormatter={formatPercent} stroke="#a0aec0" />
              <Tooltip contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #2d3748' }} formatter={(value: number, name: string) => name === 'Soliditet' ? formatPercent(value) : formatDKKTooltip(value)} />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="equityEndOfYear" name="Egenkapital" stroke="#818cf8" fill="#818cf8" fillOpacity={0.1} strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="solidity" name="Soliditet" stroke="#d69e2e" strokeWidth={2} dot={{ r: 4 }} />
            </AreaChart>
          </ChartCard>

          <div className="lg:col-span-2">
            <ChartCard title="Produktivitet (Resultat pr. Medarbejder)">
              <BarChart data={financialData.filter(d => d.staffCount > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                <XAxis dataKey="year" stroke="#a0aec0" />
                <YAxis tickFormatter={(v) => `${Math.round(v / 1000)} t.kr.`} stroke="#a0aec0" />
                <Tooltip contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #2d3748' }} formatter={(value: number) => formatDKKTooltip(value)} />
                <Legend />
                <Bar dataKey="profitPerEmployee" name="Resultat/ansat" fill="#dd6b20" />
              </BarChart>
            </ChartCard>
          </div>
        </div>
      </div>
      
      <div className="bg-component-dark p-6 rounded-lg border border-border-dark">
        <h3 className="text-lg font-bold text-gray-200 mb-2">Finansiel Kommentar 2024</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
          <li><span className="font-semibold text-orange-400">Pres på indtjening:</span> EBIT- og netto-margin er faldende sammenlignet med 2022-23, hvilket indikerer stigende omkostninger eller prispres.</li>
          <li><span className="font-semibold text-red-400">Halveret produktivitet:</span> Nettoresultat pr. medarbejder er faldet fra ~170 t.kr. i 2023 til ~85 t.kr. i 2024, på trods af flere ansatte.</li>
          <li><span className="font-semibold text-green-400">Stærk kapitalisering:</span> Egenkapitalen er voksende og soliditeten er høj (>55%), hvilket giver en buffer mod tab.</li>
          <li><span className="font-semibold text-yellow-500">Likviditetsrisiko:</span> Den stærke balance dækker over en kritisk likviditetskrise. Se "Cashflow & DSO" for detaljeret analyse.</li>
        </ul>
      </div>
    </div>
  );
};
