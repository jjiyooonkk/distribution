import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Bot, Sparkles, Loader2, MessageSquare } from 'lucide-react';

interface AgentChatProps {
    onRunAgent: (command: string) => Promise<void>;
    isLoading: boolean;
    lastRationale?: string;
    logs?: string[];
}

export const AgentChat: React.FC<AgentChatProps> = ({ onRunAgent, isLoading, lastRationale, logs }) => {
    const [command, setCommand] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!command.trim()) return;
        onRunAgent(command);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '32px',
                    right: '32px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '30px',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    boxShadow: 'var(--shadow-lg)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                    transition: 'all 0.2s ease'
                }}
            >
                <Bot size={28} />
            </button>
        )
    }

    return (
        <Card style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            width: '400px',
            maxHeight: '600px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)'
        }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-hover)' }}>
                <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                    <Bot size={18} color="var(--primary)" />
                    AI 배정 설계자
                </h3>
                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                    &times;
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', minHeight: '200px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Welcome Message */}
                {!lastRationale && (
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        안녕하세요! 저는 인원 배정 전문 AI 에이전트입니다.<br /><br />
                        "운전자를 각 팀에 1명씩 배치해줘"<br />
                        "A와 B는 서로 다른 조로 떼어줘"<br /><br />
                        원하시는 조건을 말씀해 주시면, 최적의 배정 결과를 제안해 드립니다.
                    </div>
                )}

                {/* Reasoning Output */}
                {lastRationale && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>AI 분석 결과</div>
                        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                            {lastRationale}
                        </div>
                        {logs && logs.length > 0 && (
                            <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <strong>실행 로그:</strong>
                                <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                                    {logs.map((log, i) => <li key={i}>{log}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '16px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        className="input-field"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        placeholder="명령어 입력 (예: 골고루 섞어줘)"
                        disabled={isLoading}
                        style={{ flex: 1 }}
                    />
                    <Button type="submit" disabled={isLoading} style={{ width: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                    </Button>
                </div>
            </form>
        </Card>
    );
};
