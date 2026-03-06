import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Bot, Sparkles, Loader2, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentChatProps {
    onRunAgent: (command: string) => Promise<void>;
    isLoading: boolean;
    lastRationale?: string;
    logs?: string[];
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    logs?: string[];
    timestamp: number;
}

export const AgentChat: React.FC<AgentChatProps> = ({ onRunAgent, isLoading, lastRationale, logs }) => {
    const [command, setCommand] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);

    const STORAGE_KEY = 'jinjjajal_agent_chat_history';

    // Load history
    React.useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setMessages(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load chat history:", e);
            }
        }
    }, []);

    // Save history
    React.useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }, [messages]);

    // Handle new assistant responses
    React.useEffect(() => {
        if (lastRationale && !isLoading) {
            // content와 logs를 결합하여 유니크한 키 생성 (중복 메시지 추가 방지)
            const currentContent = lastRationale;
            const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;

            // 마지막 메시지가 이미 현재의 rationale과 같다면 추가하지 않음
            if (lastMsg?.content !== currentContent) {
                setMessages(prev => [...prev, {
                    id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    role: 'assistant',
                    content: currentContent,
                    logs: logs,
                    timestamp: Date.now()
                }]);

                // 새로운 메시지가 오면 채팅창 하단으로 스크롤
                setTimeout(() => {
                    const bottom = document.getElementById('chat-bottom');
                    bottom?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    }, [lastRationale, isLoading, logs]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!command.trim() || isLoading) return;

        const userMsg: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: command,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        const currentCommand = command;
        setCommand('');
        await onRunAgent(currentCommand);
    };

    const clearHistory = () => {
        if (confirm("대화 기록을 모두 삭제하시겠습니까?")) {
            setMessages([]);
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    return (
        <>
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1, translateY: -4 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        style={{
                            position: 'fixed',
                            bottom: '32px',
                            right: '32px',
                            width: '64px',
                            height: '64px',
                            borderRadius: '32px',
                            background: 'var(--primary-gradient)',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 100,
                        }}
                    >
                        <Bot size={30} />
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            position: 'fixed',
                            bottom: '32px',
                            right: '32px',
                            width: '450px',
                            zIndex: 100,
                        }}
                    >
                        <Card style={{
                            maxHeight: '700px',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            padding: 0,
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}>
                            {/* Header */}
                            <div style={{
                                padding: '20px 24px',
                                borderBottom: '1px solid var(--border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'rgba(255, 255, 255, 0.8)',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '10px',
                                        background: 'var(--primary-gradient)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white'
                                    }}>
                                        <Bot size={20} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            AI 배정 에이전트
                                            <Sparkles size={14} color="#f59e0b" />
                                        </h3>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                                            데이터 분석 모드 활성화
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={clearHistory} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem' }} title="대화 기록 삭제">
                                        삭제
                                    </button>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        style={{
                                            background: 'rgba(0,0,0,0.05)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--text-secondary)'
                                        }}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', minHeight: '400px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Default Welcome */}
                                <div style={{ display: 'flex', gap: '12px', maxWidth: '85%' }}>
                                    <div style={{
                                        background: 'white',
                                        padding: '14px 18px',
                                        borderRadius: '0 16px 16px 16px',
                                        fontSize: '0.95rem',
                                        lineHeight: '1.5',
                                        boxShadow: 'var(--shadow-sm)',
                                        border: '1px solid var(--border)'
                                    }}>
                                        안녕하세요! 인원 명단 분석과 배정 조건 설정을 도와드립니다. 명령어를 입력해주세요. (예: 성비 균형 있게, XX는 1조로 고정)
                                    </div>
                                </div>

                                {/* Chat Messages */}
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{
                                            display: 'flex',
                                            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                            gap: '12px'
                                        }}
                                    >
                                        <div style={{
                                            maxWidth: '85%',
                                            background: msg.role === 'user' ? 'var(--primary-gradient)' : 'white',
                                            color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                                            padding: '14px 18px',
                                            borderRadius: msg.role === 'user' ? '16px 16px 0 16px' : '0 16px 16px 16px',
                                            fontSize: '0.95rem',
                                            lineHeight: '1.6',
                                            boxShadow: 'var(--shadow-sm)',
                                            border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                                            whiteSpace: 'pre-line'
                                        }}>
                                            {msg.content}
                                            {msg.logs && msg.logs.length > 0 && (
                                                <div style={{
                                                    marginTop: '12px',
                                                    paddingTop: '12px',
                                                    borderTop: '1px dashed rgba(0,0,0,0.1)',
                                                    fontSize: '0.8rem',
                                                    color: 'var(--text-secondary)',
                                                    opacity: 0.8
                                                }}>
                                                    <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '0.7rem' }}>[분석 로그]</div>
                                                    {msg.logs.map((log, i) => <div key={i}>• {log}</div>)}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}

                                {isLoading && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>배정 알고리즘 연산 중...</span>
                                    </div>
                                )}
                                <div id="chat-bottom" />
                            </div>

                            {/* Footer Input */}
                            <div style={{ padding: '24px', borderTop: '1px solid var(--border)', background: 'white' }}>
                                <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
                                    <input
                                        className="input-field"
                                        value={command}
                                        onChange={(e) => setCommand(e.target.value)}
                                        placeholder="요청 사항을 입력하세요..."
                                        disabled={isLoading}
                                        style={{
                                            paddingRight: '54px',
                                            height: '52px',
                                            borderRadius: '12px',
                                            fontSize: '1rem',
                                            background: '#f1f5f9'
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={isLoading || !command.trim()}
                                        style={{
                                            position: 'absolute',
                                            right: '8px',
                                            top: '8px',
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: command.trim() ? 'var(--primary-gradient)' : 'var(--border)',
                                            color: 'white',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                    </button>
                                </form>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

