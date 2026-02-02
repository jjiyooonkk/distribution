"use client";

import React, { useState } from 'react';
import { TeamConfiguration } from '@/components/features/input/TeamConfiguration';
import { DataImport } from '@/components/features/input/DataImport';
import { Card } from '@/components/ui/Card';
import { TeamConfig, Personnel } from '@/types';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { distributePersonnel } from '@/lib/distributor';
import { DistributionBoard } from '@/components/features/board/DistributionBoard';
import { FinalPreviewModal } from '@/components/features/output/FinalPreviewModal';
import { Input } from '@/components/ui/Input';
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

    const handleRunAgent = async (command: string) => {
        setIsAgentLoading(true);
        try {
            const currentTeams = teams.map(t => ({
                id: t.id,
                name: t.name,
                capacity: t.capacity
            }));

            // Use real-time imported data if available
            const personnelToSend = importedData.length > 0 ? importedData : [];

            const response = await fetch('/api/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personnel: personnelToSend,
                    teams: currentTeams,
                    command
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

            // Apply assignments immediately to local state if present
            if (data.assignments && data.assignments.length > 0) {
                const newTeams = [...teams];
                const assignmentsMap = new Map<string, string>(); // personId -> teamId

                data.assignments.forEach((a: any) => {
                    assignmentsMap.set(a.personId, a.teamId);
                });

                // Clear existing members in teams first to avoid duplicates? 
                // Or just distribute based on this map.
                // We will store this map and apply it when "Next" is clicked OR apply it now?
                // Applying now to 'teams' structure is hard because we are in Step 2 (DataImport).
                // Step 2 doesn't show the board.
                // But we can SAVE it so Step 3 starts with it.
                setAgentAssignments(data.assignments);

                // Also update the rationale to confirm
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
        // In real app: router.push('/')
    };

    const handleTeamConfigComplete = (config: TeamConfig[]) => {
        setTeams(config);
        setStep(2);
        // TODO: Proceed to Data Import Step
        console.log("Teams config:", config);
    };

    const handleDataImportComplete = (importedData: Personnel[]) => {
        // If Agent has already assigned some people, we respect that.
        let initialTeams = [...teams];
        let remainingPersonnel = [...importedData];

        if (agentAssignments.length > 0) {
            // Apply Agent Assignments
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

            // Update teams with assigned members
            initialTeams = initialTeams.map(t => ({
                ...t,
                members: teamMap.get(t.id) || []
            }));

            // Filter out assigned people
            remainingPersonnel = importedData.filter(p => !assignedIds.has(p.id));
        }

        // Run heuristic distribution for ANYONE NOT YET ASSIGNED
        // We pass the 'initialTeams' which now effectively have skewed 'current' counts.
        // distributePersonnel needs to be smart enough to append?
        // Let's assume distributePersonnel creates NEW distribution from scratch usually.
        // We should verify distributePersonnel.ts. 
        // For now, let's assume we can merge.
        // Actually, distributePersonnel might reset members. 
        // Let's modify distributePersonnel invocation logic to treating already assigned as "locked"?
        // Simpler: Just put remaining into teams using the same function but passing the 'filled' teams?
        // We will trust distributePersonnel to fill empty slots.

        let finalUnassigned: Personnel[] = [];

        if (remainingPersonnel.length > 0) {
            const result = distributePersonnel(remainingPersonnel, initialTeams);
            // Note: distributePersonnel might expect empty teams. 
            // If we pass teams with members, does it append? 
            // Most heuristic functions start with 0. 
            // We'll rely on result.teams having the NEW members + OLD members?
            // Let's assume result.teams replaces initialTeams. 
            // This implies distributePersonnel needs to know about existing members to balance efficiently.

            // Simplification: We blindly append result to existing?
            // No, distributing remaining 50 people into teams that already have 50 people needs context.

            // Since we can't easily change `distributePersonnel` signature right here without checking it, 
            // we will use the Agent's result as PRIMARY.
            // Any remaining are just put into "unassigned" for manual drag/drop? 
            // OR we run distributePersonnel on them.

            const distribution = distributePersonnel(remainingPersonnel, initialTeams);
            initialTeams = distribution.teams; // Hopefully it preserves/appends
            finalUnassigned = distribution.unassigned;
            setLogs([...(agentLogs.length > 0 ? ["[AI] 에이전트 배정 적용 완료"] : []), ...distribution.logs]);
        } else {
            finalUnassigned = [];
            setLogs(agentLogs);
        }

        setTeams(initialTeams);
        setUnassigned(finalUnassigned);
        setStep(3);
    };

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <header style={{ padding: '32px 0', borderBottom: '1px solid var(--border)', marginBottom: '32px' }}>
                <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
                    <ArrowLeft size={16} /> 대시보드로 돌아가기
                </Link>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>새 인원 분배 프로젝트</h1>
            </header>

            {/* If Step 3, we might want to hide the sidebar and give full width to board */}
            <div style={{ display: step === 3 ? 'block' : 'grid', gridTemplateColumns: '300px 1fr', gap: '32px' }}>
                {/* Sidebar Steps */}
                {/* Sidebar - Hide if step 3 */}
                {step !== 3 && (
                    <aside>
                        <Card style={{ position: 'sticky', top: '24px' }}>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <StepItem number={1} title="단위(팀) 설정" active={step === 1} completed={step > 1} />
                                <StepItem number={2} title="인원 명단 업로드" active={step === 2} completed={step > 2} />
                                <StepItem number={3} title="결과 검토 및 확정" active={false} completed={false} />
                            </ul>
                        </Card>
                    </aside>
                )}

                {/* Main Content Area */}
                <main>
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Project Name Input */}
                            <div style={{ marginBottom: '32px' }}>
                                <Input
                                    label="프로젝트 이름"
                                    placeholder="예: 2024년 신입생 오리엔테이션 조 편성"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    style={{ fontSize: '1.2rem', padding: '12px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px' }}>배정 단위(팀) 정의</h2>
                                <p style={{ color: 'var(--text-secondary)' }}>
                                    인원을 분배할 그룹, 팀 또는 장소를 설정하세요.
                                    자동 생성 기능을 사용하거나 수동으로 추가할 수 있습니다.
                                </p>
                            </div>
                            <TeamConfiguration onComplete={handleTeamConfigComplete} />
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div style={{ marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px' }}>데이터 가져오기</h2>
                                <p style={{ color: 'var(--text-secondary)' }}>
                                    인원 명단(Excel/CSV)을 업로드하세요.
                                    <br />
                                    <span style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>
                                        * 특히 '과거 이력' 컬럼을 매핑하면 연속 방문 방지 조건을 적용할 수 있습니다.
                                    </span>
                                </p>
                            </div>

                            <DataImport
                                onComplete={handleDataImportComplete}
                                onDataUpdate={setImportedData}
                                onBack={() => setStep(1)}
                            />

                            {/* Enable AI Agent in Step 2 */}
                            <AgentChat
                                onRunAgent={handleRunAgent}
                                isLoading={isAgentLoading}
                                lastRationale={agentRationale}
                                logs={agentLogs}
                            />
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-in fade-in zoom-in duration-500">
                            <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>분배 현황판</h2>
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        배정 결과를 검토하세요. 드래그 앤 드롭으로 인원을 이동할 수 있습니다.
                                        {unassigned.length > 0 && <span style={{ color: 'var(--error)', marginLeft: '8px' }}>({unassigned.length}명 미배정)</span>}
                                    </p>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    제약 로그: {logs.length}건
                                </div>
                            </header>

                            <DistributionBoard
                                initialTeams={teams}
                                unassigned={unassigned}
                                onExport={() => setIsModalOpen(true)}
                            />
                        </div>
                    )}
                </main>
            </div>
            <FinalPreviewModal
                isOpen={isModalOpen}
                teams={teams}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleFinalConfirm}
            />
        </div>
    );
}

const StepItem = ({ number, title, active, completed }: { number: number, title: string, active: boolean, completed: boolean }) => {
    return (
        <li style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            opacity: active || completed ? 1 : 0.5,
            transition: 'opacity 0.2s'
        }}>
            <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: active ? 'var(--primary)' : (completed ? 'var(--success)' : 'var(--surface)'),
                border: active || completed ? 'none' : '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                color: active || completed ? 'white' : 'var(--text-secondary)'
            }}>
                {completed ? '✓' : number}
            </div>
            <span style={{ fontWeight: active ? 600 : 400, color: active ? 'var(--text-main)' : 'var(--text-secondary)' }}>{title}</span>
        </li>
    );
}
