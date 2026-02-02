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

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        marginBottom: '8px',
        padding: '12px',
        backgroundColor: person.gender === 'M' ? '#1e293b' : '#334155', // Simple visual distinction
        borderLeft: `4px solid ${person.gender === 'M' ? '#60a5fa' : '#f472b6'}`,
        borderRadius: '4px',
        fontSize: '0.9rem',
        cursor: 'grab',
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            <div style={{ fontWeight: 600 }}>{person.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                {person.history?.join(', ') || 'No History'}
            </div>
        </div>
    );
}

// --- Droppable Container Component ---
function DroppableContainer({ id, title, items, capacity }: { id: string, title: string, items: Personnel[], capacity: number }) {
    const { setNodeRef } = useSortable({ id });

    const mCount = items.filter(p => p.gender === 'M').length;
    const fCount = items.length - mCount;

    return (
        <Card style={{ minWidth: '280px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border)', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h4 style={{ fontWeight: 600 }}>{title}</h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        M: {mCount} / F: {fCount}
                    </div>
                </div>
                <span style={{
                    fontSize: '0.8rem',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    background: items.length > capacity ? 'var(--error)' : 'var(--surface-hover)',
                    color: items.length > capacity ? 'white' : 'var(--text-muted)'
                }}>
                    {items.length}/{capacity}
                </span>
            </div>

            <SortableContext id={id} items={items.map(p => p.id)} strategy={verticalListSortingStrategy}>
                <div ref={setNodeRef} style={{ minHeight: '200px', flex: 1 }}>
                    {items.map((p) => (
                        <SortableItem key={p.id} id={p.id} person={p} />
                    ))}
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
    // Flatten data structure for dnd-kit
    // Container IDs are Team IDs. Item IDs are Person IDs.

    // NOTE: In a real app we might need a more complex state to track "items" map
    // items: { [teamId]: string[] } 

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
            // Prepare payload
            const currentPersonnel: Personnel[] = [];
            Object.values(items).forEach(list => currentPersonnel.push(...list));

            // Current teams structure
            const currentTeams = initialTeams.map(t => ({
                id: t.id,
                name: t.name,
                capacity: t.capacity
            }));

            const response = await fetch('/api/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personnel: currentPersonnel,
                    teams: currentTeams,
                    command
                })
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

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        const overId = over?.id;

        if (!overId || active.id === overId) return;

        const activeContainer = findContainer(active.id as string);
        const overContainer = findContainer(overId as string);

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return;
        }

        // Move logic during drag (optional for smoother UX, usually handled in DragEnd)
        // dnd-kit recommends updating items during DragOver for sorting between containers

        setItems((prev) => {
            const activeItems = prev[activeContainer];
            const overItems = prev[overContainer];
            const activeIndex = activeItems.findIndex(p => p.id === active.id);
            const overIndex = overItems.findIndex(p => p.id === overId);

            let newIndex;
            if (overId in prev) {
                newIndex = overItems.length + 1;
            } else {
                const isBelowOverItem = over &&
                    active.rect.current.translated &&
                    active.rect.current.translated.top > over.rect.top + over.rect.height;

                const modifier = isBelowOverItem ? 1 : 0;
                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
            }

            return {
                ...prev,
                [activeContainer]: [
                    ...prev[activeContainer].filter((item) => item.id !== active.id)
                ],
                [overContainer]: [
                    ...prev[overContainer].slice(0, newIndex),
                    activeItems[activeIndex],
                    ...prev[overContainer].slice(newIndex, overItems.length)
                ]
            };
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const activeContainer = findContainer(active.id as string);
        const overContainer = findContainer(over?.id as string || '');

        if (
            activeContainer &&
            overContainer &&
            activeContainer !== overContainer
        ) {
            // Should already be handled by DragOver
        }

        setActiveId(null);
    };

    // Helper to re-assemble TeamConfig for valid display/export
    // (items state is the source of truth now)

    return (
        <div style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <Button variant="secondary" onClick={() => console.log('Resetting...')}>초기화</Button>
                <Button onClick={onExport}>확정 및 내보내기</Button>
            </div>

            <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', height: '100%', paddingBottom: '24px' }}>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    {/* Unassigned Column */}
                    <div style={{ minWidth: '280px', height: '100%' }}>
                        <DroppableContainer
                            id="unassigned"
                            title="미배정 인원"
                            items={items['unassigned']}
                            capacity={999}
                        />
                    </div>

                    {/* Team Columns */}
                    {initialTeams.map((team) => (
                        <div key={team.id} style={{ minWidth: '280px', height: '100%' }}>
                            <DroppableContainer
                                id={team.id}
                                title={team.name}
                                items={items[team.id]}
                                capacity={team.capacity}
                            />
                        </div>
                    ))}

                    <DragOverlay>
                        {activeId ? (
                            <div style={{ padding: '12px', background: '#334155', borderRadius: '4px', opacity: 0.8 }}>
                                Dragging Item...
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            <AgentChat
                onRunAgent={handleRunAgent}
                isLoading={isAgentLoading}
                lastRationale={agentRationale}
                logs={agentLogs}
            />
        </div>
    );
};
