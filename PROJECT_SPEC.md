# SchahlLED Map-Configurator - Projektspezifikation

## 1. Visuelles Design (Aesthetics)
- **Hintergrund**: Stark erweiterter Sternenhimmel (`SkyBackground`) mit ~800 Sternen.
  - Verstärkte Milchstraßen-Aura durch überlagerte Glow-Effekte.
  - Funkelnde Sterne in verschiedenen Größen und Farben (Blau/Weiß/Gelb).
- **Header**: Absolut blickdicht (`#00040D`).
  - **Buttons**: "ADMIN" und "HILFE".
  - **Navigation**: Wenn Admin aktiv ist, erscheint ein zusätzlicher Reiter zum Wechseln zwischen "Configurator" und "Admin (Service)".
- **UI-Komponenten**: Glassmorphismus ohne Clipping (kein `overflow-hidden` an kritischen Stellen), damit die Suchmenüs immer im Vordergrund stehen.

## 2. Kernfunktionen
- **SN Patching (Mehrfach)**: Wie bisher, unbegrenzte Anzahl an Tausch-Positionen.
- **DH Transfer (Mehrfach)**: **NEU** - Nun können auch mehrere Daylight-Harvesting Transfers gleichzeitig definiert werden (analog zum Patching).
- **Suchmenüs**: Z-Index Korrektur, um sicherzustellen, dass die Vorschläge über allen anderen Elementen schweben.

## 3. Admin-Bereich
- **Sicherung**: Zugriff nur über ein **Muster-Passwort** (3x3 Grid).
- **Inhalt**: Vorbereitung für Serviceprotokolle.
- **Navigation**: Einfacher Rücksprung zum Konfigurator über den Header-Reiter.

## 4. Technischer Leitfaden
- Support-Kontakte: Daniel Seehaus (Technischer Leiter, -20) und Patrick Hartmann (Service, -36).
- Standard-Workflow für Reset und Inbetriebnahme hinterlegt.

## 5. No-Go's
- Suchmenüs, die abgeschnitten werden.
- Nur ein einziger DH-Transfer möglich.
- Fehlendes Passwort für den Admin-Bereich.
