import React from 'react';
import { Info } from 'lucide-react';
import { Subject } from '../../types';

interface IntelligenceSummaryCardProps {
    activeSubject: Subject;
}

const TslSummary: React.FC = () => (
    <p className="text-sm text-gray-300">
        Høj/Alvorlig risiko (79/100) er ikke drevet af dårlig indtjening, men af en farlig cocktail af 
        <span className="font-semibold text-red-400"> akut illikviditet</span>, 
        en <span className="font-semibold text-red-400">verserende skattesag</span>, 
        <span className="font-semibold text-orange-400"> svag governance</span> og en ny, 
        <span className="font-semibold text-yellow-400"> uafklaret Dubai-eksponering</span>.
    </p>
);

const UmitSummary: React.FC = () => (
     <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
        <li><span className="font-semibold text-red-400">Personlig juridisk risiko:</span> Direkte eksponering for ledelsesansvar i skattesag og ved potentiel konkurs i TS Logistik.</li>
        <li><span className="font-semibold text-orange-400">Høj finansiel eksponering:</span> Privatøkonomi er tæt sammenkoblet med TSL-koncernens overlevelse. Formue er bundet i illikvide aktiver.</li>
        <li><span className="font-semibold text-yellow-400">Governance-svaghed:</span> 100% UBO-kontrol uden uafhængig granskning muliggør højrisikostrategier som kapitaldræn.</li>
        <li><span className="font-semibold text-blue-400">Strategisk aktivbeskyttelse:</span> Holding-strukturen er effektiv til at beskytte ejendomsinvesteringer mod almindelige kreditorer.</li>
    </ul>
);


export const IntelligenceSummaryCard: React.FC<IntelligenceSummaryCardProps> = ({ activeSubject }) => {
    const isTsl = activeSubject === 'tsl';
    const title = isTsl ? "Case Summary: TS Logistik (Erhverv)" : "Case Summary: Ümit Cetin (Privat)";

    return (
        <div className="bg-component-dark p-6 rounded-lg border border-border-dark h-full">
            <h3 className="text-md font-bold text-gray-200 mb-4 border-b border-border-dark pb-2 flex items-center">
                <Info className="w-4 h-4 mr-2 text-gray-400"/>
                {title}
            </h3>
            {isTsl ? <TslSummary /> : <UmitSummary />}
        </div>
    );
};