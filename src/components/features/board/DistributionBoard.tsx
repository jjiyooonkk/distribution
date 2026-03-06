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
import { LayoutGrid, List, Users as UsersIcon, RotateCcw, Download, ChevronDown, FileText, FileSpreadsheet, FileJson } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>{person.name}</span>
                    {person.gender && (
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
                    )}
                </div>

                {person.attributes && Object.keys(person.attributes).length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                        gap: '4px',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        padding: '8px',
                        background: 'rgba(0,0,0,0.02)',
                        borderRadius: '4px'
                    }}>
                        {Object.entries(person.attributes).map(([key, val]) => {
                            if (key === '이름' || key === 'Name' || key === '성별' || key === 'Gender') return null;
                            return (
                                <div key={key} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{key}: </span>
                                    {String(val)}
                                </div>
                            );
                        })}
                    </div>
                )}

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
        </div>
    );
}

// --- Droppable Container Component ---
function DroppableContainer({ id, title, items = [], capacity }: { id: string, title: string, items?: Personnel[], capacity: number }) {
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
    columnHeaders?: string[];
    onExport: () => void;
}

export const DistributionBoard: React.FC<BoardProps> = ({ initialTeams, unassigned, columnHeaders = [], onExport }) => {
    const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'team'>('kanban');
    const [items, setItems] = useState<{ [key: string]: Personnel[] }>({
        'unassigned': unassigned,
        ...initialTeams.reduce((acc, t) => ({ ...acc, [t.id]: t.members || [] }), {})
    });

    // Props가 변경될 때 (Step 2 완료 등) 로컬 상태 동기화
    useEffect(() => {
        setItems({
            'unassigned': unassigned,
            ...initialTeams.reduce((acc, t) => ({ ...acc, [t.id]: t.members || [] }), {})
        });
    }, [initialTeams, unassigned]);

    const [isAgentLoading, setIsAgentLoading] = useState(false);
    const [agentRationale, setAgentRationale] = useState<string | undefined>(undefined);
    const [agentLogs, setAgentLogs] = useState<string[]>([]);

    const handleRunAgent = async (command: string) => {
        setAgentRationale(undefined);
        setIsAgentLoading(true);
        try {
            const currentPersonnel: Personnel[] = Object.entries(items).flatMap(([teamId, list]) =>
                list.map(p => ({ ...p, assignedTeamId: teamId === 'unassigned' ? undefined : teamId }))
            );
            const currentTeams = initialTeams.map(t => ({ id: t.id, name: t.name, capacity: t.capacity }));
            const response = await fetch('/api/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ personnel: currentPersonnel, teams: currentTeams, command })
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.details || data.error || "Server Error (AI 호출 할당량 초과일 수 있습니다)";
                throw new Error(errorMsg);
            }

            if (data.rationale) {
                setAgentRationale(data.rationale);
                setAgentLogs(data.logs || []);
            }

            if (data.assignments && data.assignments.length > 0) {
                setItems(prev => {
                    const newItems = { ...prev };
                    const allPeople = Object.values(prev).flat();

                    // 배정 결과가 있을 때만 기존 조 편성을 비움
                    Object.keys(newItems).forEach(key => {
                        newItems[key] = [];
                    });

                    const processedAssignments = data.assignments || [];
                    const assignedIdsInThisRun = new Set<string>();

                    processedAssignments.forEach((as: { personId: string; teamId: string }) => {
                        const person = allPeople.find(p => p.id === as.personId || p.name === as.personId);
                        if (person && newItems[as.teamId] && !assignedIdsInThisRun.has(person.id)) {
                            newItems[as.teamId].push({ ...person, assignedTeamId: as.teamId });
                            assignedIdsInThisRun.add(person.id);
                        }
                    });

                    const remaining = allPeople.filter(p => !assignedIdsInThisRun.has(p.id));
                    newItems['unassigned'] = remaining;

                    return newItems;
                });
            }
        } catch (error: any) {
            console.error(error);
            setAgentRationale(`⚠️ 안내: ${error.message || "AI 에이전트와 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."}`);
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
        return Object.keys(items).find((key) => {
            const list = items[key];
            return Array.isArray(list) && list.find(p => p.id === id);
        });
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

    const [showExportMenu, setShowExportMenu] = useState(false);

    const allAssigned = Object.entries(items).flatMap(([teamId, people = []]) =>
        (people || []).map(p => ({
            ...p,
            teamName: teamId === 'unassigned' ? '미배정' : initialTeams.find(t => t.id === teamId)?.name || '알 수 없음',
            teamSortIndex: teamId === 'unassigned' ? 9999 : initialTeams.findIndex(t => t.id === teamId)
        }))
    );

    // 모든 인원의 attributes 목록에서 유니크한 키 값들을 추출
    // 만약 상위에서 columnHeaders가 넘어오면 그 순서를 최우선으로 사용
    const attributeKeys = columnHeaders.length > 0
        ? columnHeaders
        : Array.from(new Set(allAssigned.flatMap(p => Object.keys(p.attributes || {}))));

    // '이름' 관련 필드가 attributes에 없는 경우를 대비해 가상으로 추가 (기존 데이터 호환성)
    const hasNameKey = attributeKeys.some(k => k.includes('이름') || k.toLowerCase().includes('name') || k.includes('성함') || k.includes('성명'));
    if (!hasNameKey) {
        attributeKeys.unshift('이름');
    }

    attributeKeys.sort((a, b) => {
        // 이름/Name/성함/성명 필드가 포함된 필드를 가장 앞으로
        const isNameA = a.includes('이름') || a.toLowerCase().includes('name') || a.includes('성함') || a.includes('성명');
        const isNameB = b.includes('이름') || b.toLowerCase().includes('name') || b.includes('성함') || b.includes('성명');
        if (isNameA && !isNameB) return -1;
        if (!isNameA && isNameB) return 1;

        // 학번/ID/No 필드가 포함된 필드를 그 다음으로
        const isIdA = a.includes('학번') || a.toLowerCase().includes('id') || a.includes('번호') || a.toLowerCase().includes('no');
        const isIdB = b.includes('학번') || b.toLowerCase().includes('id') || b.includes('번호') || b.toLowerCase().includes('no');
        if (isIdA && !isIdB) return -1;
        if (!isIdA && isIdB) return 1;

        return 0;
    });

    // 모든 인원의 원본 attributes 목록 (엑셀 내보내기용)
    const fullAttributeKeys = Array.from(new Set(
        allAssigned.flatMap(p => Object.keys(p.fullAttributes || {}))
    ));

    const getExportData = () => {
        return [...allAssigned].sort((a, b) => {
            if (a.teamSortIndex !== b.teamSortIndex) return a.teamSortIndex - b.teamSortIndex;
            const yearKey = attributeKeys.find(k => k.includes('학번') || k.replace(/\s/g, '').includes('학번')) || '학번';
            const yearA = parseInt(String(a.attributes?.[yearKey] || '9999').replace(/[^0-9]/g, '')) || 9999;
            const yearB = parseInt(String(b.attributes?.[yearKey] || '9999').replace(/[^0-9]/g, '')) || 9999;
            if (yearA !== yearB) return yearA - yearB;
            return a.name.localeCompare(b.name, 'ko');
        })
            .map(p => {
                const base: any = {
                    '배정된 팀': p.teamName,
                };
                fullAttributeKeys.forEach(key => {
                    base[key] = p.fullAttributes?.[key] || '-';
                });
                return base;
            });
    };

    const exportToExcel = () => {
        const data = getExportData();
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Distribution_Results");
        XLSX.writeFile(wb, `Distribution_Result_${new Date().toISOString().split('T')[0]}.xlsx`);
        setShowExportMenu(false);
    };

    const exportToCSV = () => {
        const data = getExportData();
        const ws = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Distribution_Result_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowExportMenu(false);
    };

    const exportToPDF = () => {
        const doc = new jsPDF() as any;
        const data = getExportData();
        const headers = Object.keys(data[0]);
        const body = data.map(item => headers.map(h => item[h as keyof typeof item]));

        doc.autoTable({
            head: [headers],
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241], textColor: 255 },
            styles: { font: 'helvetica', fontSize: 8 },
        });

        doc.save(`Distribution_Result_${new Date().toISOString().split('T')[0]}.pdf`);
        setShowExportMenu(false);
    };

    return (
        <div style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ background: 'var(--surface-hover)', padding: '6px', borderRadius: '12px', display: 'flex', gap: '6px', border: '1px solid var(--border)', backdropFilter: 'blur(10px)' }}>
                    <ViewButton active={viewMode === 'kanban'} onClick={() => setViewMode('kanban')} icon={<LayoutGrid size={18} />} label="카드형" />
                    <ViewButton active={viewMode === 'list'} onClick={() => setViewMode('list')} icon={<List size={18} />} label="개별 리스트" />
                    <ViewButton active={viewMode === 'team'} onClick={() => setViewMode('team')} icon={<UsersIcon size={18} />} label="팀별 리스트" />
                </div>

                <div style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                    <Button variant="secondary" onClick={() => window.location.reload()}>
                        <RotateCcw size={18} /> 초기화
                    </Button>
                    <div style={{ position: 'relative' }}>
                        <Button onClick={() => setShowExportMenu(!showExportMenu)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Download size={18} /> 확정 및 내보내기 <ChevronDown size={14} />
                        </Button>
                        {showExportMenu && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '8px',
                                background: 'white',
                                borderRadius: '12px',
                                boxShadow: 'var(--shadow-lg)',
                                border: '1px solid var(--border)',
                                zIndex: 100,
                                minWidth: '180px',
                                padding: '8px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px'
                            }}>
                                <ExportMenuItem onClick={exportToExcel} icon={<FileSpreadsheet size={16} />} label="Excel (.xlsx) 다운로드" />
                                <ExportMenuItem onClick={exportToCSV} icon={<FileText size={16} />} label="CSV (.csv) 다운로드" />
                                <ExportMenuItem onClick={exportToPDF} icon={<FileJson size={16} />} label="PDF (.pdf) 다운로드" />
                                <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                                <ExportMenuItem onClick={onExport} icon={<Download size={16} />} label="전체 배정 확정" highlight />
                            </div>
                        )}
                    </div>
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
                    <div className="glass-panel" style={{ height: '100%', overflow: 'auto', padding: 0, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem', backgroundColor: 'white' }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#f8fafc', borderBottom: '2px solid var(--border)' }}>
                                {viewMode === 'list' ? (
                                    <tr>
                                        {attributeKeys.map(key => (
                                            <Th key={key} style={ExcelHeaderStyle}>{key}</Th>
                                        ))}
                                        <Th style={ExcelHeaderStyle}>배정된 팀</Th>
                                        <Th style={ExcelHeaderStyle}>비고(이력)</Th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <Th style={ExcelHeaderStyle}>배정된 팀</Th>
                                        {attributeKeys.map(key => (
                                            <Th key={key} style={ExcelHeaderStyle}>{key}</Th>
                                        ))}
                                        <Th style={ExcelHeaderStyle}>비고(이력)</Th>
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {(() => {
                                    const sortedPeople = (viewMode === 'team'
                                        ? [...allAssigned].sort((a, b) => {
                                            if (a.teamSortIndex !== b.teamSortIndex) return a.teamSortIndex - b.teamSortIndex;
                                            return a.name.localeCompare(b.name, 'ko');
                                        })
                                        : [...allAssigned].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
                                    );

                                    let lastTeamName = "";
                                    return sortedPeople.map((p, idx) => {
                                        const showTeamHeader = viewMode === 'team' && p.teamName !== lastTeamName;
                                        if (showTeamHeader) lastTeamName = p.teamName;

                                        return (
                                            <React.Fragment key={p.id}>
                                                {showTeamHeader && (
                                                    <tr style={{ background: '#f1f5f9' }}>
                                                        <td colSpan={attributeKeys.length + 2} style={{ padding: '8px 16px', fontWeight: 800, fontSize: '0.8rem', color: 'var(--primary)', border: '1px solid #e2e8f0' }}>
                                                            🏢 {p.teamName} ({sortedPeople.filter(sp => sp.teamName === p.teamName).length}명)
                                                        </td>
                                                    </tr>
                                                )}
                                                <tr style={{
                                                    borderBottom: '1px solid #e2e8f0',
                                                    background: p.teamName === '미배정' ? '#fff1f2' : (idx % 2 === 0 ? 'white' : '#fcfcfc')
                                                }}>
                                                    {/* Team view: 배정된 팀 first */}
                                                    {viewMode === 'team' && (
                                                        <Td style={{ ...ExcelCellStyle, backgroundColor: 'rgba(99, 102, 241, 0.02)' }}>
                                                            <span style={{ fontWeight: 800, color: p.teamName === '미배정' ? 'var(--error)' : 'var(--primary)' }}>{p.teamName}</span>
                                                        </Td>
                                                    )}

                                                    {attributeKeys.map(key => {
                                                        const isNameKey = key.includes('이름') || key.toLowerCase().includes('name') || key.includes('성함') || key.includes('성명');
                                                        let value = p.attributes && p.attributes[key] !== undefined ? String(p.attributes[key]) : '-';
                                                        if (isNameKey && (value === '-' || !value)) value = p.name;

                                                        return (
                                                            <Td key={key} style={{ ...ExcelCellStyle, fontWeight: isNameKey ? 700 : 400 }}>
                                                                {value}
                                                            </Td>
                                                        );
                                                    })}

                                                    {/* Individual view: 배정된 팀 last */}
                                                    {viewMode === 'list' && (
                                                        <Td style={ExcelCellStyle}>
                                                            <span style={{ fontWeight: 800, color: p.teamName === '미배정' ? 'var(--error)' : 'var(--primary)' }}>{p.teamName}</span>
                                                        </Td>
                                                    )}

                                                    <Td style={ExcelCellStyle}>
                                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                            {p.history?.map(h => <span key={h} style={{ fontSize: '0.7rem', color: '#64748b' }}>#{h}</span>)}
                                                        </div>
                                                    </Td>
                                                </tr>
                                            </React.Fragment>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <AgentChat onRunAgent={handleRunAgent} isLoading={isAgentLoading} lastRationale={agentRationale} logs={agentLogs} />
        </div>
    );
};

const ExcelHeaderStyle: React.CSSProperties = {
    padding: '12px 16px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    fontSize: '0.75rem',
    textTransform: 'none',
    letterSpacing: 'normal'
};

const ExcelCellStyle: React.CSSProperties = {
    padding: '10px 16px',
    border: '1px solid #e2e8f0',
    color: '#1e293b'
};

const Th = ({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) => (
    <th style={{ ...style }}>{children}</th>
);

const Td = ({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) => (
    <td style={{ ...style }}>{children}</td>
);

const ExportMenuItem = ({ onClick, icon, label, highlight }: { onClick: () => void, icon: React.ReactNode, label: string, highlight?: boolean }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            width: '100%',
            textAlign: 'left',
            background: highlight ? 'var(--primary-gradient)' : 'transparent',
            color: highlight ? 'white' : 'var(--text-main)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 500,
            transition: 'all 0.2s'
        }}
        className="hover-item"
    >
        {icon}
        {label}
    </button>
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
