
import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
    title: string;
    value: string;
    unit?: string;
    change?: number;
    changeType?: 'positive' | 'negative';
    sparklineData?: { year: number; value: number }[];
    onClick?: () => void;
    children?: React.ReactNode;
    color: 'green' | 'yellow' | 'red' | 'orange';
    icon?: React.ReactNode;
}

const colorClasses = {
    green: 'text-accent-green',
    yellow: 'text-yellow-400',
    red: 'text-red-500',
    orange: 'text-orange-400'
};

const sparklineColor = {
    green: '#00cc66',
    yellow: '#d69e2e',
    red: '#e53e3e',
    orange: '#dd6b20'
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, unit, change, changeType, sparklineData, onClick, children, color, icon }) => {
    
    const ChangeIndicator = () => {
        if (change === undefined || changeType === undefined) return null;
        
        const isPositive = changeType === 'positive';
        const isNegative = changeType === 'negative';

        const trendColor = (isPositive && change > 0) || (isNegative && change < 0) ? 'text-green-400' : 'text-red-400';
        const Icon = change > 0 ? TrendingUp : TrendingDown;

        return (
             <div className={`flex items-center text-xs font-mono ${trendColor}`}>
                <Icon className="w-4 h-4 mr-1"/>
                <span>{change.toFixed(1)}%</span>
            </div>
        );
    }

    return (
        <div 
            className={`bg-component-dark rounded-lg border border-border-dark flex flex-col justify-between transition-all duration-200 ${onClick ? 'cursor-pointer hover:border-accent-green/50 hover:shadow-lg hover:shadow-accent-green/5' : ''}`}
            onClick={onClick}
            {...(onClick ? { role: 'button', tabIndex: 0, onKeyPress: (e) => e.key === 'Enter' && onClick() } : {})}
        >
            <div className="p-4">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center">
                    {icon && <span className="mr-2">{icon}</span>}
                    {title}
                </h3>
                <div className="flex justify-between items-baseline mt-2">
                    <p className={`text-3xl font-bold ${colorClasses[color]}`}>
                        {value}
                        {unit && <span className="text-lg ml-1 font-medium text-gray-400">{unit}</span>}
                    </p>
                    <ChangeIndicator />
                </div>
                {children && <div className="text-xs text-gray-500 mt-1">{children}</div>}
            </div>
            {sparklineData && sparklineData.length > 0 && (
                <div className="h-16 w-full opacity-60">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparklineData}>
                            <Line type="monotone" dataKey="value" stroke={sparklineColor[color]} strokeWidth={2} dot={false}/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};
