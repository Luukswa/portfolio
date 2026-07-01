const FAQ = [
  {
    q: 'Hoe log ik in?',
    a: 'Je kunt inloggen via het portaal, of direct met de knop "Inloggen met Microsoft" op het inlogscherm. Beide manieren gebruiken hetzelfde Microsoft-account, dus je gegevens zijn identiek.',
  },
  {
    q: 'Hoe vul ik "Over mij" in?',
    a: 'Ga naar "Over mij" in het menu. Vul je bio, skills en hobby\'s in en klik op Opslaan. De eerste keer dat je deze pagina opent, krijg je een korte setup-wizard om snel op weg te helpen.',
  },
  {
    q: 'Hoe voeg ik cijfers toe?',
    a: 'Ga naar "Mijn cijfers" en klik op "+ Nieuw cijfer". Vul het vak en het cijfer in en sla op. Je gemiddelde wordt automatisch berekend.',
  },
  {
    q: 'Hoe voeg ik een doel toe?',
    a: 'Ga naar "Doelen" en klik op "+ Nieuw doel". Beschrijf je doel, wat je wilt leren en wat je daarvoor nodig hebt.',
  },
  {
    q: 'Hoe vul ik mijn CV in?',
    a: 'Ga naar "Mijn CV" en vul je gegevens, vaardigheden en ervaring in. Wijzigingen worden per veld opgeslagen.',
  },
  {
    q: 'Hoe voeg ik referenties toe?',
    a: 'Ga naar "Referenties" en klik op "+ Referentie" om een nieuwe referentie toe te voegen. Je kunt zoveel referenties toevoegen als je wilt.',
  },
  {
    q: 'Hoe voeg ik een werkstuk toe?',
    a: 'Ga naar "Werkstukken", klik op "+ Nieuw werkstuk" en vul vak, gemaakt bij, datum en waar je trots op bent in. Je kunt er foto\'s aan toevoegen door ze te uploaden.',
  },
  {
    q: 'Wie kan mijn portfolio zien?',
    a: 'Alleen jijzelf, je docenten en beheerders kunnen je portfolio inzien. Docenten zien een overzicht van alle studenten via "Overzicht".',
  },
]

export default function Hulp() {
  return (
    <>
      <div className="page-header">
        <div>
          <h2>Hulp</h2>
          <div className="subtitle">Veelgestelde vragen over het gebruik van deze app</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {FAQ.map((item, i) => (
          <details key={i} className="faq-item">
            <summary className="faq-question">{item.q}</summary>
            <div className="faq-answer">{item.a}</div>
          </details>
        ))}
      </div>
    </>
  )
}
