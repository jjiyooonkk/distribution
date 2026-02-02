import Link from 'next/link';

export default function Home() {
  return (
    <main className="container">
      <header style={{ padding: '40px 0', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
          AI 지능형 인원 분배 시스템
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          스마트하고 공정한 팀 빌딩 및 인원 배정 솔루션
        </p>
      </header>

      <div style={{ marginTop: '60px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Create New Project Card */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
          <Link href="/project/new" className="glass-panel-link" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start', flex: 1 }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: 'white' }}>
              +
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>새 프로젝트 만들기</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              새로운 배정 프로젝트를 시작합니다. 인원 명단을 업로드하고 팀 조건을 설정하세요.
            </p>
            <button className="btn-primary" style={{ marginTop: 'auto' }}>
              시작하기
            </button>
          </Link>
        </div>

        {/* History/Stats Card placeholder */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>최근 활동</h2>
          <p style={{ color: 'var(--text-muted)' }}>최근 프로젝트 내역이 없습니다.</p>
        </div>
      </div>
    </main>
  );
}
