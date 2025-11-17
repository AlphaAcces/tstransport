import React, { useState, useEffect, useMemo } from 'react';
import { useCaseData } from '../../context/DataContext';
import { Scenario, ActionItem } from '../../types';
import { Tag } from '../Shared/Tag';
import { Route, Check, AlertTriangle, X, LogOut, Loader, ServerCrash, XCircle, Bot } from 'lucide-react';
import { generateGeminiContent } from '../../lib/ai';

const AI_CACHE_KEY = 'ai_scenario_history';

const categoryConfig: Record<Scenario['category'], { color: 'green' | 'yellow' | 'red' | 'blue', icon: React.ReactNode }> = {
    'Best': { color: 'green', icon: <Check className="w-5 h-5" /> },
    'Base': { color: 'yellow', icon: <AlertTriangle className="w-5 h-5" /> },
    'Worst': { color: 'red', icon: <X className="w-5 h-5" /> },
    'Exit': { color: 'blue', icon: <LogOut className="w-5 h-5" /> },
};

const probabilityImpactColor: Record<Scenario['probability'] | Scenario['impact'], 'blue' | 'yellow' | 'red' > = {
    'Lav': 'blue',
    'Middel': 'yellow',
    'Høj': 'red',
    'Ekstrem': 'red',
};

const actionPriorityOrder: Record<ActionItem['priority'], number> = { 'Påkrævet': 1, 'Høj': 2, 'Middel': 3 };

const actionPriorityColor: Record<ActionItem['priority'], 'red' | 'yellow' | 'blue'> = {
    'Påkrævet': 'red',
    'Høj': 'yellow',
    'Middel': 'blue'
};

const actionCategoryColor: Record<ActionItem['category'], 'blue' | 'green' | 'yellow' | 'gray'> = {
    'Juridisk': 'blue',
    'Finansiel': 'green',
    'Efterretning': 'yellow',
    'Kommerciel': 'gray',
    'Regulatorisk': 'blue',
    'Governance': 'blue',
    'Strategisk': 'green'
};


const ScenarioCard: React.FC<{ scenario: Scenario, onAnalyze: (scenario: Scenario) => void }> = ({ scenario, onAnalyze }) => {
    const config = categoryConfig[scenario.category];

    return (
        <div className={`bg-component-dark rounded-lg border-2 ${config.color === 'green' ? 'border-green-800/80' : config.color === 'yellow' ? 'border-yellow-800/80' : config.color === 'red' ? 'border-red-800/80' : 'border-blue-800/80'} flex flex-col h-full`}>
            <div className="p-4 border-b border-border-dark flex items-center gap-3">
                <div className={`text-${config.color}-400`}>{config.icon}</div>
                <h3 className="text-lg font-bold text-gray-200">{scenario.name}</h3>
            </div>
            <div className="p-4 space-y-4 flex-grow">
                <p className="text-sm text-gray-400">{scenario.description}</p>
                <div>
                    <h4 className="font-semibold text-gray-300 text-sm mb-2">Nøgleforudsætninger</h4>
                    <ul className="list-disc list-inside text-sm text-gray-400 space-y-1 font-mono">
                        {scenario.assumptions.map((ass, i) => <li key={i}>{ass}</li>)}
                    </ul>
                </div>
                 <div>
                    <h4 className="font-semibold text-gray-300 text-sm mb-2">Forventet Udfald</h4>
                    <p className={`text-sm font-bold text-${config.color}-300`}>{scenario.expectedOutcome}</p>
                </div>
            </div>
             <div className="p-4 border-t border-border-dark flex justify-between items-center text-xs">
                <div>
                    <span className="font-semibold text-gray-500 mr-2">Sandsynlighed:</span>
                    <Tag label={scenario.probability} color={probabilityImpactColor[scenario.probability]} />
                </div>
                 <div>
                    <span className="font-semibold text-gray-500 mr-2">Impact:</span>
                    <Tag label={scenario.impact} color={probabilityImpactColor[scenario.impact]} />
                </div>
            </div>
             <div className="p-4 border-t border-border-dark">
                <button 
                    onClick={() => onAnalyze(scenario)}
                    className="w-full flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 bg-accent-green/10 text-accent-green hover:bg-accent-green/20"
                >
                    <Bot className="w-4 h-4 mr-2" />
                    Kør AI-Analyse
                </button>
            </div>
        </div>
    );
};

const AIAnalysisPanel: React.FC<{ analysis: string, isLoading: boolean, error: string | null, onClose: () => void, scenario: Scenario | null, linkedActions: ActionItem[] }> = ({ analysis, isLoading, error, onClose, scenario, linkedActions }) => {
    return (
        <div className="fixed top-16 right-0 h-[calc(100%-4rem)] w-full md:w-1/3 lg:w-1/4 bg-component-dark border-l border-border-dark z-40 p-6 flex flex-col transform transition-transform duration-300 ease-in-out">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-200">AI-Analyse: {scenario?.name}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white"><XCircle className="w-6 h-6" /></button>
            </div>
            <div className="flex-grow overflow-y-auto scrollbar-hidden pr-2 space-y-6">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Loader className="w-8 h-8 animate-spin mb-4" />
                        <p>Genererer analyse...</p>
                    </div>
                )}
                {error && (
                     <div className="flex flex-col items-center justify-center h-full text-red-400 text-center">
                        <ServerCrash className="w-8 h-8 mb-4" />
                        <p className="font-semibold">Fejl under analyse</p>
                        <p className="text-xs text-gray-500 mt-2 bg-base-dark p-2 rounded">{error}</p>
                    </div>
                )}
                {!isLoading && !error && (
                    <>
                        {analysis && (
                            <div className="prose prose-sm prose-invert text-gray-300 whitespace-pre-wrap font-sans" dangerouslySetInnerHTML={{ __html: analysis.replace(/\*/g, '•') }} />
                        )}
                        
                        {linkedActions.length > 0 && (
                            <div>
                                <h4 className="font-bold text-gray-200 mt-6 mb-2 border-t border-border-dark pt-4">Relevante Handlinger</h4>
                                <div className="space-y-3">
                                    {linkedActions.map(action => (
                                        <div key={action.id} className="bg-base-dark p-3 rounded-md border border-border-dark/50">
                                            <p className="font-semibold text-sm text-gray-200">{action.id}: {action.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Tag label={action.priority} color={actionPriorityColor[action.priority]} />
                                                <Tag label={action.category} color={actionCategoryColor[action.category]} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export const ScenariosView: React.FC = () => {
    const { scenariosData, actionsData } = useCaseData();
    const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
    const [analysisResult, setAnalysisResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const linkedActions = useMemo(() => {
        if (!selectedScenario) return [];
        return actionsData
            .filter(action => selectedScenario.linkedActions.includes(action.id))
            .sort((a,b) => actionPriorityOrder[a.priority] - actionPriorityOrder[b.priority]);
    }, [selectedScenario, actionsData]);

    const handleAnalyze = (scenario: Scenario) => {
        setAnalysisResult('');
        setError(null);
        setSelectedScenario(scenario);
    };
    
    useEffect(() => {
        if (!selectedScenario) return;

        const generateAnalysis = async () => {
            setIsLoading(true);
            setError(null);
            
            const cachedData = localStorage.getItem(AI_CACHE_KEY);
            if (cachedData) {
                try {
                    const cache = JSON.parse(cachedData);
                    if(cache[selectedScenario.id]) {
                        setAnalysisResult(cache[selectedScenario.id]);
                        setIsLoading(false); // We have a cached result, no need to fetch
                        return;
                    }
                } catch (e) {
                    console.error("Failed to parse AI cache", e);
                    localStorage.removeItem(AI_CACHE_KEY);
                }
            }

            try {
                const actionsList = actionsData.map(a => `- ${a.id}: ${a.title} (Prioritet: ${a.priority})`).join('\n');

                const prompt = `
                    Du er en ekspert i risikoanalyse og strategi for virksomheder.
                    Analysér følgende scenarie for virksomheden TS Logistik og generér en "mini-playbook" på dansk.

                    **Scenarie: ${selectedScenario.name}**
                    - Beskrivelse: ${selectedScenario.description}
                    - Forudsætninger: ${selectedScenario.assumptions.join(', ')}
                    - Forventet Udfald: ${selectedScenario.expectedOutcome}

                    **Tilgængelige Handlinger (Actions):**
                    ${actionsList}

                    **Din opgave:**
                    Generér en kortfattet analyse i 3 dele. Brug markdown til formatering med overskrifter (##) og lister (*).

                    ## 1. Konsekvenser
                    * Hvad betyder dette scenarie helt konkret for TS Logistik? Dæk økonomi, drift, og Ümit Cetin personligt. (3-5 punkter)

                    ## 2. Kritiske Handlinger
                    * Baseret på listen af handlinger, hvilke 3-5 er de absolut vigtigste at fokusere på i netop dette scenarie? List dem med deres ID og titel.

                    ## 3. Mini-Playbook (Næste 30 dage)
                    * **Konkrete Næste Skridt:** Hvad er de tre første, mest presserende ting, ledelsen skal gøre inden for 30 dage?
                    * **Triggere at Overvåge:** Hvilke 3 konkrete signaler eller hændelser indikerer, at virksomheden er på vej ind i dette scenarie?
                `;

                const resultText = await generateGeminiContent(prompt);
                setAnalysisResult(resultText);

                const currentCacheData = localStorage.getItem(AI_CACHE_KEY);
                const cache = currentCacheData ? JSON.parse(currentCacheData) : {};
                cache[selectedScenario.id] = resultText;
                localStorage.setItem(AI_CACHE_KEY, JSON.stringify(cache));

            } catch (e: any) {
                setError(e.message || 'En ukendt fejl opstod under AI-analysen.');
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        generateAnalysis();

    }, [selectedScenario, actionsData]);


    return (
        <div className="flex">
             <div className={`w-full transition-all duration-300 ${selectedScenario ? 'md:w-2/3 lg:w-3/4' : 'w-full'}`}>
                <div className="space-y-8">
                    <div>
                        <h2 className="text-xl font-bold text-gray-200 mb-2 flex items-center">
                            <Route className="w-6 h-6 mr-3 text-gray-400" />
                            Strategiske Scenarier 2025-2026
                        </h2>
                        <p className="text-gray-400 max-w-3xl">
                            Baseret på Slutrapport v3.0 er fire hovedscenarier for virksomhedens fremtid opstillet. Disse illustrerer det mulige udfaldsrum fra "best case" til "worst case" og danner grundlag for den strategiske handlingsplan.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 auto-rows-fr">
                        {scenariosData
                            .sort((a,b) => {
                                const order = { 'Best': 1, 'Base': 2, 'Worst': 3, 'Exit': 4 };
                                return order[a.category] - order[b.category];
                            })
                            .map(scenario => (
                                <ScenarioCard key={scenario.id} scenario={scenario} onAnalyze={handleAnalyze} />
                        ))}
                    </div>
                </div>
            </div>
            {selectedScenario && (
                <AIAnalysisPanel 
                    analysis={analysisResult} 
                    isLoading={isLoading} 
                    error={error} 
                    onClose={() => setSelectedScenario(null)}
                    scenario={selectedScenario}
                    linkedActions={linkedActions}
                />
            )}
        </div>
    );
};