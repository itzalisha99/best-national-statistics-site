[![make.fun](https://make.fun/badge/best-national-statistics-site-20261126-0539.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539)
[![Rank](https://make.fun/badge/best-national-statistics-site-20261126-0539/itzalisha99/best-national-statistics-site/rank.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539)
[![Reward](https://make.fun/badge/best-national-statistics-site-20261126-0539/itzalisha99/best-national-statistics-site/reward.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539)

# StatAtlas — Every country, every number that matters

StatAtlas is a national statistics site that ranks and compares **115 countries across 18 real indicators** — population, GDP, life expectancy, fertility, unemployment, internet use and more — from World Bank World Development Indicators data, 1960–2024. Every figure shows its source and year.

## What it does

- **World map** — one dot per country at its real latitude and longitude, sized by population and coloured by the indicator you pick. Click any dot to open that country.
- **Top-10 rankings** for every indicator, plus a full ranking page with region filters and best/worst ordering.
- **Country profiles** — big-number cards, 1960–2024 timeline charts for population, GDP per capita and life expectancy, all 18 indicators with year and world rank, and neighbours in the same region.
- **Head-to-Head** — pick any two countries and battle them across all 18 indicators, with a win tally and verdict.
- **The atlas of surprises** — eight findings computed live from the data (longest lives, fastest-shrinking country, long life on a small income…), nothing invented.
- **Sources & method** — per-indicator WDI codes, coverage counts, vintage, and a date-check box listing exactly what was left out (e.g. CO₂, retired from the WDI API; US adult literacy, not reported).
- **Search** — find any of the 115 countries from the header.

## Data

World Bank World Development Indicators, downloaded 26 November 2026. For each indicator and country the latest non-null value from 2015–2024 is used, and its year is printed beside the figure. History (1960, 1980, 2000, 2024) is included for population, GDP per capita and life expectancy. See the Sources page in the site for the full method and the date-check box.

## Run it

No build step, no network: the site is static files under `app/`.

```sh
node serve.ts
# open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's `buildDossier`.

## License

MIT — see [LICENSE](LICENSE).
