"use client";

import React, { useState, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TeamConfig, Personnel } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AgentChat } from './AgentChat';
import { LayoutGrid, List, Users as UsersIcon, RotateCcw, Download } from 'lucide-react';

// --- Sortable Item Component ---
function SortableItem({ id, person }: { id: string, person: Personnel }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition: transition || undefined,
        opacity: isDragging ? 0.4 : 1,
        marginBottom: '10px',
        padding: '14px 16px',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${person.gender === 'M' ? '#60a5fa' : '#f472b6'}`,
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.95rem',
        cursor: 'grab',
        boxShadow: isDragging ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="animate-in fade-in duration-300"
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{person.name}</span>
                <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: person.gender === 'M' ? '#2563eb' : '#db2777',
                    background: person.gender === 'M' ? '#eff6ff' : '#fdf2f8',
                    padding: '2px 6px',
                    borderRadius: '4px'
                }}>
                    {person.gender}
                </span>
            </div>
            {person.history && person.history.length > 0 && (
                <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    gap: '4px',
                    flexWrap: 'wrap'
                }}>
                    {person.history.map((h, i) => (
                        <span key={i} style={{ opacity: 0.8 }}>#{h}</span>
                    ))}
                </div>
            )}
        </div>
    );
}

// --- Droppable Container Component ---
function DroppableContainer({ id, title, items, capacity }: { id: string, title: string, items: Personnel[], capacity: number }) {
    const { setNodeRef } = useSortable({ id });

    const mCount = items.filter(p => p.gender === 'M').length;
    const fCount = items.length - mCount;
    const isOverCapacity = items.length > capacity;

    return (
        <Card style={{
            minWidth: '300px',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            padding: '20px',
            background: isOverCapacity ? 'rgba(254, 242, 242, 0.5)' : 'var(--surface)',
            borderColor: isOverCapacity ? 'rgba(239, 68, 68, 0.2)' : 'var(--border)',
            overflow: 'hidden'
        }}>
            <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>{title}</h4>
                    <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: isOverCapacity ? 'var(--error)' : 'var(--primary)',
                        color: 'white',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}>
                        {items.length} / {capacity}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#60a5fa' }} />
                        <span>남 {mCount}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f472b6' }} />
                        <span>여 {fCount}</span>
                    </div>
                </div>
            </div>

            <SortableContext id={id} items={items.map(p => p.id)} strategy={verticalListSortingStrategy}>
                <div ref={setNodeRef} style={{
                    minHeight: '200px',
                    flex: 1,
                    overflowY: 'auto',
                    paddingRight: '4px',
                }}>
                    {items.map((p) => (
                        <SortableItem key={p.id} id={p.id} person={p} />
                    ))}
                    {items.length === 0 && (
                        <div style={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)',
                            fontSize: '0.9rem',
                            border: '1px dashed var(--border)',
                            borderRadius: 'var(--radius-md)',
                            minHeight: '100px'
                        }}>
                            여기로 드래그하세요
                        </div>
                    )}
                </div>
            </SortableContext>
        </Card>
    );
}

interface BoardProps {
    initialTeams: TeamConfig[];
    unassigned: Personnel[];
    onExport: () => void;
}

export const DistributionBoard: React.FC<BoardProps> = ({ initialTeams, unassigned, onExport }) => {
    const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'team'>('kanban');
    const [items, setItems] = useState<{ [key: string]: Personnel[] }>({
        'unassigned': unassigned,
        ...initialTeams.reduce((acc, t) => ({ ...acc, [t.id]: t.members || [] }), {})
    });

    const [isAgentLoading, setIsAgentLoading] = useState(false);
    const [agentRationale, setAgentRationale] = useState<string | undefined>(undefined);
    const [agentLogs, setAgentLogs] = useState<string[]>([]);

    const handleRunAgent = async (command: string) => {
        setIsAgentLoading(true);
        try {
            const currentPersonnel: Personnel[] = [];
            Object.values(items).forEach(list => currentPersonnel.push(...list));
            const currentTeams = initialTeams.map(t => ({ id: t.id, name: t.name, capacity: t.capacity }));
            const response = await fetch('/api/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ personnel: currentPersonnel, teams: currentTeams, command })
            });
            const data = await response.json();
            if (data.rationale) {
                setAgentRationale(data.rationale);
                setAgentLogs(data.logs || []);
            }
        } catch (error) {
            console.error(error);
            setAgentRationale("에러가 발생했습니다. 다시 시도해주세요.");
        } finally {
            setIsAgentLoading(false);
        }
    };

    const [activeId, setActiveId] = useState<string | null>(null);
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const findContainer = (id: string) => {
        if (id in items) return id;
        return Object.keys(items).find((key) => items[key].find(p => p.id === id));
    };

    const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        const overId = over?.id;
        if (!overId || active.id === overId) return;
        const activeContainer = findContainer(active.id as string);
        const overContainer = findContainer(overId as string);
        if (!activeContainer || !overContainer || activeContainer === overContainer) return;
        setItems((prev) => {
            const activeItems = prev[activeContainer];
            const overItems = prev[overContainer];
            const activeIndex = activeItems.findIndex(p => p.id === active.id);
            const overIndex = overItems.findIndex(p => p.id === overId);
            let newIndex = overId in prev ? overItems.length + 1 : overIndex + (over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height ? 1 : 0);
            return {
                ...prev,
                [activeContainer]: prev[activeContainer].filter((item) => item.id !== active.id),
                [overContainer]: [...prev[overContainer].slice(0, newIndex), activeItems[activeIndex], ...prev[overContainer].slice(newIndex, overItems.length)]
            };
        });
    };

    const handleDragEnd = () => setActiveId(null);

    const allAssigned = Object.entries(items).flatMap(([teamId, people]) =>
        people.map(p => ({ ...p, teamName: teamId === 'unassigned' ? '미배정' : initialTeams.find(t => t.id === teamId)?.name || '알 수 없음' }))
    );

    return (
        <div style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ background: 'var(--surface-hover)', padding: '6px', borderRadius: '12px', display: 'flex', gap: '6px', border: '1px solid var(--border)', backdropFilter: 'blur(10px)' }}>
                    <ViewButton active={viewMode === 'kanban'} onClick={() => setViewMode('kanban')} icon={<LayoutGrid size={18} />} label="카드형" />
                    <ViewButton active={viewMode === 'list'} onClick={() => setViewMode('list')} icon={<List size={18} />} label="개별 리스트" />
                    <ViewButton active={viewMode === 'team'} onClick={() => setViewMode('team')} icon={<UsersIcon size={18} />} label="팀별 리스트" />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button variant="secondary" onClick={() => window.location.reload()}>
                        <RotateCcw size={18} /> 초기화
                    </Button>
                    <Button onClick={onExport}>
                        <Download size={18} /> 확정 및 내보내기
                    </Button>
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'hidden' }}>
                {viewMode === 'kanban' && (
                    <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', height: '100%', paddingBottom: '24px' }}>
                        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                            <div style={{ minWidth: '300px', height: '100%' }}>
                                <DroppableContainer id="unassigned" title="미배정 인원" items={items['unassigned']} capacity={999} />
                            </div>
                            {initialTeams.map((team) => (
                                <div key={team.id} style={{ minWidth: '300px', height: '100%' }}>
                                    <DroppableContainer id={team.id} title={team.name} items={items[team.id]} capacity={team.capacity} />
                                </div>
                            ))}
                            <DragOverlay>
                                {activeId ? (
                                    <div style={{ padding: '14px 16px', background: 'var(--primary-gradient)', color: 'white', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-lg)', fontWeight: 600 }}>
                                        {allAssigned.find(p => p.id === activeId)?.name} 이동 중...
                                    </div>
                                ) : null}
                            </DragOverlay>
                        </DndContext>
                    </div>
                )}

                {(viewMode === 'list' || viewMode === 'team') && (
                    <div className="glass-panel" style={{ height: '100%', overflow: 'auto', padding: 0, borderRadius: 'var(--radius-lg)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--surface-hover)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border)' }}>
                                {viewMode === 'list' ? (
                                    <tr>
                                        <Th>이름</Th>
                                        <Th>성별</Th>
                                        <Th>고려 사항 (이력/태그)</Th>
                                        <Th>배정된 팀</Th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <Th style={{ width: '200px' }}>배정 단위 (팀)</Th>
                                        <Th>소속 인원 명단</Th>
                                        <Th style={{ width: '120px' }}>현재 인원</Th>
                                        <Th style={{ width: '150px' }}>성비 구성</Th>
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {viewMode === 'list' ? (
                                    allAssigned.map((p, idx) => (
                                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'transparent' : 'rgba(15, 23, 42, 0.02)' }}>
                                            <Td style={{ fontWeight: 700 }}>{p.name}</Td>
                                            <Td>
                                                <span style={{
                                                    color: p.gender === 'M' ? '#2563eb' : '#db2777',
                                                    fontWeight: 700,
                                                    background: p.gender === 'M' ? '#eff6ff' : '#fdf2f8',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.8rem'
                                                }}>{p.gender === 'M' ? '남성' : '여성'}</span>
                                            </Td>
                                            <Td>
                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                    {p.history?.map(h => <span key={h} style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'white', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-secondary)' }}>#{h}</span>)}
                                                    {p.tags?.map(t => <span key={t} style={{ fontSize: '0.75rem', padding: '2px 8px', background: '#fef3c7', color: '#92400e', borderRadius: '4px', fontWeight: 600 }}>{t}</span>)}
                                                </div>
                                            </Td>
                                            <Td>
                                                <span style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '20px',
                                                    background: p.teamName === '미배정' ? 'var(--error)' : 'var(--primary-gradient)',
                                                    color: 'white',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 600,
                                                    boxShadow: p.teamName === '미배정' ? 'none' : '0 4px 10px rgba(15, 23, 42, 0.1)'
                                                }}>
                                                    {p.teamName}
                                                </span>
                                            </Td>
                                        </tr>
                                    ))
                                ) : (
                                    ['unassigned', ...initialTeams.map(t => t.id)].map((teamId, idx) => {
                                        const teamItems = items[teamId];
                                        const teamName = teamId === 'unassigned' ? '미배정 인원' : initialTeams.find(t => t.id === teamId)?.name;
                                        const mCount = teamItems.filter(p => p.gender === 'M').length;
                                        const fCount = teamItems.length - mCount;
                                        return (
                                            <tr key={teamId} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'transparent' : 'rgba(15, 23, 42, 0.02)' }}>
                                                <Td style={{ fontWeight: 800, verticalAlign: 'top', fontSize: '1.05rem', color: teamId === 'unassigned' ? 'var(--error)' : 'var(--text-main)' }}>{teamName}</Td>
                                                <Td>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        {teamItems.map(p => (
                                                            <div key={p.id} style={{ padding: '6px 12px', background: 'white', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9rem', boxShadow: 'var(--shadow-sm)' }}>
                                                                <strong style={{ color: 'var(--text-main)' }}>{p.name}</strong>
                                                                <span style={{
                                                                    marginLeft: '6px',
                                                                    color: p.gender === 'M' ? '#2563eb' : '#db2777',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 700
                                                                }}>{p.gender}</span>
                                                            </div>
                                                        ))}
                                                        {teamItems.length === 0 && <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>인원이 비어있습니다.</span>}
                                                    </div>
                                                </Td>
                                                <Td style={{ fontWeight: 700, fontSize: '1.1rem' }}>{teamItems.length}명</Td>
                                                <Td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                                            <span style={{ color: '#2563eb', fontWeight: 600 }}>남성 {mCount}</span>
                                                            <span style={{ color: '#db2777', fontWeight: 600 }}>여성 {fCount}</span>
                                                        </div>
                                                        <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: '#e2e8f0', display: 'flex', overflow: 'hidden' }}>
                                                            <div style={{ width: `${(mCount / teamItems.length) * 100}%`, height: '100%', background: '#60a5fa' }} />
                                                            <div style={{ width: `${(fCount / teamItems.length) * 100}%`, height: '100%', background: '#f472b6' }} />
                                                        </div>
                                                    </div>
                                                </Td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <AgentChat onRunAgent={handleRunAgent} isLoading={isAgentLoading} lastRationale={agentRationale} logs={agentLogs} />
        </div>
    );
};

const Th = ({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) => (
    <th style={{ padding: '18px 24px', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', ...style }}>{children}</th>
);

const Td = ({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) => (
    <td style={{ padding: '20px 24px', color: 'var(--text-main)', ...style }}>{children}</td>
);

const ViewButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            background: active ? 'white' : 'transparent',
            color: active ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: active ? 700 : 500,
            cursor: 'pointer',
            boxShadow: active ? 'var(--shadow-md)' : 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: active ? 'scale(1.02)' : 'scale(1)'
        }}
    >
        {icon}
        <span style={{ fontSize: '0.95rem' }}>{label}</span>
    </button>
);
