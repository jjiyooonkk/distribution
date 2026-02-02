import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Settings, AlertCircle } from 'lucide-react';
import { Personnel } from '@/types';

export type RuleType = 'distribute_evenly' | 'assign_to_team' | 'group_together' | 'separate';

export interface DistributionRule {
    id: string;
    column: string; // 'gender', 'name', 'history', 'tags', or attribute key
    value?: string; // Target value (e.g. 'Driver', 'Part-timer')
    type: RuleType;
    targetTeamId?: string; // For 'assign_to_team'
}

interface DistributionRulesProps {
    columns: string[]; // List of available columns (standard + extra)
    teams: { id: string, name: string }[];
    rules: DistributionRule[];
    onRulesChange: (rules: DistributionRule[]) => void;
}

export const DistributionRules: React.FC<DistributionRulesProps> = ({ columns, teams, rules, onRulesChange }) => {

    const addRule = () => {
        const newRule: DistributionRule = {
            id: Date.now().toString(),
            column: columns[0] || '',
            type: 'distribute_evenly'
        };
        onRulesChange([...rules, newRule]);
    };

    const removeRule = (id: string) => {
        onRulesChange(rules.filter(r => r.id !== id));
    };

    const updateRule = (id: string, field: keyof DistributionRule, value: any) => {
        onRulesChange(rules.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    return (
        <Card style={{ padding: '24px', marginTop: '24px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Settings size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>자동 배정 규칙 설정</h3>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                특정 조건(예: 운전 가능자, 아르바이트생)에 대한 배정 규칙을 설정합니다.
                <br />
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    * 규칙은 위에서부터 순서대로 적용됩니다.
                </span>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {rules.map((rule) => (
                    <div key={rule.id} style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                        background: '#f8fafc',
                        padding: '12px',
                        borderRadius: '8px',
                        flexWrap: 'wrap'
                    }}>
                        {/* 1. Condition Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.75rem', color: '#64748b' }}>대상 컬럼</label>
                            <select
                                className="input-field"
                                value={rule.column}
                                onChange={(e) => updateRule(rule.id, 'column', e.target.value)}
                                style={{ minWidth: '120px' }}
                            >
                                {columns.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* 2. Target Value (Optional based on type, but mostly needed unless boolean) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.75rem', color: '#64748b' }}>값 (필터)</label>
                            <input
                                className="input-field"
                                placeholder="예: O, 운전, 1"
                                value={rule.value || ''}
                                onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
                                style={{ width: '100px' }}
                            />
                        </div>

                        {/* 3. Action Type */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.75rem', color: '#64748b' }}>규칙</label>
                            <select
                                className="input-field"
                                value={rule.type}
                                onChange={(e) => updateRule(rule.id, 'type', e.target.value as RuleType)}
                                style={{ minWidth: '150px' }}
                            >
                                <option value="distribute_evenly">팀별 골고루 분산</option>
                                <option value="assign_to_team">특정 팀에 몰아주기</option>
                                {/* Future: <option value="separate">서로 떼어놓기</option> */}
                            </select>
                        </div>

                        {/* 4. Target Team (Only for assign_to_team) */}
                        {rule.type === 'assign_to_team' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.75rem', color: '#64748b' }}>목표 팀</label>
                                <select
                                    className="input-field"
                                    value={rule.targetTeamId || ''}
                                    onChange={(e) => updateRule(rule.id, 'targetTeamId', e.target.value)}
                                    style={{ minWidth: '120px' }}
                                >
                                    <option value="">팀 선택...</option>
                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        )}

                        <div style={{ flex: 1 }}></div>

                        <button
                            onClick={() => removeRule(rule.id)}
                            style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
                            title="규칙 삭제"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}

                {rules.length === 0 && (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
                        설정된 규칙이 없습니다.
                    </div>
                )}

                <Button variant="outline" onClick={addRule} style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
                    <Plus size={16} /> 규칙 추가하기
                </Button>
            </div>
        </Card>
    );
};
