# SchahlLED Maintenance Console - Projektspezifikation

## 1. Visuelles Design (Aesthetics)
- **Hintergrund**: Dynamischer Sternenhimmel (`SkyBackground`).
  - Ca. 280-300 Sterne mit Funkel-Effekt (`twinkle`).
  - Milchstraßen-Aura im Hintergrund (Radial Gradients in Blau/Violett).
  - Vorbeiziehende Wolkenschleier in zwei Geschwindigkeiten.
- **Header**: 
  - Absolut blickdicht (Farbe: `#00040D`).
  - Weißer Logo-Container mit `90px` Logo-Höhe.
  - Sticky-Positionierung.
  - **Links**: Logo -> schahlled.de | CC-Logo -> CC-Portal.
  - **Korrektur**: Kein redundanter "Control Center" Text neben dem CC-Logo.
- **UI-Komponenten**:
  - Glassmorphismus-Karten (`glass-card`) with `40px` Blur.
  - Blaue LED-Glow-Effekte für Buttons und Status-Indikatoren.
  - Keine unnötigen Status-Anzeigen ("Status Bereit" wurde entfernt).
  - Kein Admin-Button vorhanden.

## 2. Kernfunktionen
- **Austausch (Patch)**: Ersetzen von Seriennummern in PMU-Tags innerhalb von `.MAP`-Dateien.
- **DH-Transfer**: Kopieren von Calibration-Attributen (Daylight Harvesting) von einer Quell-SN auf eine Ziel-SN.

## 3. Technischer Leitfaden (Hilfemenü) - Patrick Hartmann Standard
1. **Add Fixtures**: Wizard öffnen -> Punkt "discovering them using a USB Wireless Adapter" wählen -> Next.
2. **Netzwerk & Discover**: Netzwerk wählen und auf Discover klicken. 
   - **3-mal-Regel**: Insgesamt 3-mal auf Discover klicken (jeweils 15-20 Sek. warten).
   - Falls nicht gefunden: Andere Netzwerke prüfen oder "Scan for Networks" nutzen.
   - Wichtig: Mit dem Wireless Stick in der Nähe der Leuchte sein. Netzwerk merken, in dem die Leuchte gesehen wird.
3. **Edit Fixture (Zuweisung)**: Rechtsklick oder Doppelklick auf die Leuchte im Plan. 
   - Unten rechts auf das **Plus (+)** klicken.
   - Das korrekte Netzwerk unter **Current Network** auswählen und OK drücken.
4. **Synchronisation (Sync Map)**: Leuchte auswählen -> Sync Map klicken.
   - Reiter **Use USB Wireless Adapter only** wählen -> Next.
5. **Support (Zentrale & Technik)**:
   - **Patrick Hartmann (Service):** 0176 80536466 oder 089 9011982-36 (Festnetz, kommt am Handy an).
   - **Daniel Seehaus (Technischer Leiter):** 089 9011982-20
   - **SchahlLED Zentrale:** 089 9011982-0

## 4. Leuchten Reset (USB) - Korrekter Ablauf
1. **Verbindung**: Leuchte via USB (TTL/Micro) mit PC verbinden.
2. **Menü**: Rechtsklick auf die Leuchte -> Reiter **Advanced** -> Reiter **Reset Items** auswählen.
3. **Auswahl**: Gewünschte Positionen markieren (i.d.R. nur **"Reset to Factory Default Network"**).
4. **Durchführung**: Button **"Reset via USB"** klicken, warten bis fertig, dann Fenster schließen.
5. **Sync**: Danach mit dem **Wireless Stick** die Leuchte wieder synchronisieren (Sync Map).
6. **Zusatz (Support)**: Identisch zu Tab 1 inkl. Daniel Seehaus (-20).

## 5. No-Go's
- Den Sternenhimmel-Hintergrund entfernen.
- Den Header transparent machen.
- Den Namen "Daniel Seehaus" falsch schreiben.
- Redundanten Text im Header anzeigen.
- Admin-Buttons einfügen.