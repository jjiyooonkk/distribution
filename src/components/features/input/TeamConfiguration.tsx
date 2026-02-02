"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { TeamConfig } from '@/types';
import { Trash2, Plus, Wand2 } from 'lucide-react';

interface TeamConfigurationProps {
    onComplete: (teams: TeamConfig[]) => void;
}

export const TeamConfiguration: React.FC<TeamConfigurationProps> = ({ onComplete }) => {
    const [teams, setTeams] = useState<TeamConfig[]>([]);

    // Auto-generation state
    const [prefix, setPrefix] = useState('Team');
    const [startNum, setStartNum] = useState(1);
    const [endNum, setEndNum] = useState(8);
    const [defaultCapacity, setDefaultCapacity] = useState(10);

    // Hydration fix: Ensure initial teams are generated only on client if needed, or use static IDs
    // Actually, random IDs for new items are fine on user action.
    // But if there were initial items using Date.now() during render, that would be an issue.
    // The current code starts with [], so that's safe.
    // However, let's make the ID generator more robust or just random enough.
    const generateId = () => `id-${Math.random().toString(36).substr(2, 9)}`;

    const handleAutoGenerate = () => {
        const newTeams: TeamConfig[] = [];
        for (let i = startNum; i <= endNum; i++) {
            newTeams.push({
                id: `auto-${generateId()}-${i}`,
                name: `${prefix} ${i}`,
                capacity: defaultCapacity
            });
        }
        setTeams([...teams, ...newTeams]);
    };

    const addManualTeam = () => {
        setTeams([
            ...teams,
            {
                id: `manual-${generateId()}`,
                name: `New Unit ${teams.length + 1}`,
                capacity: defaultCapacity
            }
        ]);
    };

    const updateTeam = (id: string, field: keyof TeamConfig, value: string | number) => {
        setTeams(teams.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const removeTeam = (id: string) => {
        setTeams(teams.filter(t => t.id !== id));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* 1. Generator Section */}
            <section>
                <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'inline-block', marginRight: '8px' }}>
                        빠른 일괄 생성
                    </h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        (예시: '1조'부터 '8조'까지 10명씩 한번에 만들기)
                    </span>
                </div>

                <Card style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', alignItems: 'end' }}>
                    <Input
                        label="팀/그룹 명칭 (예: 조, 팀)"
                        value={prefix}
                        onChange={(e) => setPrefix(e.target.value)}
                    />
                    <Input
                        label="시작 번호 (Start)"
                        type="number"
                        value={startNum}
                        onChange={(e) => setStartNum(parseInt(e.target.value))}
                    />
                    <Input
                        label="종료 번호 (End)"
                        type="number"
                        value={endNum}
                        onChange={(e) => setEndNum(parseInt(e.target.value))}
                    />
                    <Input
                        label="팀당 정원 (명)"
                        type="number"
                        value={defaultCapacity}
                        onChange={(e) => setDefaultCapacity(parseInt(e.target.value))}
                    />
                    <Button onClick={handleAutoGenerate} variant="secondary" style={{ height: '42px', fontWeight: 600 }}>
                        <Wand2 size={16} /> 일괄 생성 적용
                    </Button>
                </Card>
            </section>

            {/* 2. Team List Editor */}
            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>구성된 팀 리스트 ({teams.length})</h3>
                    <Button onClick={addManualTeam} variant="secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                        <Plus size={14} /> 개별 팀 추가
                    </Button>
                </div>

                {teams.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                        <span style={{ display: 'block', marginBottom: '8px', fontSize: '1.1rem' }}>아직 생성된 팀이 없습니다.</span>
                        <span style={{ fontSize: '0.9rem' }}>위의 '빠른 일괄 생성'을 사용하거나 '개별 팀 추가' 버튼을 눌러주세요.</span>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                        {teams.map((team) => (
                            <Card key={team.id} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <Input
                                        value={team.name}
                                        onChange={(e) => updateTeam(team.id, 'name', e.target.value)}
                                        style={{ marginBottom: '8px', fontWeight: 'bold' }}
                                        placeholder="팀 이름 입력"
                                    />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>최대 인원:</span>
                                        <Input
                                            type="number"
                                            value={team.capacity}
                                            onChange={(e) => updateTeam(team.id, 'capacity', parseInt(e.target.value))}
                                            style={{ width: '70px', padding: '4px 8px', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeTeam(team.id)}
                                    style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                    title="삭제"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            {/* Action Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <Button onClick={() => onComplete(teams)} disabled={teams.length === 0} style={{ width: '200px' }}>
                    다음 단계 (명단 업로드)
                </Button>
            </div>
        </div>
    );
};
