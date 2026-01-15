import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Satellite, Globe2, Radio, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import type { TLEData } from '../../types';
import { extractMetadata } from '../../utils/satellite';
import './FilterPanel.css';

export interface FilterState {
    operators: Set<string>;
    missionTypes: Set<string>;
    orbitClasses: Set<string>;
    countries: Set<string>;
    searchQuery: string;
    showOnlyVisible: boolean;
}

interface FilterPanelProps {
    satellites: TLEData[];
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    visibleCount: number;
    totalCount: number;
    renderedCount: number;
    dataTimestamp: number | null;
}

export function FilterPanel({
    satellites,
    filters,
    onFiltersChange,
    visibleCount,
    totalCount,
    renderedCount,
    dataTimestamp,
}: FilterPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>(null);

    // Extract unique values from satellites
    const filterOptions = useMemo(() => {
        const operators = new Set<string>();
        const missionTypes = new Set<string>();
        const countries = new Set<string>();

        for (const sat of satellites) {
            const meta = extractMetadata(sat);
            operators.add(meta.operator);
            missionTypes.add(meta.missionType);
            countries.add(meta.country);
        }

        return {
            operators: Array.from(operators).sort(),
            missionTypes: Array.from(missionTypes).sort(),
            countries: Array.from(countries).sort(),
            orbitClasses: ['LEO', 'MEO', 'GEO', 'HEO'],
        };
    }, [satellites]);

    const toggleOperator = useCallback((op: string) => {
        const newSet = new Set(filters.operators);
        if (newSet.has(op)) {
            newSet.delete(op);
        } else {
            newSet.add(op);
        }
        onFiltersChange({ ...filters, operators: newSet });
    }, [filters, onFiltersChange]);

    const toggleMissionType = useCallback((type: string) => {
        const newSet = new Set(filters.missionTypes);
        if (newSet.has(type)) {
            newSet.delete(type);
        } else {
            newSet.add(type);
        }
        onFiltersChange({ ...filters, missionTypes: newSet });
    }, [filters, onFiltersChange]);

    const toggleOrbitClass = useCallback((orbit: string) => {
        const newSet = new Set(filters.orbitClasses);
        if (newSet.has(orbit)) {
            newSet.delete(orbit);
        } else {
            newSet.add(orbit);
        }
        onFiltersChange({ ...filters, orbitClasses: newSet });
    }, [filters, onFiltersChange]);

    const toggleCountry = useCallback((country: string) => {
        const newSet = new Set(filters.countries);
        if (newSet.has(country)) {
            newSet.delete(country);
        } else {
            newSet.add(country);
        }
        onFiltersChange({ ...filters, countries: newSet });
    }, [filters, onFiltersChange]);

    const clearAllFilters = useCallback(() => {
        onFiltersChange({
            operators: new Set(),
            missionTypes: new Set(),
            orbitClasses: new Set(),
            countries: new Set(),
            searchQuery: '',
            showOnlyVisible: false,
        });
    }, [onFiltersChange]);

    const activeFilterCount =
        filters.operators.size +
        filters.missionTypes.size +
        filters.orbitClasses.size +
        filters.countries.size +
        (filters.searchQuery ? 1 : 0) +
        (filters.showOnlyVisible ? 1 : 0);

    return (
        <div className={`filter-panel ${isExpanded ? 'expanded' : ''}`}>
            {/* Header */}
            <div className="filter-header" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="filter-header-left">
                    <Filter size={16} />
                    <span className="filter-title">SATELLITE FILTERS</span>
                    {activeFilterCount > 0 && (
                        <span className="filter-badge">{activeFilterCount}</span>
                    )}
                </div>
                <div className="filter-header-right">
                    <span className="filter-stats">
                        {renderedCount.toLocaleString()} / {totalCount.toLocaleString()}
                    </span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        className="filter-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Search */}
                        <div className="filter-search">
                            <input
                                type="text"
                                placeholder="Search by name or NORAD ID..."
                                value={filters.searchQuery}
                                onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
                            />
                            {filters.searchQuery && (
                                <button
                                    className="search-clear"
                                    onClick={() => onFiltersChange({ ...filters, searchQuery: '' })}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Quick Toggles */}
                        <div className="filter-toggles">
                            <button
                                className={`toggle-btn ${filters.showOnlyVisible ? 'active' : ''}`}
                                onClick={() => onFiltersChange({ ...filters, showOnlyVisible: !filters.showOnlyVisible })}
                            >
                                {filters.showOnlyVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                                <span>Above Horizon Only</span>
                            </button>
                            {activeFilterCount > 0 && (
                                <button className="toggle-btn clear" onClick={clearAllFilters}>
                                    <X size={14} />
                                    <span>Clear All</span>
                                </button>
                            )}
                        </div>

                        {/* Operators */}
                        <FilterSection
                            title="OPERATORS"
                            icon={<Satellite size={14} />}
                            isOpen={activeSection === 'operators'}
                            onToggle={() => setActiveSection(activeSection === 'operators' ? null : 'operators')}
                        >
                            <div className="filter-chips">
                                {filterOptions.operators.map(op => (
                                    <button
                                        key={op}
                                        className={`chip ${filters.operators.has(op) ? 'active' : ''}`}
                                        onClick={() => toggleOperator(op)}
                                    >
                                        {op}
                                    </button>
                                ))}
                            </div>
                        </FilterSection>

                        {/* Mission Types */}
                        <FilterSection
                            title="MISSION TYPE"
                            icon={<Radio size={14} />}
                            isOpen={activeSection === 'mission'}
                            onToggle={() => setActiveSection(activeSection === 'mission' ? null : 'mission')}
                        >
                            <div className="filter-chips">
                                {filterOptions.missionTypes.map(type => (
                                    <button
                                        key={type}
                                        className={`chip ${filters.missionTypes.has(type) ? 'active' : ''}`}
                                        onClick={() => toggleMissionType(type)}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </FilterSection>

                        {/* Orbit Class */}
                        <FilterSection
                            title="ORBIT CLASS"
                            icon={<Globe2 size={14} />}
                            isOpen={activeSection === 'orbit'}
                            onToggle={() => setActiveSection(activeSection === 'orbit' ? null : 'orbit')}
                        >
                            <div className="filter-chips orbit-chips">
                                {filterOptions.orbitClasses.map(orbit => (
                                    <button
                                        key={orbit}
                                        className={`chip orbit-chip ${filters.orbitClasses.has(orbit) ? 'active' : ''}`}
                                        onClick={() => toggleOrbitClass(orbit)}
                                    >
                                        {orbit}
                                    </button>
                                ))}
                            </div>
                        </FilterSection>

                        {/* Countries */}
                        <FilterSection
                            title="COUNTRY"
                            icon={<Globe2 size={14} />}
                            isOpen={activeSection === 'country'}
                            onToggle={() => setActiveSection(activeSection === 'country' ? null : 'country')}
                        >
                            <div className="filter-chips">
                                {filterOptions.countries.map(country => (
                                    <button
                                        key={country}
                                        className={`chip ${filters.countries.has(country) ? 'active' : ''}`}
                                        onClick={() => toggleCountry(country)}
                                    >
                                        {country}
                                    </button>
                                ))}
                            </div>
                        </FilterSection>

                        {/* Debug Info */}
                        <div className="filter-debug">
                            <div className="debug-row">
                                <span>Total Catalog:</span>
                                <span>{totalCount.toLocaleString()}</span>
                            </div>
                            <div className="debug-row">
                                <span>Rendered:</span>
                                <span>{renderedCount.toLocaleString()}</span>
                            </div>
                            <div className="debug-row">
                                <span>Visible from location:</span>
                                <span>{visibleCount}</span>
                            </div>
                            {dataTimestamp && (
                                <div className="debug-row">
                                    <span>Data Updated:</span>
                                    <span>{new Date(dataTimestamp).toLocaleTimeString()}</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Section component
function FilterSection({
    title,
    icon,
    isOpen,
    onToggle,
    children
}: {
    title: string;
    icon: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className={`filter-section ${isOpen ? 'open' : ''}`}>
            <div className="section-header" onClick={onToggle}>
                {icon}
                <span>{title}</span>
                {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="section-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Default filter state
export function createDefaultFilters(): FilterState {
    return {
        operators: new Set(),
        missionTypes: new Set(),
        orbitClasses: new Set(),
        countries: new Set(),
        searchQuery: '',
        showOnlyVisible: false,
    };
}

// Apply filters to satellite list
export function applyFilters(satellites: TLEData[], filters: FilterState): TLEData[] {
    return satellites.filter(sat => {
        const meta = extractMetadata(sat);

        // Search query
        if (filters.searchQuery) {
            const query = filters.searchQuery.toUpperCase();
            const noradId = sat.line1.substring(2, 7);
            if (!sat.name.toUpperCase().includes(query) && !noradId.includes(query)) {
                return false;
            }
        }

        // Operator filter
        if (filters.operators.size > 0 && !filters.operators.has(meta.operator)) {
            return false;
        }

        // Mission type filter
        if (filters.missionTypes.size > 0 && !filters.missionTypes.has(meta.missionType)) {
            return false;
        }

        // Orbit class filter
        if (filters.orbitClasses.size > 0 && !filters.orbitClasses.has(meta.orbitClass)) {
            return false;
        }

        // Country filter
        if (filters.countries.size > 0 && !filters.countries.has(meta.country)) {
            return false;
        }

        return true;
    });
}
