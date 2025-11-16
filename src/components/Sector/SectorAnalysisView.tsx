import React from 'react';
import { LineChart, Line, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useCaseData } from '../../context/DataContext';
import { Tag } from '../Shared/Tag';
import { SectorComparisonMetric } from '../../types';

const ComparisonTableRow: React.FC<{ data: SectorComparisonMetric }> = ({ data }) => {
    const tslValue = data.tslValue ?? 0;
    const performanceColor = (tslValue > data.sectorValue && data.higherIsBetter) || (tslValue < data.sectorValue && !data.higherIsBetter) ? 'text-green-400' : 'text-red-400';
    const formatValue = (val: number | undefined) => {
        if (val === undefined) return 'N/A';
        return data.unit === '%' ? `${val.toFixed(1)}%` : `${(val / 1000).toFixed(0)} t.kr.`;
    };

    return (
        <tr className="border-b border-border-dark/50 last:border-b-0">
            <td className="py-3 px-4 text-sm font-medium text-gray-200">{data.metric}</td>
            <td className={`py-3 px-4 text-sm text-right font-mono ${performanceColor}`}>{formatValue(tslValue)}</td>
            <td className="py-3 px-4 text-sm text-right font-mono text-gray-400">{formatValue(data.sectorValue)}</td>
            <td className="py-3 px-4 text-sm text-right font-mono text-blue-400">{formatValue(data.highPerformerValue)}</td>
        </tr>
    );
};

export const SectorAnalysisView: React.FC = () => {
    const { sectorBenchmarkYearlyData, sectorComparisonData, sectorDriversData, macroRiskData } = useCaseData();
    
    return (
        <div className="space-y-8">
            <div className="bg-component-dark p-6 rounded-lg border border-border-dark">
                <h2 className="text-xl font-bold text-gray-200 mb-4">Nøgletal vs. Branche (2024)</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-border-dark">
                                <th scope="col" className="py-2 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nøgletal</th>
                                <th scope="col" className="py-2 px-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">TS Logistik</th>
                                <th scope="col" className="py-2 px-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Branche-gennemsnit</th>
                                <th scope="col" className="py-2 px-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">High Performer</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sectorComparisonData.map(metric => <ComparisonTableRow key={metric.metric} data={metric} />)}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-component-dark p-6 rounded-lg border border-border-dark">
                <h3 className="text-lg font-bold text-gray-200 mb-4">EBIT-margin over tid – TSL vs. branche</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={sectorBenchmarkYearlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                        <XAxis dataKey="year" stroke="#a0aec0" />
                        <YAxis tickFormatter={(v) => `${v}%`} stroke="#a0aec0" />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #2d3748' }}
                            formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="ebitMarginTSL" name="TS Logistik" stroke="#00cc66" strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="ebitMarginSector" name="Branche-gennemsnit" stroke="#718096" strokeWidth={2} strokeDasharray="5 5" dot={false}/>
                    </LineChart>
                </ResponsiveContainer>
            </div>

             <div className="bg-component-dark p-6 rounded-lg border border-border-dark">
                <h2 className="text-xl font-bold text-gray-200 mb-4">Strategiske Drivers & Branchepres</h2>
                 <div className="space-y-4">
                    {sectorDriversData.map((driver) => (
                        <div key={driver.driver} className="border-b border-border-dark/50 pb-4 last:border-b-0 last:pb-0">
                           <div className="flex justify-between items-start">
                             <h3 className="text-md font-semibold text-gray-200">{driver.driver}</h3>
                              <Tag label={`Risiko: ${driver.risk}`} color={driver.risk === 'Høj' ? 'red' : driver.risk === 'Middel' ? 'yellow' : 'blue'} />
                           </div>
                            <p className="text-sm text-gray-400 mt-1">{driver.industrySituation}</p>
                            <p className="text-sm text-yellow-400/80 mt-2 italic">Impact på TSL: {driver.impactOnTSL}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-component-dark p-6 rounded-lg border border-border-dark">
                <h2 className="text-xl font-bold text-gray-200 mb-4">Makro-risici for Branchen</h2>
                <div className="space-y-4">
                    {macroRiskData.map((risk) => (
                        <div key={risk.id} className="border-b border-border-dark/50 pb-4 last:border-b-0 last:pb-0">
                            <div className="flex justify-between items-start">
                                <h3 className="text-md font-semibold text-gray-200">{risk.title}</h3>
                                <Tag label={`Risiko: ${risk.level}`} color={risk.level === 'Høj' ? 'red' : risk.level === 'Middel' ? 'yellow' : 'blue'} />
                            </div>
                            <p className="text-sm text-gray-400 mt-1">{risk.description}</p>
                        </div>
                    ))}
                     {macroRiskData.length === 0 && <p className="text-sm text-gray-500">Ingen makro-risici defineret for denne profil.</p>}
                </div>
            </div>

            <div className="bg-component-dark p-6 rounded-lg border border-border-dark">
                <h3 className="text-lg font-bold text-gray-200 mb-2">Analytisk Konklusion</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    <li><span className="font-semibold text-green-400">Historisk Overperformance:</span> TS Logistik har historisk haft markant højere marginer og soliditet end branchen, men denne fordel er nu under pres og faldende (2023-2024).</li>
                    <li><span className="font-semibold text-red-400">Faldende Produktivitet:</span> Effektiviteten pr. medarbejder er faldet markant og ligger nu under det forventede gennemsnit for branchen, hvilket understøtter hypotese H2 om overkapacitet.</li>
                    <li><span className="font-semibold text-blue-400">Stærk Balance, Svag Likviditet:</span> Den høje soliditet giver en buffer mod tab, men står i skarp kontrast til den akutte likviditetskrise, hvilket gør casen finansielt atypisk og risikabel.</li>
                    <li><span className="font-semibold text-yellow-500">Sårbar Forretningsmodel:</span> Selskabets afhængighed af få, store kunder (formodet "captive" model) gør dem sårbare overfor det generelle pris- og omkostningspres i sektoren.</li>
                </ul>
            </div>
        </div>
    );
};