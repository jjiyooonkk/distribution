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
    const [isAgentLoading, setIsAgentLoading] = useState(false);
    const [agentRationale, setAgentRationale] = useState<string | undefined>(undefined);
    const [agentLogs, setAgentLogs] = useState<string[]>([]);

    const handleRunAgent = async (command: string) => {
        setIsAgentLoading(true);
        try {
            // Context for Step 2: We might not have teams populated with members yet, 
            // but we might have raw data if we lifted state from DataImport (which we haven't yet).
            // For now, we will send current 'teams' config.

            const currentTeams = teams.map(t => ({
                id: t.id,
                name: t.name,
                capacity: t.capacity
            }));

            // TODO: Lift 'importedData' state up effectively so Agent can see it in Step 2.

            // Fix: Correct API endpoint is /api/agent (Next.js App Router rules)
            const response = await fetch('/api/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personnel: [], // Step 2 issue: No data yet.
                    teams: currentTeams,
                    command
                })
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.details || data.error || "Server Error";

                // OpenAI Quota Exceeded
                if (response.status === 429) {
                    throw new Error("🚨 OpenAI API 사용량 한도가 초과되었습니다.\n(Billing Quota Exceeded)\n\nDashboard에서 결제 정보를 확인하거나, \n'.env.local' 파일에서 API 키를 제거하여 **시뮬레이션 모드**로 전환하세요.");
                }

                // If 500 and no details, it might be the empty personnel issue
                if (response.status === 500 && !data.details) {
                    throw new Error("데이터 처리 중 오류가 발생했습니다. (인원 명단이 비어있을 수 있습니다)");
                }
                throw new Error(errorMsg);
            }

            if (data.rationale) {
                setAgentRationale(data.rationale);
                setAgentLogs(data.logs || []);
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
        // Run Initial Distribution
        const result = distributePersonnel(importedData, teams);
        setTeams(result.teams);
        setUnassigned(result.unassigned);
        setLogs(result.logs);

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
