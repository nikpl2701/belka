# Belka – kalkulator belek ciągłych

Darmowy kalkulator statyki belek jedno- i wieloprzęsłowych działający w przeglądarce.
Nic nie trzeba instalować – wystarczy otworzyć stronę.

## Co potrafi

- **Schemat statyczny**: dowolna liczba przęseł, podpory: utwierdzenie, przegubowa nieprzesuwna/przesuwna,
  koniec wolny (wspornik), **przeguby wewnętrzne** (belki Gerbera).
- **Obciążenia**: ciągłe (równomierne, trapezowe, trójkątne, na części przęsła), siły skupione, momenty skupione.
- **Grupy obciążeń**: G (stałe) i dowolna liczba grup zmiennych Q. Grupa zmienna może działać
  „osobno w przęsłach” (układ szachownicowy) – program sam wyznacza **obwiednie** M, V i reakcji.
- **Wyniki na bieżąco**: wykresy M, V i ugięć, reakcje, wartości ekstremalne, odczyt wartości w dowolnym punkcie (kursor).
- **Biblioteka przekrojów**: drewno lite (C16–C30) i klejone (GL24h–GL32h), dwuteowniki IPE, HEA, HEB (S235/S275/S355),
  przekrój własny (E, I, W).
- **Sprawdzenie nośności** (uproszczone, PN-EN):
  - drewno – zginanie i ścinanie z k_mod (klasa użytkowania, czas trwania obciążenia), k_h, ugięcie końcowe w_fin z pełzaniem (k_def, ψ₂),
  - stal – M_c,Rd (W_pl), V_pl,Rd, ugięcie,
  - przycisk **„Dobierz najmniejszy przekrój”**.
- **Zestawienie obciążeń stropu**: wybór **przeznaczenia** (q_k wg kategorii PN-EN 1991-1-1, wartości orientacyjne)
  i **rodzaju posadzki**, edytowalne warstwy (grubość × ciężar), tabela charakterystyczne / γ_F / obliczeniowe,
  przycisk „Wstaw do belki” (G + Q osobno w przęsłach, × szerokość pasma) – później belka aktualizuje się sama.
- **Żelbet** (PN-EN 1992-1-1, uproszczone): beton C16/20–C50/60, dowolne f_yk, otulina, średnica prętów;
  zbrojenie A_s w każdym przęśle i nad każdą podporą z propozycją rozstawu, A_s,min, ściskanie betonu (ξ_eff,lim),
  ścinanie V_Rd,c bez strzemion, ugięcia metodą l/d. Przykład „Płyta stropowa żelbetowa (5 przęseł)”.
- **Udostępnianie**: przycisk „Kopiuj link” zapisuje cały schemat w adresie strony. Dane zapisują się też w przeglądarce.
- **Drukuj / PDF**: wydruk wyników z zestawieniem danych.

## Konwencje znaków

- P i q dodatnie **w dół**, moment skupiony M dodatni **zgodnie z ruchem wskazówek zegara**,
- reakcje dodatnie w górę,
- moment zginający dodatni, gdy rozciąga włókna dolne – rysowany po stronie rozciąganej (w dół),
- siła tnąca dodatnia w górę, ugięcie dodatnie w dół.

## Założenia i ograniczenia

- Metoda przemieszczeń (MES), teoria Eulera–Bernoulliego, stała sztywność EI na całej długości, bez odkształceń postaciowych.
- Kombinacja SGN: γ_G·G + γ_Q·ΣQ (bez ψ₀) – po bezpiecznej stronie. SGU: wartości charakterystyczne.
- Nie sprawdza zwichrzenia (zakłada belkę stężoną bocznie), docisku na podporach, stateczności miejscowej.
- Tablice profili – wartości katalogowe, warto je zweryfikować z tablicami producenta.

**To narzędzie do nauki i szybkich szacunków – nie zastępuje projektu wykonanego przez uprawnionego konstruktora.**

## Uruchomienie lokalne

Otwórz `index.html` w przeglądarce (działa także bez serwera).

Testy solvera (wymaga Node.js):

```
node tests/solver.test.js
```

Testy porównują wyniki ze wzorami tablicowymi: belka swobodnie podparta (q, P), wspornik, belka obustronnie utwierdzona,
belka dwuprzęsłowa, obciążenie trójkątne, belka Gerbera, moment skupiony, wykrywanie mechanizmu.
