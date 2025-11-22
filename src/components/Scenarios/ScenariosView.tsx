import React, { useState, useEffect, useMemo } from 'react';
import { useCaseData } from '../../context/DataContext';
import { Scenario, ActionItem } from '../../types';
import { Tag } from '../Shared/Tag';
import { Route, Check, AlertTriangle, X, LogOut, Loader, XCircle, Bot } from 'lucide-react';
import { generateGeminiContent } from '../../lib/ai';
import { AiErrorMessage } from '../Shared/AiErrorMessage';
import { useTranslation } from 'react-i18next';

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

type ParsedSection = {
    id: string;
    heading: string;
    bullets: string[];
    paragraphs: string[];
};

const SECTION_LABELS_IN_ORDER = [
    '1. Konsekvenser',
    '2. Kritiske Handlinger',
    '3. Mini-Playbook (Næste 30 dage)'
];

const SECTION_REGEX = /##\s*(\d\.\s*[^\n]+)\s*\n?([\s\S]*?)(?=\n##\s*\d\.|$)/g;

const stripMarkdown = (line: string) => line.replace(/\*\*(.*?)\*\*/g, '$1').trim();

const normaliseBullet = (line: string) => stripMarkdown(line.replace(/^[-*•]\s*/, ''));

const parseAnalysisSections = (analysis: string): ParsedSection[] => {
    if (!analysis) return [];

    const normalised = analysis.replace(/\r\n/g, '\n');
    const parsedMap = new Map<string, ParsedSection>();

    let match: RegExpExecArray | null;
    while ((match = SECTION_REGEX.exec(normalised)) !== null) {
        const sectionId = match[1].trim();
        const body = (match[2] ?? '').trim();
        const lines = body.split('\n').map(line => line.trim()).filter(Boolean);

        const bullets: string[] = [];
        const paragraphs: string[] = [];

        lines.forEach(line => {
            if (/^[-*•]/.test(line)) {
                bullets.push(normaliseBullet(line));
            } else {
                paragraphs.push(stripMarkdown(line));
            }
        });

        parsedMap.set(sectionId, {
            id: sectionId,
            heading: sectionId,
            bullets,
            paragraphs,
        });
    }

    const orderedSections = SECTION_LABELS_IN_ORDER.map(label => parsedMap.get(label)).filter(Boolean) as ParsedSection[];

    if (orderedSections.length > 0) {
        return orderedSections;
    }

    return Array.from(parsedMap.values());
};


interface DisplayScenario {
    name: string;
    description: string;
    assumptions: string[];
    expectedOutcome: string;
}

interface ScenarioCardProps {
    scenario: Scenario;
    display: DisplayScenario;
    probabilityLabel: string;
    impactLabel: string;
    analyzeLabel: string;
    onAnalyze: (scenario: Scenario) => void;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, display, probabilityLabel, impactLabel, analyzeLabel, onAnalyze }) => {
    const { t } = useTranslation();
    const config = categoryConfig[scenario.category];

    return (
        <div className={`bg-component-dark rounded-lg border-2 ${config.color === 'green' ? 'border-green-800/80' : config.color === 'yellow' ? 'border-yellow-800/80' : config.color === 'red' ? 'border-red-800/80' : 'border-blue-800/80'} flex flex-col h-full`}>
            <div className="p-4 border-b border-border-dark flex items-center gap-3">
                <div className={`text-${config.color}-400`}>{config.icon}</div>
                <h3 className="text-lg font-bold text-gray-200">{display.name}</h3>
            </div>
            <div className="p-4 space-y-4 flex-grow">
                <p className="text-sm text-gray-400">{display.description}</p>
                <div>
                    <h4 className="font-semibold text-gray-300 text-sm mb-2">{t('card.assumptions')}</h4>
                    <ul className="list-disc list-inside text-sm text-gray-400 space-y-1 font-mono">
                        {display.assumptions.map((ass, i) => <li key={i}>{ass}</li>)}
                    </ul>
                </div>
                 <div>
                    <h4 className="font-semibold text-gray-300 text-sm mb-2">{t('card.outcome')}</h4>
                    <p className={`text-sm font-bold text-${config.color}-300`}>{display.expectedOutcome}</p>
                </div>
            </div>
             <div className="p-4 border-t border-border-dark flex justify-between items-center text-xs">
                <div>
                    <span className="font-semibold text-gray-500 mr-2">{t('card.labels.probability')}:</span>
                    <Tag label={probabilityLabel} color={probabilityImpactColor[scenario.probability]} />
                </div>
                 <div>
                    <span className="font-semibold text-gray-500 mr-2">{t('card.labels.impact')}:</span>
                    <Tag label={impactLabel} color={probabilityImpactColor[scenario.impact]} />
                </div>
            </div>
             <div className="p-4 border-t border-border-dark">
                <button
                    onClick={() => onAnalyze(scenario)}
                    className="w-full flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 bg-accent-green/10 text-accent-green hover:bg-accent-green/20"
                >
                    <Bot className="w-4 h-4 mr-2" />
                    {analyzeLabel}
                </button>
            </div>
        </div>
    );
};

interface ScenarioWithDisplay {
    original: Scenario;
    display: DisplayScenario;
}

interface AIAnalysisPanelProps {
    analysis: string;
    isLoading: boolean;
    error: string | null;
    onClose: () => void;
    scenario: ScenarioWithDisplay | null;
    linkedActions: ActionItem[];
    priorityLabels: Record<ActionItem['priority'], string>;
    categoryLabels: Record<ActionItem['category'], string>;
}

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ analysis, isLoading, error, onClose, scenario, linkedActions, priorityLabels, categoryLabels }) => {
    const { t } = useTranslation();
    const parsedSections = useMemo(() => parseAnalysisSections(analysis), [analysis]);

    return (
        <div className="fixed top-16 right-0 h-[calc(100%-4rem)] w-full md:w-1/3 lg:w-1/4 bg-component-dark border-l border-border-dark z-40 p-6 flex flex-col transform transition-transform duration-300 ease-in-out">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-200">{t('ai.panelTitle', { name: scenario?.display.name ?? '' })}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white"><XCircle className="w-6 h-6" /></button>
            </div>
            <div className="flex-grow overflow-y-auto scrollbar-hidden pr-2 space-y-6">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Loader className="w-8 h-8 animate-spin mb-4" />
                        <p>{t('ai.loading')}</p>
                    </div>
                )}
                {error && (
                    <AiErrorMessage details={error} />
                )}
                {!isLoading && !error && (
                    <>
                        {parsedSections.length > 0 ? (
                            <div className="space-y-6">
                                {parsedSections.map(section => (
                                    <section key={section.id} className="border border-border-dark/60 rounded-lg p-4 bg-base-dark/40 space-y-3">
                                        <h4 className="text-sm font-semibold text-gray-200 tracking-wide uppercase">{section.heading}</h4>
                                        {section.paragraphs.length > 0 && (
                                            <div className="space-y-2 text-sm text-gray-300">
                                                {section.paragraphs.map((paragraph, index) => (
                                                    <p key={index}>{paragraph}</p>
                                                ))}
                                            </div>
                                        )}
                                        {section.bullets.length > 0 && (
                                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                                                {section.bullets.map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </section>
                                ))}
                            </div>
                        ) : (
                            analysis && (
                                <div className="border border-border-dark/60 rounded-lg p-4 bg-base-dark/40 text-sm text-gray-300">
                                    {analysis}
                                </div>
                            )
                        )}

                        {linkedActions.length > 0 && (
                            <div>
                                <h4 className="font-bold text-gray-200 mt-6 mb-2 border-t border-border-dark pt-4">{t('ai.linkedActions')}</h4>
                                <div className="space-y-3">
                                    {linkedActions.map(action => (
                                        <div key={action.id} className="bg-base-dark p-3 rounded-md border border-border-dark/50">
                                            <p className="font-semibold text-sm text-gray-200">{action.id}: {action.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Tag label={priorityLabels[action.priority] ?? action.priority} color={actionPriorityColor[action.priority]} />
                                                <Tag label={categoryLabels[action.category] ?? action.category} color={actionCategoryColor[action.category]} />
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

const ScenariosView: React.FC = () => {
    const { scenariosData, actionsData } = useCaseData();
    const { t } = useTranslation();
    const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const scenarioContentMap = useMemo<Record<string, DisplayScenario>>(() => ({
        'scen-best': {
            name: t('items.best.name'),
            description: t('items.best.description'),
            assumptions: t('items.best.assumptions', { returnObjects: true }) as string[],
            expectedOutcome: t('items.best.expectedOutcome'),
        },
        'scen-base': {
            name: t('items.base.name'),
            description: t('items.base.description'),
            assumptions: t('items.base.assumptions', { returnObjects: true }) as string[],
            expectedOutcome: t('items.base.expectedOutcome'),
        },
        'scen-worst': {
            name: t('items.worst.name'),
            description: t('items.worst.description'),
            assumptions: t('items.worst.assumptions', { returnObjects: true }) as string[],
            expectedOutcome: t('items.worst.expectedOutcome'),
        },
        'scen-exit': {
            name: t('items.exit.name'),
            description: t('items.exit.description'),
            assumptions: t('items.exit.assumptions', { returnObjects: true }) as string[],
            expectedOutcome: t('items.exit.expectedOutcome'),
        },
    }), [t]);

    const resolvedScenarios = useMemo<ScenarioWithDisplay[]>(() => (
        scenariosData.map((scenario) => ({
            original: scenario,
            display: scenarioContentMap[scenario.id] ?? {
                name: scenario.name,
                description: scenario.description,
                assumptions: scenario.assumptions,
                expectedOutcome: scenario.expectedOutcome,
            },
        }))
    ), [scenariosData, scenarioContentMap]);

    const selectedScenario = useMemo<ScenarioWithDisplay | null>(() => (
        selectedScenarioId
            ? resolvedScenarios.find(({ original }) => original.id === selectedScenarioId) ?? null
            : null
    ), [selectedScenarioId, resolvedScenarios]);

    const linkedActions = useMemo(() => {
        if (!selectedScenario) return [];
        return actionsData
            .filter(action => selectedScenario.original.linkedActions.includes(action.id))
            .sort((a,b) => actionPriorityOrder[a.priority] - actionPriorityOrder[b.priority]);
    }, [selectedScenario, actionsData]);

    const probabilityLabels = useMemo(() => ({
        Lav: t('scenarios.probability.low'),
        Middel: t('scenarios.probability.medium'),
        Høj: t('scenarios.probability.high'),
        Ekstrem: t('scenarios.probability.extreme'),
    }), [t]);

    const impactLabels = useMemo(() => ({
        Lav: t('scenarios.impact.low'),
        Middel: t('scenarios.impact.medium'),
        Høj: t('scenarios.impact.high'),
        Ekstrem: t('scenarios.impact.extreme'),
    }), [t]);

    const actionPriorityLabels = useMemo(() => ({
        'Påkrævet': t('actions.priorities.required'),
        'Høj': t('actions.priorities.high'),
        'Middel': t('actions.priorities.medium'),
    }), [t]);

    const actionCategoryLabels = useMemo(() => ({
        'Juridisk': t('actions.categories.legal'),
        'Finansiel': t('actions.categories.financial'),
        'Efterretning': t('actions.categories.intelligence'),
        'Kommerciel': t('actions.categories.commercial'),
        'Regulatorisk': t('actions.categories.regulatory'),
        'Governance': t('actions.categories.governance'),
        'Strategisk': t('actions.categories.strategic'),
    }), [t]);

    const handleAnalyze = (scenario: Scenario) => {
        setAnalysisResult('');
        setError(null);
        setSelectedScenarioId(scenario.id);
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
                    if(cache[selectedScenario.original.id]) {
                        setAnalysisResult(cache[selectedScenario.original.id]);
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

                    **Scenarie: ${selectedScenario.original.name}**
                    - Beskrivelse: ${selectedScenario.original.description}
                    - Forudsætninger: ${selectedScenario.original.assumptions.join(', ')}
                    - Forventet Udfald: ${selectedScenario.original.expectedOutcome}

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
                cache[selectedScenario.original.id] = resultText;
                localStorage.setItem(AI_CACHE_KEY, JSON.stringify(cache));

            } catch (e: any) {
                setError(e.message || t('ai.error'));
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        generateAnalysis();

    }, [selectedScenario, actionsData, t]);


    return (
        <div className="flex">
             <div className={`w-full transition-all duration-300 ${selectedScenario ? 'md:w-2/3 lg:w-3/4' : 'w-full'}`}>
                <div className="space-y-8">
                    <div>
                        <h2 className="text-xl font-bold text-gray-200 mb-2 flex items-center">
                            <Route className="w-6 h-6 mr-3 text-gray-400" />
                            {t('scenarios.heading')}
                        </h2>
                        <p className="text-gray-400 max-w-3xl">{t('intro')}</p>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 auto-rows-fr">
                        {resolvedScenarios
                            .sort((a,b) => {
                                const order = { 'Best': 1, 'Base': 2, 'Worst': 3, 'Exit': 4 };
                                return order[a.original.category] - order[b.original.category];
                            })
                            .map(({ original, display }) => (
                                <ScenarioCard
                                    key={original.id}
                                    scenario={original}
                                    display={display}
                                    probabilityLabel={probabilityLabels[original.probability] ?? original.probability}
                                    impactLabel={impactLabels[original.impact] ?? original.impact}
                                    analyzeLabel={t('scenarios.card.analyzeCta')}
                                    onAnalyze={handleAnalyze}
                                />
                        ))}
                    </div>
                </div>
            </div>
            {selectedScenario && (
                <AIAnalysisPanel
                    analysis={analysisResult}
                    isLoading={isLoading}
                    error={error}
                    onClose={() => setSelectedScenarioId(null)}
                    scenario={selectedScenario}
                    linkedActions={linkedActions}
                    priorityLabels={actionPriorityLabels}
                    categoryLabels={actionCategoryLabels}
                />
            )}
        </div>
    );
};

export default ScenariosView;
