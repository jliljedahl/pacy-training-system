# 🚀 Starta Frontend OCH Backend - Komplett Guide

## ⚠️ Viktigt: Du behöver BÅDE Frontend OCH Backend

Frontend (React) behöver backend (API) för att fungera. Båda måste köra samtidigt!

---

## Steg 1: Öppna TVÅ Terminaler i Cursor

Du behöver två terminaler - en för frontend och en för backend.

### Terminal 1: Backend
1. Öppna terminal i Cursor (`Cmd + `` eller Terminal → New Terminal)
2. Klicka på `+` för att öppna en ny terminal (nu har du 2 terminaler)

---

## Steg 2: Starta Backend (Terminal 1)

I den första terminalen:

```bash
cd backend
npm install
npm run dev
```

Du ska se:
```
🚀 Pacy Training System API running on port 3000
```

**Lämna denna terminal öppen!** Backend måste köra hela tiden.

---

## Steg 3: Starta Frontend (Terminal 2)

I den andra terminalen:

```bash
cd frontend
npm install
npm run dev
```

Du ska se:
```
➜  Local:   http://localhost:5173/
```

---

## Steg 4: Öppna i Webbläsaren

Gå till: **http://localhost:5173/**

Nu ska allt fungera! 🎉

---

## Alternativ: Starta Båda Samtidigt (Enklare!)

Om du vill starta båda med ett kommando:

Från rotmappen (`pacy-training-system`):

```bash
npm run dev
```

Detta startar både frontend och backend automatiskt!

---

## Felsökning

### Problem: "Failed to create project"

**Lösning 1: Kontrollera att backend körs**
- Öppna: http://localhost:3000/health
- Du ska se: `{"status":"ok"}`
- Om inte: Starta backend (se Steg 2)

**Lösning 2: Kontrollera databas**
- Backend behöver en databas (SQLite i `backend/prisma/dev.db`)
- Om databas saknas, kör i backend-mappen:
  ```bash
  npx prisma migrate dev
  ```

**Lösning 3: Kontrollera konsolen**
- Öppna Developer Tools i webbläsaren (F12 eller Cmd+Option+I)
- Gå till "Console"-fliken
- Kolla efter felmeddelanden

### Problem: "Cannot connect to API"

**Lösning:**
- Kontrollera att backend körs på port 3000
- Kontrollera att frontend körs på port 5173
- Se till att ingen annan app använder dessa portar

### Problem: "Port already in use"

**Lösning:**
- Stoppa den process som använder porten
- Eller ändra port i konfigurationen

---

## Snabbkontroll: Är allt igång?

1. ✅ Backend körs → http://localhost:3000/health visar `{"status":"ok"}`
2. ✅ Frontend körs → http://localhost:5173/ visar appen
3. ✅ Båda terminaler är öppna och kör

---

## Stoppa Allt

Tryck `Ctrl + C` (eller `Cmd + C` på Mac) i båda terminalerna.

---

## Tips

- **Lämna båda terminalerna öppna** medan du utvecklar
- **Ändringar sparas automatiskt** - både frontend och backend laddar om
- **För att se backend-loggar**: Kolla terminal 1
- **För att se frontend-loggar**: Kolla webbläsarens konsol (F12)

---

## Nästa Steg

När både frontend och backend körs kan du:
1. Skapa nya projekt
2. Ladda upp briefs
3. Se dina projekt
4. Utveckla vidare!

Lycka till! 🚀

