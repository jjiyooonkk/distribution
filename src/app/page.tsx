"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Trash2, Plus, ArrowRight, Calendar, Users } from 'lucide-react';

interface ProjectListItem {
  id: string;
  name: string;
  updatedAt: number;
  step: number;
}

export default function Home() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);

  const STORAGE_KEY = 'jinjjajal_new_project_state';

  useEffect(() => {
    // Load the current active project as a list item if it exists
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.projectName) {
          setProjects([{
            id: 'current-draft',
            name: parsed.projectName,
            updatedAt: Date.now(), // Estimate
            step: parsed.step || 1
          }]);
        }
      } catch (e) {
        console.error("Failed to load projects:", e);
      }
    }
  }, []);

  const handleDelete = (id: string) => {
    if (confirm("프로젝트를 삭제하시겠습니까? 데이터가 모두 소실됩니다.")) {
      if (id === 'current-draft') {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('jinjjajal_agent_chat_history');
        localStorage.removeItem('jinjjajal_constraints');
        setProjects([]);
      }
    }
  };

  return (
    <main className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <header style={{
        padding: '64px 0',
        borderBottom: '1px solid var(--border)',
        marginBottom: '64px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          background: 'var(--primary-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '16px'
        }}>
          지능형 인원 분배 시스템
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
          실시간 데이터 분석과 AI를 결합한 스마트 팀 빌딩 솔루션
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
        {/* Create New Project Card */}
        <div style={{ background: 'var(--primary-gradient)', borderRadius: '24px', padding: '2px' }}>
          <Link href="/project/new" onClick={() => {
            // 새 프로젝트를 시작할 때 기존 드래프트 데이터를 명확히 삭제
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem('jinjjajal_agent_chat_history');
            localStorage.removeItem('jinjjajal_constraints');
          }} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white',
              borderRadius: '22px',
              padding: '36px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }} className="hover-lift">
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)'
              }}>
                <Plus size={32} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>새 프로젝트 시작</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>인원 명단을 업로드하고 AI와 함께 최적의 팀을 구성해 보세요.</p>
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--primary)' }}>
                새로 시작하기 <ArrowRight size={18} />
              </div>
            </div>
          </Link>
        </div>

        {/* Saved Projects Section */}
        {projects.length > 0 ? (
          projects.map((project) => (
            <div key={project.id} className="glass-panel" style={{ padding: '36px', display: 'flex', flexDirection: 'column', gap: '20px', borderRadius: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ background: 'var(--surface)', padding: '6px 14px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', border: '1px solid var(--border)' }}>
                  진행 중 (Step {project.step}/3)
                </div>
                <button
                  onClick={() => handleDelete(project.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  title="삭제"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>{project.name}</h3>
                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> 최근 수정: {new Date(project.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div style={{ marginTop: 'auto' }}>
                <Link href="/project/new" style={{ textDecoration: 'none' }}>
                  <button className="btn-primary" style={{ width: '100%', padding: '16px', borderRadius: '16px', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    작업 이어서 하기 <ArrowRight size={18} />
                  </button>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-panel" style={{ padding: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)', gap: '16px', borderStyle: 'dashed' }}>
            <Users size={48} opacity={0.2} />
            <div>
              <p style={{ fontWeight: 600 }}>저장된 프로젝트가 없습니다.</p>
              <p style={{ fontSize: '0.9rem' }}>새로운 프로젝트를 시작해 보세요.</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
