# SchahlLED Map-Configurator - Projektspezifikation

## 1. Visuelles Design (Aesthetics)
- **Hintergrund**: Dynamischer Sternenhimmel (`SkyBackground`) mit ~300 Sternen, Milchstraßen-Aura und vorbeiziehenden Wolken.
- **Header**: Absolut blickdicht (`#00040D`). 
  - Weißer Logo-Container (Logo-Höhe `90px`) für SchahlLED/Thorlux.
  - CC-Logo als Link zum Portal ohne Begleittext.
  - **Buttons**: "ADMIN" (für Serviceprotokolle vorbereitet) und "HILFE" (Leitfaden).
- **UI-Komponenten**: Glassmorphismus (`40px` Blur), blaue LED-Glow-Effekte, bündige Eingabefelder im "Input-Bezel" Style.

## 2. Kernfunktionen (Wiederhergestellt)
- **MAP-Parsing**: Automatisches Auslesen aller Seriennummern (SN) und Netzwerke (z.B. H16) aus `.MAP` Dateien.
- **SN-Patching (Searchable)**: 
  - Ersetzen von Seriennummern via Suchmenü. 
  - Das Suchmenü erlaubt das Filtern nach den letzten Ziffern der SN.
- **DH-Transfer (Daylight Harvesting)**: 
  - Kopieren von Kalibrierungs-Attributen (z.B. `cal_min`, `cal_max`, `lux_target`) von einer Quell-SN auf eine Ziel-SN.
  - Verhindert das manuelle Abtippen von Kalibrierwerten.

## 3. Technischer Leitfaden (Hilfemenü)
- **Standard-Workflow**: Add Fixtures -> Discover (3-mal-Regel) -> Edit Fixture (Plus-Symbol) -> Sync Map (USB Wireless).
- **Reset-Workflow**: USB-Verbindung -> Advanced -> Reset Items -> Reset via USB -> Wireless Sync.
- **Support**:
  - Patrick Hartmann (Service): Durchwahl -36 (kommt am Handy an).
  - Daniel Seehaus (Technischer Leiter): Durchwahl -20.
  - SchahlLED Zentrale: Durchwahl -0.

## 4. No-Go's
- Fehlendes Suchmenü bei der SN-Auswahl.
- Fehlende DH-Transfer Funktion.
- Redundante Texte im Header.
- Fehlender Admin-Button.
