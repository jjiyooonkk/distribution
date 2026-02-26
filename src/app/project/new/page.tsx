"use client";

import React, { useState, useEffect } from 'react';
import { TeamConfiguration } from '@/components/features/input/TeamConfiguration';
import { DataImport } from '@/components/features/input/DataImport';
import { Card } from '@/components/ui/Card';
import { TeamConfig, Personnel } from '@/types';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { distributePersonnel } from '@/lib/distributor';
import { DistributionBoard } from '@/components/features/board/DistributionBoard';
import { FinalPreviewModal } from '@/components/features/output/FinalPreviewModal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AgentChat } from '@/components/features/board/AgentChat';

export default function NewProjectPage() {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [teams, setTeams] = useState<TeamConfig[]>([]);
    const [unassigned, setUnassigned] = useState<Personnel[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // New States
    const [projectName, setProjectName] = useState('');
    const [importedData, setImportedData] = useState<Personnel[]>([]); // Real-time data
    const [isAgentLoading, setIsAgentLoading] = useState(false);
    const [agentRationale, setAgentRationale] = useState<string | undefined>(undefined);
    const [agentLogs, setAgentLogs] = useState<string[]>([]);
    const [agentAssignments, setAgentAssignments] = useState<any[]>([]); // Store agent results

    // --- Persistence Logic ---
    const STORAGE_KEY = 'jinjjajal_new_project_state';

    // Load state on mount
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
                if (parsed.agentRationale) setAgentRationale(parsed.agentRationale);
                if (parsed.agentLogs) setAgentLogs(parsed.agentLogs);
                if (parsed.agentAssignments) setAgentAssignments(parsed.agentAssignments);
            } catch (e) {
                console.error("Failed to restore session:", e);
            }
        }
    }, []);

    // Save state on changes
    useEffect(() => {
        const stateToSave = {
            step,
            teams,
            unassigned,
            logs,
            projectName,
            importedData,
            agentRationale,
            agentLogs,
            agentAssignments
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, [step, teams, unassigned, logs, projectName, importedData, agentRationale, agentLogs, agentAssignments]);

    const handleReset = () => {
        if (confirm("모든 데이터가 초기화됩니다. 계속하시겠습니까?")) {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem('jinjjajal_agent_chat_history');
            localStorage.removeItem('jinjjajal_constraints');
            window.location.reload();
        }
    };

    const [constraints, setConstraints] = useState<{ id: string, text: string, priority: number }[]>([]);

    // Load constraints from storage
    useEffect(() => {
        const saved = localStorage.getItem('jinjjajal_constraints');
        if (saved) setConstraints(JSON.parse(saved));
    }, []);

    // Save constraints
    useEffect(() => {
        localStorage.setItem('jinjjajal_constraints', JSON.stringify(constraints));
    }, [constraints]);

    const handleRunAgent = async (command: string) => {
        setIsAgentLoading(true);
        try {
            if (!constraints.find(c => c.text === command)) {
                setConstraints(prev => [...prev, { id: Date.now().toString(), text: command, priority: prev.length + 1 }]);
            }

            const currentTeams = teams.map(t => ({
                id: t.id,
                name: t.name,
                capacity: t.capacity
            }));

            const personnelToSend = importedData.length > 0 ? importedData : [];
            const prioritizedCommands = constraints
                .sort((a, b) => a.priority - b.priority)
                .map(c => c.text)
                .join('. ');

            const fullCommand = prioritizedCommands ? `${prioritizedCommands}. 그리고 새 요청: ${command}` : command;

            const response = await fetch('/api/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personnel: personnelToSend,
                    teams: currentTeams,
                    command: fullCommand
                })
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.details || data.error || "Server Error";
                if (response.status === 429) {
                    throw new Error("Billing Quota Exceeded. Please check API Key.");
                }
                throw new Error(errorMsg);
            }

            if (data.rationale) {
                setAgentRationale(data.rationale);
                setAgentLogs(data.logs || []);
            }

            if (data.assignments && data.assignments.length > 0) {
                setAgentAssignments(data.assignments);
                setAgentRationale(prev => (prev || "") + "\n\n✅ 배정 결과가 저장되었습니다. '다음' 버튼을 누르면 인원 분배 결과에 반영됩니다.");
            }

        } catch (error: any) {
            console.error("Agent Request Error:", error);
            setAgentRationale(`⚠️ 에러가 발생했습니다:\n${error.message || "알 수 없는 오류"}`);
        } finally {
            setIsAgentLoading(false);
        }
    };

    const handleFinalConfirm = () => {
        setIsModalOpen(false);
        alert("Distribution Approved! Notifications sent (Simulated). Redirecting to Dashboard...");
    };

    const handleTeamConfigComplete = (config: TeamConfig[]) => {
        setTeams(config);
        setStep(2);
    };

    const handleDataImportComplete = (importedData: Personnel[]) => {
        let initialTeams = [...teams];
        let remainingPersonnel = [...importedData];

        if (agentAssignments.length > 0) {
            const teamMap = new Map<string, Personnel[]>();
            initialTeams.forEach(t => teamMap.set(t.id, []));
            const assignedIds = new Set<string>();

            agentAssignments.forEach(assign => {
                const person = importedData.find(p => p.id === assign.personId);
                const teamExists = teamMap.has(assign.teamId);
                if (person && teamExists) {
                    teamMap.get(assign.teamId)?.push({
                        ...person,
                        assignedTeamId: assign.teamId
                    });
                    assignedIds.add(person.id);
                }
            });

            initialTeams = initialTeams.map(t => ({
                ...t,
                members: teamMap.get(t.id) || []
            }));
            remainingPersonnel = importedData.filter(p => !assignedIds.has(p.id));
        }

        if (remainingPersonnel.length > 0) {
            const distribution = distributePersonnel(remainingPersonnel, initialTeams);
            initialTeams = distribution.teams;
            setUnassigned(distribution.unassigned);
            setLogs([...(agentLogs.length > 0 ? ["[AI] 에이전트 배정 적용 완료"] : []), ...distribution.logs]);
        } else {
            setUnassigned([]);
            setLogs(agentLogs);
        }

        setTeams(initialTeams);
        setStep(3);
    };

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <header style={{
                padding: '48px 0',
                borderBottom: '1px solid var(--border)',
                marginBottom: '48px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                <Link href="/" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--text-secondary)',
                    marginBottom: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 500
                }} className="hover-link">
                    <ArrowLeft size={16} /> 대시보드로 돌아가기
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {projectName || "새 인원 분배 프로젝트"}
                    </h1>
                    <Button variant="ghost" onClick={handleReset} style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        초기화하고 처음부터 시작
                    </Button>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>효율적이고 공정한 인원 분배를 위한 스마트 워크스페이스</p>
            </header>

            <div style={{ display: step === 3 ? 'block' : 'grid', gridTemplateColumns: (!projectName || step === 3) ? '1fr' : '320px 1fr', gap: '48px' }}>
                {step !== 3 && projectName && (
                    <aside>
                        <Card style={{ position: 'sticky', top: '24px', padding: '32px' }}>
                            <div style={{ marginBottom: '24px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Project Progress
                            </div>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <StepItem number={1} title="단위(팀) 설정" active={step === 1} completed={step > 1} />
                                <StepItem number={2} title="인원 명단 업로드" active={step === 2} completed={step > 2} />
                                <StepItem number={3} title="결과 검토 및 확정" active={false} completed={false} />
                            </ul>

                            <div style={{ marginTop: '32px', padding: '12px', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.2)', display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontSize: '0.8rem', fontWeight: 600 }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
                                보관함에 자동 저장됨
                            </div>

                            {constraints.length > 0 && (
                                <div style={{ marginTop: '32px' }}>
                                    <div style={{ marginBottom: '16px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        우선순위 설정 (내림차순)
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {constraints.sort((a, b) => a.priority - b.priority).map((c, i) => (
                                            <div key={c.id} style={{
                                                background: 'var(--surface-hover)',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                fontSize: '0.85rem',
                                                border: '1px solid var(--border)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: '8px'
                                            }}>
                                                <span style={{ fontWeight: 600, color: 'var(--primary)', minWidth: '20px' }}>{i + 1}.</span>
                                                <span style={{ flex: 1, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.text}</span>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button onClick={() => {
                                                        if (i === 0) return;
                                                        const newConstraints = [...constraints];
                                                        const temp = newConstraints[i].priority;
                                                        newConstraints[i].priority = newConstraints[i - 1].priority;
                                                        newConstraints[i - 1].priority = temp;
                                                        setConstraints(newConstraints);
                                                    }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>↑</button>
                                                    <button onClick={() => setConstraints(constraints.filter(curr => curr.id !== c.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }}>×</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    </aside>
                )}

                <main className="animate-fade-in" style={{ gridColumn: (step === 3 || !projectName) ? 'span 2' : 'auto' }}>
                    {!projectName && (
                        <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center' }}>
                            <div className="glass-panel" style={{ padding: '64px', borderRadius: '32px' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'var(--primary-gradient)', margin: '0 auto 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.4)' }}>
                                    <Plus size={40} color="white" />
                                </div>
                                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '16px' }}>새 프로젝트 만들기</h1>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '1.1rem' }}>먼저 프로젝트의 이름을 입력해 주세요.<br />입력 즉시 보관함에 안전하게 저장됩니다.</p>
                                <div style={{ marginBottom: '24px' }}>
                                    <Input autoFocus id="initial-project-name" placeholder="예: 2024년 신입생 오리엔테이션 조 편성" style={{ fontSize: '1.25rem', padding: '20px 24px', borderRadius: '16px', textAlign: 'center' }} onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = (document.getElementById('initial-project-name') as HTMLInputElement).value;
                                            if (val.trim()) setProjectName(val);
                                        }
                                    }} />
                                </div>
                                <Button variant="primary" style={{ width: '100%', padding: '20px', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 700 }} onClick={() => {
                                    const val = (document.getElementById('initial-project-name') as HTMLInputElement).value;
                                    if (val.trim()) setProjectName(val);
                                }}>프로젝트 생성하고 계속하기</Button>
                            </div>
                        </div>
                    )}

                    {projectName && (
                        <>
                            <div style={{ display: step === 1 ? 'block' : 'none' }}>
                                <div>
                                    <div style={{ marginBottom: '40px' }}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Project Title</label>
                                        <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} style={{ fontSize: '1.75rem', fontWeight: 800, padding: '0', background: 'none', border: 'none', borderBottom: '1px solid transparent' }} />
                                    </div>
                                    <div style={{ marginBottom: '32px' }}>
                                        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '12px' }}>Step 1. 배정 단위(팀) 정의</h2>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6' }}>인원을 분배할 그룹, 팀 또는 장소를 설정하세요.</p>
                                    </div>
                                    <TeamConfiguration initialTeams={teams} onComplete={handleTeamConfigComplete} />
                                </div>
                            </div>

                            <div style={{ display: step === 2 ? 'block' : 'none' }}>
                                <div>
                                    <div style={{ marginBottom: '32px' }}>
                                        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '12px' }}>Step 2. 데이터 가져오기</h2>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6' }}>인원 명단(Excel/CSV)을 업로드하세요.</p>
                                    </div>
                                    <DataImport onComplete={handleDataImportComplete} onDataUpdate={setImportedData} onBack={() => setStep(1)} />
                                    <AgentChat onRunAgent={handleRunAgent} isLoading={isAgentLoading} lastRationale={agentRationale} logs={agentLogs} />
                                </div>
                            </div>

                            <div style={{ display: step === 3 ? 'block' : 'none' }}>
                                <div className="animate-in fade-in zoom-in duration-500">
                                    <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                                        <div>
                                            <Button variant="ghost" onClick={() => setStep(2)} style={{ padding: '0', height: 'auto', marginBottom: '8px' }}><ArrowLeft size={14} /> 이전 단계로</Button>
                                            <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Step 3. 최종 분배 현황판</h2>
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>제약 로그: <strong>{logs.length}건</strong></div>
                                    </header>
                                    <DistributionBoard initialTeams={teams} unassigned={unassigned} onExport={() => setIsModalOpen(true)} />
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
            <FinalPreviewModal isOpen={isModalOpen} teams={teams} onClose={() => setIsModalOpen(false)} onConfirm={handleFinalConfirm} />
        </div>
    );
}

const StepItem = ({ number, title, active, completed }: { number: number, title: string, active: boolean, completed: boolean }) => {
    return (
        <li style={{ display: 'flex', alignItems: 'center', gap: '16px', opacity: active || completed ? 1 : 0.4 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: active ? 'var(--primary-gradient)' : (completed ? 'var(--success)' : 'white'), border: active || completed ? 'none' : '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: active || completed ? 'white' : 'var(--text-muted)' }}>
                {completed ? '✓' : number}
            </div>
            <span style={{ fontWeight: active ? 700 : 500, color: active ? 'var(--text-main)' : 'var(--text-secondary)' }}>{title}</span>
        </li>
    );
}
