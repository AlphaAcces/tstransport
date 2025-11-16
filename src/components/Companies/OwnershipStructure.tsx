import React from 'react';
import { User } from 'lucide-react';

// FIX: Added `children` to the props type to allow nesting of Node components.
const Node: React.FC<{ label: string; sublabel: string; level: 'ubo' | 'holding' | 'subsidiary' | 'historical', isLast?: boolean, className?: string, children?: React.ReactNode }> = ({ label, sublabel, level, children, className }) => {
    // FIX: Added an explicit type for `levelStyles` to make the `icon` property optional and fix type errors.
    const levelStyles: Record<'ubo' | 'holding' | 'subsidiary' | 'historical', { bg: string; border: string; icon?: React.ReactNode }> = {
        ubo: { bg: 'bg-accent-green/10', border: 'border-accent-green/50', icon: <User className="w-4 h-4 text-accent-green" /> },
        holding: { bg: 'bg-blue-900/40', border: 'border-blue-700' },
        subsidiary: { bg: 'bg-gray-800/60', border: 'border-gray-600' },
        historical: { bg: 'bg-gray-800/40', border: 'border-gray-700 border-dashed' }
    };

    const styles = levelStyles[level];

    return (
        <div className={`flex flex-col items-center relative ${className}`}>
            <div className={`flex items-center space-x-3 p-3 rounded-lg border min-w-[200px] text-center ${styles.bg} ${styles.border}`}>
                {styles.icon && <span>{styles.icon}</span>}
                <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-gray-200">{label}</span>
                    <span className="text-xs text-gray-400 font-mono">{sublabel}</span>
                </div>
            </div>
            {children && (
                <div className="flex justify-center mt-6 relative">
                    {/* Vertical connector line */}
                    <div className="absolute bottom-full h-6 w-px bg-gray-600"></div>
                    {children}
                </div>
            )}
        </div>
    );
};

// FIX: Added `children` to props to correctly type the component.
const ChildNodeContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex flex-col md:flex-row gap-8 items-stretch relative">
            {/* Horizontal connector line */}
            <div className="hidden md:block absolute top-[-24px] left-1/4 right-1/4 h-px bg-gray-600"></div>
            {/* Mobile Vertical connector line */}
            <div className="md:hidden absolute left-[-24px] top-1/4 bottom-1/4 w-px bg-gray-600"></div>
            {children}
        </div>
    );
};

const HistoricalSection: React.FC = () => (
    <div className="mt-8 pt-6 border-t border-border-dark/50">
        <h4 className="text-center text-sm font-bold text-gray-400 mb-4">Historiske / Perifere Enheder</h4>
        <div className="flex flex-wrap justify-center gap-4">
            <Node label="Lund Capital Holding ApS" sublabel="Overdraget" level="historical" className="opacity-75" />
            <Node label="Gorm & Partnere ApS" sublabel="Ophørt" level="historical" className="opacity-75" />
        </div>
    </div>
);


export const OwnershipStructure: React.FC = () => {
    return (
        <div className="flex flex-col items-center p-4 overflow-x-auto">
            <Node label="Ümit Cetin" sublabel="Ejer / UBO" level="ubo">
                <ChildNodeContainer>
                    <Node label="CESR Holding ApS" sublabel="Holding" level="holding">
                        <ChildNodeContainer>
                             {/* Vertical connectors for subsidiaries */}
                            <div className="absolute bottom-full h-6 w-px bg-gray-600 md:hidden"></div>
                            <div className="absolute bottom-full h-6 w-px bg-gray-600 hidden md:block" style={{left: 'calc(50% - 1px)'}}></div>
                            
                            <Node label="TS Logistik ApS" sublabel="Drift" level="subsidiary" />
                            <Node label="CESR Ejendomme ApS" sublabel="Ejendom" level="subsidiary" />
                            <Node label="CESR ApS" sublabel="Bilsalg" level="subsidiary" />
                        </ChildNodeContainer>
                    </Node>
                </ChildNodeContainer>
            </Node>
             <HistoricalSection />
        </div>
    );
};