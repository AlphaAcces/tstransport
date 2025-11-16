import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCaseData } from '../../context/DataContext';
import { Banknote, FileWarning, Clock, Users, ArrowDown, ArrowUp, Briefcase } from 'lucide-react';

const formatDKK = (value: number) => {
    if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)} mio.`;
    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)} t.`;
    return `${value}`;
};
const formatDKKFull = (value: number) => `${Math.round(value).toLocaleString('da-DK')} DKK`;


const KpiCard: React.FC<{ title: string; value: string; note: string; icon: React.ReactNode }> = ({ title, value, note, icon }) => (
    <div className="bg-component-dark p-4 rounded-lg border border-red-800/80 flex">
        <div className="flex-shrink-0 mr-4 text-red-500">{icon}</div>
        <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</h3>
            <p className="text-2xl font-bold text-red-400 mt-1">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{note}</p>
        </div>
    </div>
);

const ScenarioKpiCard: React.FC<{ title: string; value: string; change: number; icon: React.ReactNode }> = ({ title, value, change, icon }) => {
    const isNegative = change < 0;
    const colorClass = isNegative ? 'text-red-400' : 'text-green-400';
    const ChangeIcon = isNegative ? ArrowDown : ArrowUp;
    
    return (
        <div className="bg-base-dark/50 p-4 rounded-lg border border-border-dark flex">
            <div className="flex-shrink-0 mr-4 text-gray-400">{icon}</div>
            <div>
                <h3 className="text-sm font-medium text-gray-400">{title}</h3>
                <p className="text-xl font-bold text-gray-200 mt-1">{value}</p>
                <div className={`flex items-center text-xs font-mono mt-1 ${colorClass}`}>
                    <ChangeIcon className="w-3 h-3 mr-1" />
                    <span>{formatDKKFull(change)}</span>
                </div>
            </div>
        </div>
    );
};


const ReceivablesTable: React.FC = () => {
    const { cashflowYearlyData } = useCaseData();
    const data = cashflowYearlyData.filter(d => d.year >= 2023);

    if (data.length < 2) {
        return <p className="text-sm text-gray-500">Utilstrækkelige data for tilgodehavender.</p>;
    }

    const data2024 = data[1];
    const data2023 = data[0];
    
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-dark font-mono">
                <thead className="bg-gray-800/50">
                    <tr>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Post</th>
                        <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">2024 (DKK)</th>
                        <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">2023 (DKK)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                    <tr>
                        <td className="px-4 py-3 text-sm text-gray-300">Heraf interne</td>
                        <td className="px-4 py-3 text-sm text-right text-yellow-400">{data2024.receivablesRelated.toLocaleString('da-DK')}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-400">{data2023.receivablesRelated.toLocaleString('da-DK')}</td>
                    </tr>
                    <tr>
                        <td className="px-4 py-3 text-sm text-gray-300">Heraf eksterne</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-400">{data2024.receivablesExternal.toLocaleString('da-DK')}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-400">{data2023.receivablesExternal.toLocaleString('da-DK')}</td>
                    </tr>
                    <tr className="bg-gray-800/30">
                        <td className="px-4 py-3 text-sm font-bold text-gray-200">Tilgodehavender i alt</td>
                        <td className="px-4 py-3 text-sm font-bold text-right text-gray-200">{data2024.receivablesTotal.toLocaleString('da-DK')}</td>
                        <td className="px-4 py-3 text-sm font-bold text-right text-gray-200">{data2023.receivablesTotal.toLocaleString('da-DK')}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export const CashflowView: React.FC = () => {
    const { cashflowYearlyData, cashflowSummary, financialData } = useCaseData();
    const [activeScenario, setActiveScenario] = useState<'base' | 'taxClaim' | 'repayment'>('base');

    const baseData = useMemo(() => {
        const latestFinancials = financialData.find(d => d.year === 2024);
        const latestCashflow = cashflowYearlyData.find(d => d.year === 2024);
        return {
            equity: latestFinancials?.equityEndOfYear ?? 0,
            cash: latestCashflow?.cashAndBank ?? 0,
            dso: latestCashflow?.dsoDays ?? 0,
            grossProfit: latestCashflow?.grossProfit ?? 0,
            internalReceivables: latestCashflow?.receivablesRelated ?? 0,
            totalReceivables: latestCashflow?.receivablesTotal ?? 0,
            taxClaim: cashflowSummary.potentialTaxClaim,
        };
    }, [financialData, cashflowYearlyData, cashflowSummary]);

    const scenarioOutput = useMemo(() => {
        const { equity, cash, dso, taxClaim, internalReceivables, totalReceivables, grossProfit } = baseData;

        switch (activeScenario) {
            case 'taxClaim': {
                const newEquity = equity - taxClaim;
                const newCash = cash - taxClaim;
                return {
                    title: "Scenarie A: Skat vinder krav på 4 mio. DKK",
                    description: "Worst-case scenarie, hvor selskabets egenkapital udhules og likviditeten bliver stærkt negativ. Dette vil medføre øjeblikkelig insolvens.",
                    equity: { value: newEquity, change: -taxClaim },
                    cash: { value: newCash, change: -taxClaim },
                    dso: { value: dso, change: 0 },
                };
            }
            case 'repayment': {
                const repaymentAmount = internalReceivables * 0.5;
                const newCash = cash + repaymentAmount;
                const newTotalReceivables = totalReceivables - repaymentAmount;
                const newDso = grossProfit > 0 ? (newTotalReceivables / grossProfit) * 365 : 0;
                return {
                    title: "Scenarie B: 50% af mellemregninger indfries",
                    description: "Best-case scenarie, hvor en delvis tilbagebetaling af interne lån markant forbedrer likviditeten og reducerer DSO. Dette kan give det nødvendige pusterum.",
                    equity: { value: equity, change: 0 },
                    cash: { value: newCash, change: repaymentAmount },
                    dso: { value: newDso, change: newDso - dso },
                };
            }
            default: // base case
                return {
                    title: "Basisscenarie",
                    description: "Den nuværende situation som afspejlet i det seneste årsregnskab. Viser den akutte likviditetsrisiko og den høje kapitalbinding.",
                    equity: { value: equity, change: 0 },
                    cash: { value: cash, change: 0 },
                    dso: { value: dso, change: 0 },
                };
        }
    }, [activeScenario, baseData]);

    const dsoData = cashflowYearlyData.map(d => ({ year: d.year, DSO: d.dsoDays }));

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-bold text-gray-200 mb-4">Likviditets- & Risikostatus (Basisscenarie)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard title="Likvid beholdning" value={`${cashflowSummary.cashOnHand.toLocaleString('da-DK')} DKK`} note="Praktisk talt ingen kontanter." icon={<Banknote className="w-8 h-8"/>} />
                    <KpiCard title="Interne tilgodehavender" value={`${formatDKK(cashflowSummary.internalReceivables)}`} note="Kapital låst i koncernselskaber." icon={<Users className="w-8 h-8"/>} />
                    <KpiCard title="DSO 2024" value={`${cashflowSummary.dsoDays2024} dage`} note="Ekstremt lang kredittid." icon={<Clock className="w-8 h-8"/>} />
                    <KpiCard title="Potentiel Skattesag" value={`${formatDKK(cashflowSummary.potentialTaxClaim)}`} note="Akut trussel mod likviditeten." icon={<FileWarning className="w-8 h-8"/>} />
                </div>
            </div>

            <div className="bg-component-dark p-6 rounded-lg border border-border-dark">
                 <h2 className="text-xl font-bold text-gray-200 mb-4">Scenarieanalyse</h2>
                 <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <button onClick={() => setActiveScenario('base')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 border ${activeScenario === 'base' ? 'bg-accent-green/20 text-accent-green border-accent-green/50' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border-transparent'}`}>Basisscenarie</button>
                    <button onClick={() => setActiveScenario('taxClaim')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 border ${activeScenario === 'taxClaim' ? 'bg-red-800/50 text-red-300 border-red-600/80' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border-transparent'}`}>Scenarie A: Skat vinder</button>
                    <button onClick={() => setActiveScenario('repayment')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 border ${activeScenario === 'repayment' ? 'bg-green-800/50 text-green-300 border-green-600/80' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border-transparent'}`}>Scenarie B: Lån indfries</button>
                 </div>
                 
                 <div className="bg-base-dark/50 p-4 rounded-md border border-border-dark/50 mb-6">
                     <h3 className="text-md font-semibold text-gray-200">{scenarioOutput.title}</h3>
                     <p className="text-sm text-gray-400 mt-1">{scenarioOutput.description}</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ScenarioKpiCard title="Justeret Egenkapital" value={formatDKKFull(scenarioOutput.equity.value)} change={scenarioOutput.equity.change} icon={<Briefcase className="w-6 h-6"/>} />
                    <ScenarioKpiCard title="Justeret Likviditet" value={formatDKKFull(scenarioOutput.cash.value)} change={scenarioOutput.cash.change} icon={<Banknote className="w-6 h-6"/>} />
                    <ScenarioKpiCard title="Justeret DSO" value={`${Math.round(scenarioOutput.dso.value)} dage`} change={scenarioOutput.dso.change} icon={<Clock className="w-6 h-6"/>} />
                 </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-component-dark p-6 rounded-lg border border-border-dark">
                    <h3 className="text-lg font-bold text-gray-200 mb-4">DSO-udvikling (Dage)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dsoData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                            <XAxis dataKey="year" stroke="#a0aec0" />
                            <YAxis tickFormatter={(v) => `${v}`} stroke="#a0aec0" />
                            <Tooltip contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #2d3748' }} formatter={(value: number) => [`${value} dage`, 'DSO']} cursor={{ fill: 'rgba(229, 62, 62, 0.1)' }} />
                            <Bar dataKey="DSO" name="Debitor-dage" fill="#e53e3e" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="lg:col-span-2 bg-component-dark p-6 rounded-lg border border-border-dark">
                    <h3 className="text-lg font-bold text-gray-200 mb-4">Struktur for Tilgodehavender</h3>
                    <ReceivablesTable />
                </div>
            </div>

            <div className="bg-component-dark p-6 rounded-lg border border-border-dark">
                <h3 className="text-lg font-bold text-gray-200 mb-2">Likviditetsnote & Konklusion</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    <li><span className="font-semibold text-red-400">Akut Risiko:</span> Selskabet er operationelt insolvent med kun 31 DKK i kassen. Driften er 100% afhængig af leverandørkredit og inddrivelse af tilgodehavender.</li>
                    <li><span className="font-semibold text-yellow-400">Kapitaldræn:</span> En voksende andel af kapitalen (nu 12,4 mio. kr.) er bundet i interne lån til holdingselskabet, hvilket systematisk dræner driften for likviditet.</li>
                    <li><span className="font-semibold text-orange-400">Ekstrem DSO:</span> En DSO på ~358 dage indikerer, at de interne lån reelt er langfristede og ikke bidrager til den kortsigtede likviditet.</li>
                    <li><span className="font-semibold text-red-500">Kombinationseffekt:</span> Den verserende skattesag på 4 mio. kr. udgør, kombineret med den manglende likviditet, en eksistentiel trussel mod selskabets overlevelse (se Hypotese H3/H4 og Risk Heatmap).</li>
                </ul>
            </div>
        </div>
    );
};
