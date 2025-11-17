# Agent Skills Guide för Article Writer

Denna guide beskriver de Agent Skills som skapats för att förbättra article-writer agenten i Pacy Training System.

## Översikt

Tre Agent Skills har skapats för att göra article-writer agenten ännu vassare:

1. **article-writing-excellence** - Allmänna tekniker för exceptionell artikel-skrivning
2. **narrative-momentum** - Tekniker för att behålla läsarens uppmärksamhet och flöde
3. **word-economy-mastery** - Avancerade tekniker för att minska ordantal utan att förlora klarhet

## Var finns Skills?

Skills finns i `.claude/skills/` mappen:
```
.claude/skills/
├── article-writing-excellence/
│   └── SKILL.md
├── narrative-momentum/
│   └── SKILL.md
└── word-economy-mastery/
    └── SKILL.md
```

## Hur fungerar Agent Skills?

Agent Skills är **model-invoked** - Claude bestämmer automatiskt när de ska användas baserat på:
- Din förfrågan
- Skill-beskrivningen (description field)
- Kontexten i samtalet

Du behöver **inte** explicit anropa Skills - de aktiveras automatiskt när relevant.

## Skill 1: Article Writing Excellence

**När används den:**
- När article-writer agenten skriver artiklar
- När innehåll behöver förbättras
- När ordantal måste hållas under kontroll
- När läsar-engagement behöver ökas

**Vad den ger:**
- Avancerade narrativa tekniker
- Ord-ekonomi strategier
- Läsar-engagement tekniker
- Checklistor för kvalitetskontroll

**Huvudsakliga tekniker:**
- Word economy: Varje ord måste förtjäna sin plats
- Narrative momentum: Behåll läsarens uppmärksamhet
- Reader engagement: Direkt addressering, konkreta exempel
- Style refinement: Röst, ton, precision

## Skill 2: Narrative Momentum

**När används den:**
- När artiklar känns platta eller tråkiga
- När innehåll förlorar läsarens uppmärksamhet
- När flödet mellan sektioner behöver förbättras
- När öppningar och avslutningar behöver mer kraft

**Vad den ger:**
- Hook-tekniker för öppningar
- Övergångar mellan sektioner
- Tekniker för att bygga "aha moments"
- Momentum i avslutningar

**Huvudsakliga tekniker:**
- Opening hooks: Surprising insight, relatable scenario, provocative question
- Section transitions: Question bridge, insight connection, example continuation
- Building to insights: Progressive revelation
- Conclusion momentum: Forward motion, not summaries

## Skill 3: Word Economy Mastery

**När används den:**
- När artiklar överskrider ordgränser (800-1200 ord)
- När skrivandet behöver bli mer koncist
- När texten behöver bli tightare och mer fokuserad

**Vad den ger:**
- Systematiska reduktionsstrategier
- Vanliga redundanser att eliminera
- Process för att minska ordantal
- Quick reference för vanliga klipp

**Huvudsakliga tekniker:**
- Eliminera redundans: "in order to" → "to"
- Aktiv röst: Kortare och tydligare
- Ersätt fraser med ord: "a large number of" → "many"
- Klipp filler-ord: "very", "really", "quite"
- Strukturell reduktion: Färre exempel, mindre teori

## Integration med Article Writer Agent

Article-writer agenten (`.claude/agents/article-writer.md`) kommer automatiskt att använda dessa Skills när:

1. **Article skrivs**: Skills aktiveras baserat på kontext
2. **Ordantal överskrids**: word-economy-mastery aktiveras
3. **Flöde behöver förbättras**: narrative-momentum aktiveras
4. **Kvalitet behöver höjas**: article-writing-excellence aktiveras

## Exempel på användning

### Scenario 1: Artikel överskrider ordgräns
```
User: "Skriv en artikel om X, max 1000 ord"
Claude: [Aktiverar word-economy-mastery automatiskt]
```

### Scenario 2: Artikel känns platt
```
User: "Denna artikel känns tråkig, kan du göra den mer engagerande?"
Claude: [Aktiverar narrative-momentum automatiskt]
```

### Scenario 3: Förbättra artikel-kvalitet
```
User: "Skriv en artikel om Y med hög kvalitet"
Claude: [Aktiverar article-writing-excellence automatiskt]
```

## Best Practices

### För utvecklare
1. **Låt Skills vara model-invoked**: De aktiveras automatiskt när relevant
2. **Uppdatera descriptions**: Om Skills inte aktiveras, gör descriptions mer specifika
3. **Testa med konkreta exempel**: "Skriv artikel om X" kommer att aktivera relevanta Skills

### För article-writer agenten
1. **Referera till Skills i prompts**: "Use word economy techniques when approaching limits"
2. **Använd Skills-checklistor**: Verifiera att artikel följer principerna
3. **Kombinera Skills**: Använd flera Skills tillsammans för bästa resultat

## Ytterligare förbättringar

### Framtida Skills-förslag
1. **source-integration-excellence**: Förbättra hur källor integreras naturligt
2. **audience-adaptation**: Anpassa ton och exempel för specifik målgrupp
3. **hist-compliance-checker**: Automatisk verifiering av HIST-principer

### Uppdatering av article-writer agent
Överväg att uppdatera `.claude/agents/article-writer.md` för att explicit referera till Skills:

```markdown
## Using Agent Skills

When writing articles, these Skills are available:
- **article-writing-excellence**: For overall writing quality
- **narrative-momentum**: For maintaining reader engagement
- **word-economy-mastery**: For staying within word limits

These Skills activate automatically when relevant.
```

## Testning

För att testa Skills:

1. **Skriv en artikel** som överskrider ordgräns → word-economy-mastery ska aktiveras
2. **Be om mer engagerande artikel** → narrative-momentum ska aktiveras
3. **Skriv artikel med hög kvalitet** → article-writing-excellence ska aktiveras

## Support

Om Skills inte aktiveras:
1. Kontrollera att Skills finns i `.claude/skills/`
2. Verifiera YAML frontmatter är korrekt
3. Gör descriptions mer specifika
4. Testa med explicita förfrågningar som matchar descriptions

## Referenser

- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills)
- Article Writer Agent: `.claude/agents/article-writer.md`
- Skills: `.claude/skills/`

