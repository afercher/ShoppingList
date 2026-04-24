# ShoppingList

Symfony-basierte Einkaufslisten-App mit REST-API, MySQL und einer nutzerfreundlichen Weboberflaeche.

## Features

- Mehrere Einkaufslisten erstellen, bearbeiten und loeschen
- Artikel in Kategorien (Departments) verwalten
- Shopping-Ansicht mit Abhaken von Artikeln
- PDF-Export pro Liste (kategorisiert)
- Wenn alle Artikel abgehakt sind: Liste wird geloescht
- Wenn nur ein Teil abgehakt ist: nur diese Artikel werden entfernt

## Tech Stack

- Backend: Symfony + Doctrine DBAL
- Datenbank: MySQL 8
- Frontend: Vanilla JavaScript + HTML/CSS
- Container: Docker Compose

## Projektstruktur

- `backend/` Symfony API + DB-Skripte
- `frontend/` statische Weboberflaeche

## Setup

### 0) Voraussetzungen

- Windows 10/11
- Docker Desktop (muss laufen)
- Python 3 (Befehl `py` oder `python` verfuegbar)

### 1) Backend starten

```powershell
cd C:\dev\ShoppingList\ShoppingList\backend
docker compose up -d --build
```

### 2) Datenbankschema anlegen

```powershell
cd C:\dev\ShoppingList\ShoppingList\backend
docker compose exec app php bin/init_schema.php
```

### 3) Optional: Beispieldaten importieren

```powershell
cd C:\dev\ShoppingList\ShoppingList\backend
Get-Content .\seed_data.sql | docker compose exec -T database mysql -uapp -p!ChangeMe! app
```

### 4) Frontend starten

```powershell
cd C:\dev\ShoppingList\ShoppingList\frontend
python -m http.server 3000
```

Dann im Browser:

- Frontend: `http://localhost:3000`
- API: `http://localhost:8000`

## 1-Klick Start (Doppelklick)

Fuer den einfachen Start ohne manuelle Commands gibt es zwei Starter-Dateien im Projekt-Root:

- `StartShoppingList.bat`
- `StopShoppingList.bat`

### Start

- Doppelklick auf `StartShoppingList.bat`
- Das Script startet automatisch:
  - Docker Services (`backend`, `database`, `mailer`)
  - Datenbankschema (`backend/bin/init_schema.php`)
  - Frontend-Server auf Port `3000`
  - Browser mit `http://localhost:3000`

### Stop

- Doppelklick auf `StopShoppingList.bat`
- Das Script stoppt:
  - Frontend-Server
  - Docker Services (`docker compose down`)

### Technische Details

- PowerShell-Skripte liegen unter `scripts/`
  - `scripts/start-shoppinglist.ps1`
  - `scripts/stop-shoppinglist.ps1`
- Laufzeitdateien liegen unter `.runtime/`
  - `frontend-http.pid`
  - `frontend-http.out.log`
  - `frontend-http.err.log`

## EXE-Launcher bauen (optional)

Wenn du statt `.bat` lieber echte `.exe`-Starter willst:

```powershell
cd C:\dev\ShoppingList\ShoppingList
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\build-launcher-exe.ps1
```

Ergebnis:

- `dist\StartShoppingList.exe`
- `dist\StopShoppingList.exe`

Hinweise:

- Das Build-Skript installiert bei Bedarf das PowerShell-Modul `ps2exe` (CurrentUser).
- Optionales Icon: `assets\shoppinglist.ico`
- Test ohne Build:

```powershell
cd C:\dev\ShoppingList\ShoppingList
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\build-launcher-exe.ps1 -DryRun
```

## API Endpoints (Anforderungsabdeckung)

Die geforderten Endpoints sind unter `/lists` verfuegbar.
Zusaetzlich existieren kompatible `/api/lists`-Aliase fuer das bestehende Frontend.

1. `POST /lists`
   - Erstellt eine Einkaufsliste mit X Eintraegen
2. `POST /lists/{id}/item`
   - Erstellt neues Item in der Liste
   - Antwort: aktualisierte Einkaufsliste
3. `GET /lists/{id}/items`
   - Gibt die komplette Einkaufsliste (Items) zurueck
4. `GET /lists/{id}/items/{itemId}`
   - Gibt ein konkretes Item zurueck
5. `PUT /lists/{id}/items/{itemId}`
   - Aktualisiert ein Item
6. `DELETE /lists/{id}`
   - Loescht eine Einkaufsliste
7. `DELETE /lists/{id}/items/{itemId}`
   - Loescht ein Item

## Beispiel-Requests

```http
POST /lists
Content-Type: application/json

{
  "name": "Wocheneinkauf",
  "articles": [1, 2, 3]
}
```

```http
POST /lists/1/item
Content-Type: application/json

{
  "article_id": 5,
  "quantity": 2
}
```

## Hinweise

- Die API-Controller sind Symfony-typisch mit Attribute-Routing umgesetzt.
- Das Frontend ist bewusst ohne Framework gehalten, um Setup und Review einfach zu halten.
