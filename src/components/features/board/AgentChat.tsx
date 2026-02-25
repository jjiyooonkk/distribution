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

export const AgentChat: React.FC<AgentChatProps> = ({ onRunAgent, isLoading, lastRationale, logs }) => {
    const [command, setCommand] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!command.trim()) return;
        onRunAgent(command);
        setCommand('');
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
                            width: '420px',
                            zIndex: 100,
                        }}
                    >
                        <Card style={{
                            maxHeight: '650px',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            padding: 0,
                            borderRadius: 'var(--radius-lg)',
                        }}>
                            {/* Header */}
                            <div style={{
                                padding: '20px 24px',
                                borderBottom: '1px solid var(--border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'rgba(15, 23, 42, 0.03)',
                                backdropFilter: 'blur(5px)'
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
                                        <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>AI 배정 설계자</h3>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                                            온라인
                                        </div>
                                    </div>
                                </div>
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
                                        color: 'var(--text-secondary)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Body */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', minHeight: '300px', background: 'rgba(255,255,255,0.5)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {/* Default Welcome Message */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        style={{ display: 'flex', gap: '12px', maxWidth: '85%' }}
                                    >
                                        <div style={{
                                            background: 'white',
                                            padding: '14px 18px',
                                            borderRadius: '0 16px 16px 16px',
                                            fontSize: '0.95rem',
                                            lineHeight: '1.5',
                                            boxShadow: '0 4px 15px -5px rgba(0,0,0,0.05)',
                                            border: '1px solid var(--border)'
                                        }}>
                                            반갑습니다! 배정 조건을 말씀해 주시면 데이터를 분석하여 최적의 결과를 제안해 드립니다. ✨
                                        </div>
                                    </motion.div>

                                    {/* AI Reasoning Result */}
                                    {lastRationale && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                                        >
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: '12px' }}>
                                                AI Analysed Result
                                            </div>
                                            <div style={{
                                                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                                padding: '16px 20px',
                                                borderRadius: '16px',
                                                fontSize: '0.95rem',
                                                lineHeight: '1.6',
                                                whiteSpace: 'pre-line',
                                                color: '#1e40af',
                                                boxShadow: '0 4px 15px -5px rgba(59, 130, 246, 0.1)'
                                            }}>
                                                {lastRationale}
                                            </div>

                                            {logs && logs.length > 0 && (
                                                <div style={{
                                                    marginTop: '8px',
                                                    background: 'rgba(0,0,0,0.02)',
                                                    padding: '12px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.8rem',
                                                    color: 'var(--text-secondary)',
                                                    border: '1px dashed var(--border)'
                                                }}>
                                                    <div style={{ fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }} />
                                                        Execution Context
                                                    </div>
                                                    <ul style={{ listStyle: 'none', padding: 0, opacity: 0.8 }}>
                                                        {logs.map((log, i) => <li key={i} style={{ marginBottom: '2px' }}>{log}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {isLoading && (
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            <Loader2 size={16} className="animate-spin" />
                                            조건에 맞춰 인원을 배정하는 중...
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Input */}
                            <div style={{ padding: '24px', borderTop: '1px solid var(--border)', background: 'white' }}>
                                <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
                                    <input
                                        className="input-field"
                                        value={command}
                                        onChange={(e) => setCommand(e.target.value)}
                                        placeholder="명령어 입력 (예: 골고루 섞어줘)"
                                        disabled={isLoading}
                                        style={{
                                            paddingRight: '54px',
                                            height: '52px',
                                            borderRadius: '26px',
                                            fontSize: '1rem'
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={isLoading || !command.trim()}
                                        style={{
                                            position: 'absolute',
                                            right: '6px',
                                            top: '6px',
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '20px',
                                            border: 'none',
                                            background: command.trim() ? 'var(--primary-gradient)' : 'var(--border)',
                                            color: 'white',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s'
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

