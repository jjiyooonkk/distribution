"use client";

import React, { useState, useEffect } from 'react';
import { TeamConfig, Personnel } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AgentChat } from './AgentChat';
import { Search, UserPlus, X, Info, RotateCcw } from 'lucide-react';

interface BoardProps {
    initialTeams: TeamConfig[];
    unassigned: Personnel[];
    columnHeaders?: string[];
    onExport: () => void; // This will trigger Step 4
    onUpdateTeams: (teams: TeamConfig[], unassigned: Personnel[]) => void;
}

export const DistributionBoard: React.FC<BoardProps> = ({ initialTeams, unassigned, columnHeaders = [], onExport, onUpdateTeams }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [localTeams, setLocalTeams] = useState<TeamConfig[]>(initialTeams);
    const [localUnassigned, setLocalUnassigned] = useState<Personnel[]>(unassigned);

    useEffect(() => {
        setLocalTeams(initialTeams);
        setLocalUnassigned(unassigned);
    }, [initialTeams, unassigned]);

    const handleAssign = (personId: string, teamId: string, slotIndex: number) => {
        if (!personId) {
            // Remove from slot
            const updatedTeams = [...localTeams];
            const team = updatedTeams.find(t => t.id === teamId);
            if (team && team.members) {
                const removedPerson = team.members[slotIndex];
                if (removedPerson) {
                    team.members.splice(slotIndex, 1);
                    setLocalUnassigned(prev => [...prev, removedPerson]);
                    setLocalTeams(updatedTeams);
                    onUpdateTeams(updatedTeams, [...localUnassigned, removedPerson]);
                }
            }
            return;
        }

        const person = localUnassigned.find(p => p.id === personId);
        if (person) {
            const updatedTeams = [...localTeams];
            const team = updatedTeams.find(t => t.id === teamId);
            if (team) {
                team.members = team.members || [];
                // If there's already someone in this slot, return them to unassigned
                if (team.members[slotIndex]) {
                    const existing = team.members[slotIndex];
                    setLocalUnassigned(prev => [...prev.filter(p => p.id !== personId), existing]);
                } else {
                    setLocalUnassigned(prev => prev.filter(p => p.id !== personId));
                }

                team.members[slotIndex] = { ...person, assignedTeamId: teamId };
                setLocalTeams(updatedTeams);

                // Trigger state lift
                const currentUnassigned = localUnassigned.filter(p => p.id !== personId);
                onUpdateTeams(updatedTeams, currentUnassigned);
            }
        }
    };

    const handleRemove = (teamId: string, personId: string) => {
        const updatedTeams = [...localTeams];
        const team = updatedTeams.find(t => t.id === teamId);
        if (team && team.members) {
            const personIndex = team.members.findIndex(m => m.id === personId);
            if (personIndex !== -1) {
                const [removed] = team.members.splice(personIndex, 1);
                const updatedUnassigned = [...localUnassigned, removed];
                setLocalTeams(updatedTeams);
                setLocalUnassigned(updatedUnassigned);
                onUpdateTeams(updatedTeams, updatedUnassigned);
            }
        }
    };

    const filteredUnassigned = localUnassigned.filter(p =>
        p.name.includes(searchQuery) || (p.id || '').includes(searchQuery)
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="미배정 인원 이름/학번 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ padding: '10px 12px 10px 40px', borderRadius: '10px', border: '1px solid var(--border)', width: '300px', fontSize: '0.9rem' }}
                        />
                    </div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        남은 인원: <strong>{localUnassigned.length}명</strong>
                    </span>
                </div>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    <RotateCcw size={16} /> 전체 초기화
                </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
                {localTeams.map((team) => (
                    <Card key={team.id} style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{team.name}</h3>
                            <div style={{ fontSize: '0.85rem', padding: '4px 10px', borderRadius: '20px', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 700 }}>
                                {team.members?.length || 0} / {team.capacity}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {Array.from({ length: team.capacity }).map((_, i) => {
                                const m = team.members ? team.members[i] : null;
                                return (
                                    <div key={i} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '10px 14px',
                                        borderRadius: '10px',
                                        background: m ? 'rgba(99, 102, 241, 0.05)' : 'var(--surface)',
                                        border: m ? '1px solid var(--primary-light)' : '1px dashed var(--border)',
                                        minHeight: '48px'
                                    }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', width: '20px' }}>{i + 1}</span>
                                        {m ? (
                                            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{m.name}</span>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>{m.tags?.[0]}</span>
                                                </div>
                                                <button onClick={() => handleRemove(team.id, m.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <select
                                                style={{ flex: 1, background: 'none', border: 'none', fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer', outline: 'none' }}
                                                value=""
                                                onChange={(e) => handleAssign(e.target.value, team.id, i)}
                                            >
                                                <option value="">+ 인원 추가...</option>
                                                {filteredUnassigned.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name} ({p.tags?.[0] || '정보 없음'})</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', color: '#0369a1' }}>
                <Info size={20} />
                <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                    상단의 검색 기능을 활용하여 특정 인원을 원하는 조에 먼저 배정할 수 있습니다.
                    수동 배정 후 하단의 AI 주문 기능을 사용하면 남은 인원을 최적으로 채워줍니다.
                </p>
            </div>
        </div>
    );
};
