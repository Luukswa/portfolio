export default function OverMij() {
  const skills = [
    'Python', 'Flask', 'JavaScript', 'React', 'HTML & CSS',
    'PostgreSQL', 'Git', 'Linux', 'NGINX', 'PM2',
  ]

  const hobbies = [
    { icon: '🎮', label: 'Gaming' },
    { icon: '💻', label: 'Programmeren' },
    { icon: '🎵', label: 'Muziek' },
    { icon: '📚', label: 'Lezen' },
  ]

  const subjects = [
    'Informatica', 'Wiskunde', 'Natuurkunde',
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Over mij</h2>
          <div className="subtitle">Een korte introductie</div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>

        {/* Bio */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
              background: 'var(--primary-light)', border: '2px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', color: 'var(--primary)',
            }}>
              👤
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--title)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>
                Jouw naam
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-soft)', marginBottom: '12px', fontWeight: 500 }}>
                Student · OSG Twente
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.65 }}>
                Vul hier je persoonlijke introductietekst in. Vertel wie je bent,
                waar je vandaan komt en wat je drijft. Dit is jouw kans om jezelf
                voor te stellen aan bezoekers van je portfolio.
              </p>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="card">
          <div className="section-title" style={{ marginTop: 0 }}>Skills</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
            {skills.map(s => (
              <span key={s} className="badge badge-primary" style={{ fontSize: '0.78rem' }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Hobbys */}
        <div className="card">
          <div className="section-title" style={{ marginTop: 0 }}>Hobby's</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
            {hobbies.map(h => (
              <div key={h.label} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                fontSize: '0.88rem', color: 'var(--text)',
              }}>
                <span style={{ fontSize: '1.2rem' }}>{h.icon}</span>
                <span>{h.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leukste vakken */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="section-title" style={{ marginTop: 0 }}>Leukste vakken op school</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
            {subjects.map(v => (
              <span key={v} className="badge badge-blue" style={{ fontSize: '0.82rem', padding: '5px 14px' }}>{v}</span>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}
