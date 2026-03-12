"use client";

import React, { useState, useEffect } from 'react';
import { TeamConfiguration } from '@/components/features/input/TeamConfiguration';
import { DataImport } from '@/components/features/input/DataImport';
import { Card } from '@/components/ui/Card';
import { TeamConfig, Personnel } from '@/types';
import Link from 'next/link';
import { ArrowLeft, Plus, ArrowRight, GripVertical, X, Share2, Printer, CheckCircle2 } from 'lucide-react';
import { distributePersonnel } from '@/lib/distributor';
import { DistributionBoard } from '@/components/features/board/DistributionBoard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AgentChat } from '@/components/features/board/AgentChat';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function NewProjectPage() {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [teams, setTeams] = useState<TeamConfig[]>([]);
    const [unassigned, setUnassigned] = useState<Personnel[]>([]);
    const [logs, setLogs] = useState<string[]>([]);

    // UI states
    const [projectName, setProjectName] = useState('');
    const [importedData, setImportedData] = useState<Personnel[]>([]);
    const [columnHeaders, setColumnHeaders] = useState<string[]>([]);

    // AI states
    const [isAgentLoading, setIsAgentLoading] = useState(false);
    const [agentRationale, setAgentRationale] = useState<string | undefined>(undefined);
    const [agentLogs, setAgentLogs] = useState<string[]>([]);
    const [constraints, setConstraints] = useState<{ id: string, text: string, priority: number }[]>([]);

    // --- Persistence Logic ---
    const STORAGE_KEY = 'jinjjajal_new_project_state_v2';

    useEffect(() => {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                if (parsed.step) setStep(parsed.step);
                if (parsed.teams) setTeams(parsed.teams);
                if (parsed.unassigned) setUnassigned(parsed.unassigned);
                if (parsed.logs) setLogs(parsed.logs);
                if (parsed.projectName) setProjectName(parsed.projectName);
                if (parsed.importedData) setImportedData(parsed.importedData);
                if (parsed.columnHeaders) setColumnHeaders(parsed.columnHeaders);
                if (parsed.constraints) setConstraints(parsed.constraints);
            } catch (e) {
                console.error("Failed to restore session:", e);
            }
        }
    }, []);

    useEffect(() => {
        const stateToSave = {
            step,
            teams,
            unassigned,
            logs,
            projectName,
            importedData,
            columnHeaders,
            constraints
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, [step, teams, unassigned, logs, projectName, importedData, columnHeaders, constraints]);

    const handleReset = () => {
        if (confirm("모든 데이터가 초기화됩니다. 계속하시겠습니까?")) {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem('jinjjajal_agent_chat_history');
            window.location.reload();
        }
    };

    const handleRunAgent = async (command: string) => {
        setAgentRationale(undefined);
        setIsAgentLoading(true);

        try {
            if (!constraints.find(c => c.text === command)) {
                setConstraints(prev => [...prev, { id: Date.now().toString(), text: command, priority: prev.length + 1 }]);
            }

            const currentTeams = teams.map(t => ({ id: t.id, name: t.name, capacity: t.capacity }));
            const prioritizedCommands = constraints
                .sort((a, b) => a.priority - b.priority)
                .map(c => c.text)
                .join('. ');

            const fullCommand = prioritizedCommands ? `${prioritizedCommands}. 그리고 새 요청: ${command}` : command;

            // Prepare current state (all people including already assigned)
            const allPeople = [...unassigned];
            teams.forEach(t => t.members?.forEach(m => { if (m) allPeople.push(m); }));

            const response = await fetch('/api/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personnel: allPeople,
                    teams: currentTeams,
                    command: fullCommand
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.details || data.error || "AI 호출 오류");

            if (data.rationale) {
                setAgentRationale(data.rationale);
                setAgentLogs(data.logs || []);
            }

            if (data.assignments && data.assignments.length > 0) {
                // Apply AI results
                const newTeams: TeamConfig[] = teams.map(t => ({ ...t, members: [] as Personnel[] }));
                const assignedIds = new Set<string>();

                data.assignments.forEach((as: any) => {
                    const person = allPeople.find(p => p.id === as.personId || p.name === as.personId);
                    const targetTeam = newTeams.find(t => t.id === as.teamId);
                    if (person && targetTeam && !assignedIds.has(person.id)) {
                        targetTeam.members = targetTeam.members || ([] as Personnel[]);
                        targetTeam.members.push({ ...person, assignedTeamId: targetTeam.id });
                        assignedIds.add(person.id);
                    }
                });

                setTeams(newTeams);
                setUnassigned(allPeople.filter(p => !assignedIds.has(p.id)));
                setAgentRationale(prev => (prev || "") + "\n\n✅ AI가 요청에 따라 인원을 재배치했습니다. 마음에 들지 않는 부분은 직접 수정할 수 있습니다.");
            }

        } catch (error: any) {
            console.error(error);
            setAgentRationale(`⚠️ 안내: ${error.message}`);
        } finally {
            setIsAgentLoading(false);
        }
    };

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const handleDragEndConstraints = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setConstraints((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                const newArr = arrayMove(items, oldIndex, newIndex);
                return newArr.map((item, idx) => ({ ...item, priority: idx + 1 }));
            });
        }
    };

    const handleTeamConfigComplete = (config: TeamConfig[]) => {
        setTeams(config.map(t => ({ ...t, members: [] })));
        setStep(2);
    };

    const handleDataImportComplete = (imported: Personnel[], headers: string[]) => {
        setColumnHeaders(headers);
        setImportedData(imported);
        setUnassigned(imported);
        setStep(3);
    };

    const handleUpdateTeams = (updatedTeams: TeamConfig[], updatedUnassigned: Personnel[]) => {
        setTeams(updatedTeams);
        setUnassigned(updatedUnassigned);
    };

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <header style={{ padding: '48px 0', borderBottom: '1px solid var(--border)', marginBottom: '48px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }} className="hover-link">
                    <ArrowLeft size={16} /> 대시보드로 돌아가기
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {projectName || "새 프로젝트 만들기"}
                    </h1>
                    <Button variant="ghost" onClick={handleReset} style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>초기화하고 처음부터 시작</Button>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>직관적인 인원 분배와 AI 최적화 도구</p>
            </header>

            <div style={{ display: (step >= 3) ? 'block' : 'grid', gridTemplateColumns: (!projectName || step >= 3) ? '1fr' : '320px 1fr', gap: '48px' }}>
                {step < 3 && projectName && (
                    <aside>
                        <Card style={{ position: 'sticky', top: '24px', padding: '32px' }}>
                            <div style={{ marginBottom: '24px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>진행 상태</div>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <StepItem number={1} title="단위(조) 설정" active={step === 1} completed={step > 1} />
                                <StepItem number={2} title="명단 업로드" active={step === 2} completed={step > 2} />
                                <StepItem number={3} title="배정 및 AI 주문" active={step === 3} completed={step > 3} />
                                <StepItem number={4} title="최종 결과 확인" active={step === 4} completed={false} />
                            </ul>
                        </Card>
                    </aside>
                )}

                <main className="animate-fade-in" style={{ gridColumn: (step >= 3 || !projectName) ? 'span 2' : 'auto' }}>
                    {!projectName && (
                        <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
                            <div className="glass-panel" style={{ padding: '64px', borderRadius: '32px' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'var(--primary-gradient)', margin: '0 auto 32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={40} color="white" /></div>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '16px' }}>프로젝트 이름 입력</h2>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>워크스페이스를 식별할 이름을 정해주세요.</p>
                                <Input autoFocus id="initial-project-name" placeholder="예: 2024 하계 엠티 조 편성" style={{ fontSize: '1.2rem', textAlign: 'center', padding: '16px', borderRadius: '12px' }} onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = (document.getElementById('initial-project-name') as HTMLInputElement).value;
                                        if (val.trim()) setProjectName(val);
                                    }
                                }} />
                                <Button variant="primary" style={{ width: '100%', marginTop: '24px', padding: '16px', borderRadius: '12px', fontWeight: 700 }} onClick={() => {
                                    const val = (document.getElementById('initial-project-name') as HTMLInputElement).value;
                                    if (val.trim()) setProjectName(val);
                                }}>생성하고 시작하기</Button>
                            </div>
                        </div>
                    )}

                    {projectName && (
                        <>
                            {step === 1 && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div style={{ marginBottom: '32px' }}>
                                        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>Step 1. 배정 단위 설정</h2>
                                        <p style={{ color: 'var(--text-secondary)' }}>인원을 배정할 조나 팀을 생성하세요.</p>
                                    </div>
                                    <TeamConfiguration initialTeams={teams} onComplete={handleTeamConfigComplete} />
                                </div>
                            )}

                            {step === 2 && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div style={{ marginBottom: '32px' }}>
                                        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>Step 2. 인원 명단 업로드</h2>
                                        <p style={{ color: 'var(--text-secondary)' }}>엑셀 파일을 업로드하고 배정에 사용할 컬럼을 매핑하세요.</p>
                                    </div>
                                    <DataImport onComplete={handleDataImportComplete} onBack={() => setStep(1)} />
                                </div>
                            )}

                            {step === 3 && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <Button variant="ghost" onClick={() => setStep(2)} style={{ padding: '0', height: 'auto', marginBottom: '8px' }}><ArrowLeft size={14} /> 이전 단계</Button>
                                            <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Step 3. 인원 배정 및 AI 최적화</h2>
                                            <p style={{ color: 'var(--text-secondary)' }}>각 조의 슬롯에 인원을 직접 배정하거나 AI에게 복잡한 규칙을 주문하세요.</p>
                                        </div>
                                        <Button onClick={() => setStep(4)} variant="primary" style={{ padding: '0 32px' }}>
                                            최종 확정 및 결과 확인 <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                                        </Button>
                                    </header>

                                    <DistributionBoard
                                        initialTeams={teams}
                                        unassigned={unassigned}
                                        columnHeaders={columnHeaders}
                                        onExport={() => setStep(4)}
                                        onUpdateTeams={handleUpdateTeams}
                                    />

                                    <div style={{ marginTop: '48px', borderTop: '1px solid var(--border)', paddingTop: '48px' }}>
                                        <div style={{ marginBottom: '24px' }}>
                                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>🤖 AI 에이전트 주문</h3>
                                            <p style={{ color: 'var(--text-secondary)' }}>"나머지 인원을 성별 비율에 맞춰 배정해줘", "같은 학번끼리는 같은 조가 되지 않게 해줘" 등 자유롭게 요청하세요.</p>
                                        </div>
                                        <AgentChat onRunAgent={handleRunAgent} isLoading={isAgentLoading} lastRationale={agentRationale} logs={agentLogs} />

                                        {constraints.length > 0 && (
                                            <div style={{ marginTop: '24px' }}>
                                                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px' }}>적용 중인 주문 우선순위 (드래그하여 변경)</h4>
                                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndConstraints}>
                                                    <SortableContext items={constraints.sort((a, b) => a.priority - b.priority).map(c => c.id)} strategy={verticalListSortingStrategy}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            {constraints.sort((a, b) => a.priority - b.priority).map((c, i) => (
                                                                <SortableConstraintItem key={c.id} c={c} index={i} onDelete={(id) => setConstraints(prev => prev.filter(curr => curr.id !== id))} />
                                                            ))}
                                                        </div>
                                                    </SortableContext>
                                                </DndContext>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="animate-in fade-in zoom-in duration-500">
                                    <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <Button variant="ghost" onClick={() => setStep(3)} style={{ padding: '0', height: 'auto', marginBottom: '8px' }}><ArrowLeft size={14} /> 수정하러 돌아가기</Button>
                                            <h2 style={{ fontSize: '2.25rem', fontWeight: 800 }}>Step 4. 배정 결과 최종 확인</h2>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <Button variant="outline" onClick={() => window.print()}><Printer size={16} /> PDF 출력</Button>
                                            <Button variant="primary" onClick={() => alert('텔레그램 알림 발송 기능이 준비 중입니다.')}><Share2 size={16} /> 결과 공유 (텔레그램)</Button>
                                        </div>
                                    </header>

                                    <FinalPresentation teams={teams} unassigned={unassigned} />

                                    <Card style={{ marginTop: '48px', padding: '32px', textAlign: 'center', background: 'rgba(34, 197, 94, 0.05)', borderColor: 'rgba(34, 197, 94, 0.2)' }}>
                                        <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto 16px' }} />
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a' }}>모든 배정이 완료되었습니다!</h3>
                                        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>데이터가 보관함에 안전하게 저장되었습니다. 언제든 다시 확인하실 수 있습니다.</p>
                                        <div style={{ marginTop: '24px' }}>
                                            <Link href="/"><Button variant="outline">대시보드로 가기</Button></Link>
                                        </div>
                                    </Card>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

const FinalPresentation = ({ teams, unassigned }: { teams: TeamConfig[], unassigned: Personnel[] }) => {
    const [view, setView] = useState<'team' | 'list'>('team');

    return (
        <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--surface)', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
                <button onClick={() => setView('team')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: view === 'team' ? 'white' : 'transparent', fontWeight: 700, cursor: 'pointer', boxShadow: view === 'team' ? 'var(--shadow-sm)' : 'none' }}>조별 보기</button>
                <button onClick={() => setView('list')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: view === 'list' ? 'white' : 'transparent', fontWeight: 700, cursor: 'pointer', boxShadow: view === 'list' ? 'var(--shadow-sm)' : 'none' }}>개인별 명단</button>
            </div>

            {view === 'team' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                    {teams.map(team => (
                        <Card key={team.id} style={{ padding: '24px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, paddingBottom: '12px', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>{team.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>({team.members?.length || 0}명)</span></h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {team.members?.filter((m): m is Personnel => m !== null).map((m, idx) => (
                                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', fontSize: '0.9rem' }}>
                                        <span style={{ fontWeight: 600 }}>{idx + 1}. {m.name}</span>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{m.tags?.[0]}</span>
                                    </div>
                                ))}
                                {(!team.members || team.members.length === 0) && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>배정된 인원 없음</p>}
                            </div>
                        </Card>
                    ))}
                    {unassigned.length > 0 && (
                        <Card style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#b91c1c', marginBottom: '16px' }}>미배정 인원 ({unassigned.length}명)</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {unassigned.map(p => (
                                    <div key={p.id} style={{ padding: '8px', background: 'white', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid rgba(239,68,68,0.1)' }}>{p.name}</div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            ) : (
                <Card style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                            <tr>
                                <th style={{ padding: '16px' }}>이름</th>
                                <th style={{ padding: '16px' }}>성별</th>
                                <th style={{ padding: '16px' }}>정보</th>
                                <th style={{ padding: '16px' }}>배정된 조</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                ...teams.flatMap(t => (t.members || []).filter((m): m is Personnel => m !== null).map(m => ({ ...m, teamName: t.name }))),
                                ...unassigned.map(p => ({ ...p, teamName: '미배정' }))
                            ]
                                .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'))
                                .map((p, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{p.name}</td>
                                        <td style={{ padding: '12px 16px' }}>{p.gender === 'M' ? '남' : '여'}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{p.tags?.join(', ')}</td>
                                        <td style={{ padding: '12px 16px', fontWeight: 700, color: p.teamName === '미배정' ? '#ef4444' : 'var(--primary)' }}>{p.teamName}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    );
};

const SortableConstraintItem = ({ c, index, onDelete }: { c: any, index: number, onDelete: (id: string) => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 1,
        background: isDragging ? 'var(--surface-elevated)' : 'var(--surface-hover)',
        opacity: isDragging ? 0.6 : 1,
        border: '1px solid var(--border)',
        padding: '12px',
        borderRadius: '10px',
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: isDragging ? 'var(--shadow-lg)' : 'none',
    };

    return (
        <div ref={setNodeRef} style={style}>
            <div {...attributes} {...listeners} style={{ cursor: 'grab', display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <GripVertical size={14} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{index + 1}.</span>
                <span style={{ color: 'var(--text-main)' }}>{c.text}</span>
            </div>
            <button onClick={() => onDelete(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '4px' }}><X size={16} /></button>
        </div>
    );
};

const StepItem = ({ number, title, active, completed }: { number: number, title: string, active: boolean, completed: boolean }) => (
    <li style={{ display: 'flex', alignItems: 'center', gap: '16px', opacity: active || completed ? 1 : 0.4 }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: active ? 'var(--primary-gradient)' : (completed ? 'var(--success)' : 'white'), border: active || completed ? 'none' : '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: active || completed ? 'white' : 'var(--text-muted)', fontSize: '0.9rem' }}>
            {completed ? '✓' : number}
        </div>
        <span style={{ fontWeight: active ? 800 : 500, color: active ? 'var(--text-main)' : 'var(--text-secondary)', fontSize: '0.95rem' }}>{title}</span>
    </li>
);
