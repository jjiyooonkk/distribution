import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TeamConfig, Personnel } from '@/types';
import { CheckCircle, Send, FileText, X } from 'lucide-react';

interface FinalPreviewModalProps {
    teams: TeamConfig[];
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const FinalPreviewModal: React.FC<FinalPreviewModalProps> = ({
    teams,
    isOpen,
    onClose,
    onConfirm
}) => {
    if (!isOpen) return null;

    const [customMessage, setCustomMessage] = React.useState("자세한 내용은 대시보드를 확인해주세요.");

    const totalPersonnel = teams.reduce((acc, t) => acc + (t.members?.length || 0), 0);

    // Mock Preview of the first few messages
    const sampleMessages = teams.flatMap(t =>
        (t.members || []).slice(0, 1).map(m => ({
            to: m.name,
            contact: "010-xxxx-xxxx",
            content: `[인원분배 배정 알림]\n안녕하세요 ${m.name}님,\n귀하는 [${t.name}]에 배정되셨습니다.\n${customMessage}`
        }))
    ).slice(0, 3);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            animation: 'fadeIn 0.2s ease'
        }}>
            <Card style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '0' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle color="var(--success)" size={24} />
                        배정 확정
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ background: 'var(--surface-hover)', padding: '16px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>총 팀 수</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{teams.length}</div>
                        </div>
                        <div style={{ background: 'var(--surface-hover)', padding: '16px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>총 인원</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalPersonnel}</div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            추가 메시지
                        </label>
                        <textarea
                            className="input-field"
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            placeholder="추가로 전달할 내용을 입력하세요."
                            style={{
                                width: '100%',
                                minHeight: '80px',
                                padding: '12px',
                                resize: 'vertical',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Send size={16} /> 알림 메시지 미리보기
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                        {sampleMessages.map((msg, idx) => (
                            <div key={idx} style={{
                                fontSize: '0.9rem',
                                background: '#1e293b',
                                padding: '12px',
                                borderRadius: '8px',
                                borderLeft: '4px solid var(--primary)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                    <span>받는 사람: {msg.to}</span>
                                    <span>문자/텔레그램</span>
                                </div>
                                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: 'white' }}>
                                    {msg.content}
                                </pre>
                            </div>
                        ))}
                        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            ... 외 {totalPersonnel - 3} 명
                        </div>
                    </div>
                </div>

                <div style={{ padding: '24px', borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <Button variant="ghost" onClick={onClose}>취소</Button>
                    <Button onClick={onConfirm} style={{ minWidth: '140px' }}>
                        승인 및 발송
                    </Button>
                </div>
            </Card>
        </div>
    );
};
