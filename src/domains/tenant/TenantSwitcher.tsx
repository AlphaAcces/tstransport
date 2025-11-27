/**
 * Tenant Switcher Component
 *
 * Dropdown component for multi-tenant users to switch between tenants.
 * Displays current tenant with branding and provides quick access to switch.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Building2, Check, Loader2, AlertCircle, Crown, Shield, Eye, Users } from 'lucide-react';
import { useTenant, useBranding } from './TenantContext';
import { tenantApi, TenantListItem } from './tenantApi';
import type { TenantRole } from './types';

// ============================================================================
// Types
// ============================================================================

interface TenantSwitcherProps {
  variant?: 'default' | 'compact' | 'minimal';
  showRole?: boolean;
  onTenantChange?: (tenantId: string) => void;
  className?: string;
}

// ============================================================================
// Role Icon Component
// ============================================================================

const RoleIcon: React.FC<{ role: string; className?: string }> = ({ role, className = 'w-3 h-3' }) => {
  switch (role) {
    case 'owner':
      return <Crown className={className} />;
    case 'admin':
      return <Shield className={className} />;
    case 'analyst':
      return <Users className={className} />;
    case 'viewer':
      return <Eye className={className} />;
    default:
      return <Users className={className} />;
  }
};

// ============================================================================
// Role Badge Component
// ============================================================================

const RoleBadge: React.FC<{ role: TenantRole }> = ({ role }) => {
  const { t } = useTranslation();

  const roleColors: Record<TenantRole, string> = {
    owner: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    admin: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    analyst: 'bg-green-500/20 text-green-400 border-green-500/30',
    viewer: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    guest: 'bg-gray-600/20 text-gray-500 border-gray-600/30',
  };

  const roleLabels: Record<TenantRole, string> = {
    owner: t('tenant.roles.owner', 'Ejer'),
    admin: t('tenant.roles.admin', 'Administrator'),
    analyst: t('tenant.roles.analyst', 'Analytiker'),
    viewer: t('tenant.roles.viewer', 'Læser'),
    guest: t('tenant.roles.guest', 'Gæst'),
  };

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border ${roleColors[role]}`}>
      <RoleIcon role={role} className="w-2.5 h-2.5" />
      {roleLabels[role]}
    </span>
  );
};

// ============================================================================
// Tenant Logo Component
// ============================================================================

const TenantLogo: React.FC<{ tenant: TenantListItem; size?: 'sm' | 'md' | 'lg' }> = ({ tenant, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  if (tenant.logoUrl) {
    return (
      <img
        src={tenant.logoUrl}
        alt={tenant.name}
        className={`${sizeClasses[size]} rounded-lg object-contain bg-gray-800/50`}
        onError={(e) => {
          // Fallback to initials on error
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />
    );
  }

  // Initials fallback
  const initials = tenant.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`${sizeClasses[size]} rounded-lg bg-gradient-to-br from-accent-green/20 to-accent-green/5 border border-accent-green/30 flex items-center justify-center font-semibold text-accent-green`}>
      {initials}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const TenantSwitcher: React.FC<TenantSwitcherProps> = ({
  variant = 'default',
  showRole = true,
  onTenantChange,
  className = '',
}) => {
  const { t } = useTranslation();
  const { tenant, user, setTenant, setUser } = useTenant();
  const branding = useBranding();

  const [isOpen, setIsOpen] = useState(false);
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load available tenants
  useEffect(() => {
    const loadTenants = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await tenantApi.getUserTenants();

        if (response.success && response.data) {
          setTenants(response.data);
        } else {
          setError(response.error || 'Failed to load tenants');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setIsLoading(false);
      }
    };

    loadTenants();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle tenant switch
  const handleTenantSwitch = async (tenantId: string) => {
    if (tenantId === tenant?.id || isSwitching) return;

    setIsSwitching(true);
    setError(null);

    try {
      const response = await tenantApi.switchTenant(tenantId);

      if (response.success && response.data) {
        setTenant(response.data.tenant);
        setUser(response.data.user);
        onTenantChange?.(tenantId);
        setIsOpen(false);
      } else {
        setError(response.error || 'Failed to switch tenant');
      }
    } catch (err) {
      setError('Network error during switch');
    } finally {
      setIsSwitching(false);
    }
  };

  // Current tenant info
  const currentTenant = tenants.find(t => t.id === tenant?.id);
  const hasMultipleTenants = tenants.length > 1;

  // Minimal variant - just logo
  if (variant === 'minimal') {
    if (!currentTenant) return null;

    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => hasMultipleTenants && setIsOpen(!isOpen)}
          disabled={!hasMultipleTenants}
          className={`flex items-center gap-1.5 p-1 rounded-lg transition-colors ${
            hasMultipleTenants ? 'hover:bg-gray-800/50 cursor-pointer' : 'cursor-default'
          }`}
        >
          <TenantLogo tenant={currentTenant} size="sm" />
          {hasMultipleTenants && <ChevronDown className="w-3 h-3 text-gray-500" />}
        </button>

        {isOpen && hasMultipleTenants && (
          <TenantDropdown
            tenants={tenants}
            currentTenantId={tenant?.id}
            onSelect={handleTenantSwitch}
            isSwitching={isSwitching}
          />
        )}
      </div>
    );
  }

  // Compact variant - logo + name
  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => hasMultipleTenants && setIsOpen(!isOpen)}
          disabled={!hasMultipleTenants || isLoading}
          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border-dark/60 bg-component-dark/50 transition-colors ${
            hasMultipleTenants ? 'hover:bg-component-dark/80 cursor-pointer' : 'cursor-default'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
          ) : currentTenant ? (
            <>
              <TenantLogo tenant={currentTenant} size="sm" />
              <span className="text-sm font-medium text-gray-200 max-w-[120px] truncate">
                {currentTenant.name}
              </span>
            </>
          ) : (
            <Building2 className="w-4 h-4 text-gray-500" />
          )}
          {hasMultipleTenants && <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
        </button>

        {isOpen && hasMultipleTenants && (
          <TenantDropdown
            tenants={tenants}
            currentTenantId={tenant?.id}
            onSelect={handleTenantSwitch}
            isSwitching={isSwitching}
            showRole={showRole}
          />
        )}
      </div>
    );
  }

  // Default variant - full card
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => hasMultipleTenants && setIsOpen(!isOpen)}
        disabled={!hasMultipleTenants || isLoading}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-border-dark/70 bg-component-dark/40 transition-all ${
          hasMultipleTenants ? 'hover:bg-component-dark/70 hover:border-border-dark cursor-pointer' : 'cursor-default'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">{t('tenant.loading', 'Indlæser...')}</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        ) : currentTenant ? (
          <>
            <TenantLogo tenant={currentTenant} size="md" />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-gray-100 truncate">
                {branding.companyName || currentTenant.name}
              </p>
              {showRole && user && (
                <div className="mt-0.5">
                  <RoleBadge role={user.role} />
                </div>
              )}
            </div>
            {hasMultipleTenants && (
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 text-gray-500">
            <Building2 className="w-5 h-5" />
            <span className="text-sm">{t('tenant.noTenant', 'Ingen organisation valgt')}</span>
          </div>
        )}
      </button>

      {isOpen && hasMultipleTenants && (
        <TenantDropdown
          tenants={tenants}
          currentTenantId={tenant?.id}
          onSelect={handleTenantSwitch}
          isSwitching={isSwitching}
          showRole={showRole}
        />
      )}
    </div>
  );
};

// ============================================================================
// Dropdown Component
// ============================================================================

interface TenantDropdownProps {
  tenants: TenantListItem[];
  currentTenantId?: string;
  onSelect: (tenantId: string) => void;
  isSwitching: boolean;
  showRole?: boolean;
}

const TenantDropdown: React.FC<TenantDropdownProps> = ({
  tenants,
  currentTenantId,
  onSelect,
  isSwitching,
  showRole = true,
}) => {
  const { t } = useTranslation();

  return (
    <div className="absolute top-full left-0 right-0 mt-1 z-50 min-w-[240px] rounded-xl border border-border-dark/70 bg-component-dark/95 backdrop-blur-xl shadow-xl overflow-hidden">
      <div className="px-3 py-2 border-b border-border-dark/50">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          {t('tenant.switchOrganization', 'Skift organisation')}
        </p>
      </div>

      <div className="max-h-[300px] overflow-y-auto py-1">
        {tenants.map(tenant => {
          const isActive = tenant.id === currentTenantId;

          return (
            <button
              key={tenant.id}
              onClick={() => onSelect(tenant.id)}
              disabled={isActive || isSwitching}
              className={`w-full flex items-center gap-3 px-3 py-2 transition-colors ${
                isActive
                  ? 'bg-accent-green/10 cursor-default'
                  : 'hover:bg-gray-800/50 cursor-pointer'
              }`}
            >
              <TenantLogo tenant={tenant} size="sm" />
              <div className="flex-1 min-w-0 text-left">
                <p className={`text-sm font-medium truncate ${isActive ? 'text-accent-green' : 'text-gray-200'}`}>
                  {tenant.name}
                </p>
                {showRole && (
                  <p className="text-[10px] text-gray-500 capitalize">{tenant.role}</p>
                )}
              </div>
              {isActive && <Check className="w-4 h-4 text-accent-green shrink-0" />}
              {isSwitching && !isActive && <Loader2 className="w-4 h-4 animate-spin text-gray-500 shrink-0" />}
            </button>
          );
        })}
      </div>

      <div className="px-3 py-2 border-t border-border-dark/50 bg-gray-900/30">
        <p className="text-[10px] text-gray-500 text-center">
          {t('tenant.tenantCount', '{{count}} organisationer tilgængelige', { count: tenants.length })}
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// Exports
// ============================================================================

export { RoleBadge, RoleIcon, TenantLogo };
export default TenantSwitcher;
