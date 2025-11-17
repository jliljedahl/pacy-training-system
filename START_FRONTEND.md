# 🚀 Så startar du Frontend - Steg för steg

## Förutsättningar

Innan du börjar, se till att du har installerat:
- **Node.js** (version 18 eller senare)
- **npm** (kommer med Node.js)

Kontrollera att du har dem installerade:
```bash
node --version
npm --version
```

Om du inte har dem, ladda ner från: https://nodejs.org/

---

## Steg 1: Öppna Terminal

1. Öppna **Terminal** (på Mac) eller **Command Prompt** (på Windows)
2. Navigera till projektmappen:
   ```bash
   cd /Users/joakimliljedahl/Claude-Code-exp/Program\ creation/pacy-training-system
   ```

---

## Steg 2: Installera Dependencies (första gången)

Om du inte har installerat paket tidigare, kör:

```bash
npm install
```

Detta installerar alla nödvändiga paket. Det kan ta några minuter.

---

## Steg 3: Starta Frontend

### Alternativ A: Starta bara Frontend

```bash
cd frontend
npm install
npm run dev
```

### Alternativ B: Starta både Frontend och Backend samtidigt

Från rotmappen:
```bash
npm run dev
```

---

## Steg 4: Öppna i Webbläsaren

När frontend startar, ser du något liknande:

```
  VITE v5.0.10  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

1. Öppna din webbläsare (Chrome, Safari, Firefox, etc.)
2. Gå till: **http://localhost:5173/**

Du ska nu se din Pacy Training System med den nya Steve Jobs-inspirerade designen! 🎉

---

## Vanliga Problem och Lösningar

### Problem: "command not found: npm"
**Lösning**: Node.js är inte installerat. Ladda ner från nodejs.org

### Problem: "Cannot find module"
**Lösning**: Kör `npm install` i frontend-mappen

### Problem: Port 5173 är redan använd
**Lösning**: Vite hittar automatiskt en ledig port. Kolla terminalen för det nya numret.

### Problem: "EACCES: permission denied"
**Lösning**: Använd `sudo` (Mac/Linux) eller kör Terminal som administratör (Windows)

---

## Stoppa Frontend

Tryck **Ctrl + C** (eller **Cmd + C** på Mac) i terminalen där frontend körs.

---

## Tips

- **Lämna terminalen öppen** medan frontend körs
- **Ändringar sparas automatiskt** - sidan uppdateras i webbläsaren
- **För att se ändringar**: Spara filen, sidan uppdateras automatiskt (hot reload)

---

## Nästa Steg

När frontend körs kan du:
1. Skapa nya projekt
2. Se dina befintliga projekt
3. Utveckla vidare med den nya designen

Lycka till! 🚀

