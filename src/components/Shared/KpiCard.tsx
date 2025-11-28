import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useFormatters } from '../../domains/settings/hooks';

interface KpiCardProps {
    title: string;
    value: string;
    unit?: string;
    change?: number;
    changeType?: 'positive' | 'negative';
    sparklineData?: { year: number; value: number }[];
    onClick?: () => void;
    children?: React.ReactNode;
    color: 'green' | 'yellow' | 'red' | 'orange' | 'gold';
    icon?: React.ReactNode;
    variant?: 'default' | 'compact' | 'featured';
}

const colorClasses = {
    green: 'text-accent-green',
    yellow: 'text-yellow-400',
    red: 'text-red-500',
    orange: 'text-orange-400',
    gold: 'text-[var(--color-gold)]'
};

const sparklineColor = {
    green: '#00cc66',
    yellow: '#d69e2e',
    red: '#e53e3e',
    orange: '#dd6b20',
    gold: '#E3B23C'
}

export const KpiCard: React.FC<KpiCardProps> = ({
    title,
    value,
    unit,
    change,
    changeType,
    sparklineData,
    onClick,
    children,
    color,
    icon,
    variant = 'default'
}) => {
    const { formatPercent } = useFormatters();

    const ChangeIndicator = () => {
        if (change === undefined || changeType === undefined) return null;

        const isPositive = changeType === 'positive';
        const isNegative = changeType === 'negative';

        const trendColor = (isPositive && change > 0) || (isNegative && change < 0) ? 'text-green-400' : 'text-red-400';
        const Icon = change > 0 ? TrendingUp : TrendingDown;
        const formattedChange = formatPercent(change / 100, {
            maximumFractionDigits: 1,
            minimumFractionDigits: 1,
            signDisplay: 'exceptZero',
        });

        return (
             <div className={`flex items-center text-xs font-mono ${trendColor}`}>
                <Icon className="w-4 h-4 mr-1"/>
                <span>{formattedChange}</span>
            </div>
        );
    }

    // Featured variant with gold accent
    if (variant === 'featured') {
        return (
            <div
                className={`stat-card animate-fade-in-up ${onClick ? 'cursor-pointer' : ''}`}
                onClick={onClick}
                {...(onClick ? { role: 'button', tabIndex: 0, onKeyDown: (e) => e.key === 'Enter' && onClick() } : {})}
            >
                <div className="stat-card__header">
                    <h3 className="stat-card__title">
                        {icon && <span className="stat-card__icon">{icon}</span>}
                        {title}
                    </h3>
                    <ChangeIndicator />
                </div>
                <p className="stat-card__value">
                    {value}
                    {unit && <span className="stat-card__unit">{unit}</span>}
                </p>
                {children && <div className="stat-card__description">{children}</div>}
                {sparklineData && sparklineData.length > 0 && (
                    <div className="h-14 w-full mt-3 opacity-70">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sparklineData}>
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="var(--color-gold)"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        );
    }

    // Default/compact variants
    return (
        <div
            className={`bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] flex flex-col justify-between transition-all duration-200 hover:border-[var(--color-gold)]/30 hover:shadow-lg hover:shadow-[var(--color-gold)]/5 ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
            {...(onClick ? { role: 'button', tabIndex: 0, onKeyDown: (e) => e.key === 'Enter' && onClick() } : {})}
        >
            <div className="p-4">
                <h3 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-2">
                    {icon && <span className="text-[var(--color-gold)]">{icon}</span>}
                    {title}
                </h3>
                <div className="flex justify-between items-baseline mt-2">
                    <p className={`text-3xl font-bold ${colorClasses[color]}`}>
                        {value}
                        {unit && <span className="text-lg ml-1 font-medium text-[var(--color-text-muted)]">{unit}</span>}
                    </p>
                    <ChangeIndicator />
                </div>
                {children && <div className="text-xs text-[var(--color-text-muted)] mt-1">{children}</div>}
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
