# Kanohi Collector 🛡️

*A Bionicle “Kanohi” mask collector game*
[Live Demo](https://kanohi-collector.vercel.app) 🚀

Welcome! This project is a passive BIONICLE **Kanohi mask collection game**—in the spirit of classic Bionicle fandom and geekery.([GitHub][2])

---

## 📌 What It Does

Kanohi Collector is a web app that lets users:

* Discover masks via packs
* Track what you’ve collected
* Apply buffs and level up with duplicates
* Persist state (DB + cookies)
* View your collection and settings

It combines a **game-like loop** with **collection tracking mechanics** for pure geek joy.

---

## 📸 Assets

View my mask pixel art in `public/masks`

![Claim Rare Mask](public/gifs/claim-rare-mask.gif)
![Open Bonus Pack](public/gifs/open-bonus-pack.gif)


---

## 🚀 Features

* 🔄 Pack opening with rarity math + pity system
* 📊 Discovery rerolls (todo)
* ⚡ Buffs and mask effects (todo)
* 💾 Persistent storage with Prisma & Postgres
* 🧪 Test coverage with Vitest

---

## 🧠 Architecture Overview

* **Next.js** frontend & server logic
* **Prisma** + PostgreSQL for state
* **Vitest** for core logic tests
* Client cookie fallback (for WebGL flavor)

---

## 🛠️ Quick Start

1. **Clone the repo**

   ```bash
   git clone https://github.com/noahcalvo/kanohi-collector.git
   cd kanohi-collector
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env.local
   # Add your Clerk auth keys + DATABASE_URL
   # Gather these from vercel env vars
   ```

4. **Generate & migrate DB**

   ```bash
   yarn prisma:generate
   yarn prisma:migrate dev
   ```

5. **Run dev server**

   ```bash
   yarn dev
   ```

6. **Browse 👉**

   ```
   http://localhost:3000
   ```

---

## 🧪 Testing

Vitest is configured to cover the critical game mechanics.

```bash
npm test
```

Focus for now: pack logic, rarity distribution, equip constraints. More tests (stats, concurrency guards) coming. ([GitHub][5])

---

## 📦 API Endpoints (App Router)

| Route                       | Method | Purpose                     |
| --------------------------- | ------ | --------------------------- |
| `/api/packs/status`         | GET    | Pack readiness & pity state |
| `/api/packs/open`           | POST   | Open a daily pack           |
| `/api/me`                   | GET    | User summary                |
| `/api/mask/{mask_id}/equip` | POST   | Equip mask                  |

These give you programmatic access to core interactions for UI or automation.

---

## 🧠 How It Works (Quick Concept)

* **Pity**: Guarantee a rare after X pulls
* **Discovery rerolls**: Roll up to N times for different stuff
* **Duplicates**: Turn into levels/buffs
* **Cooldowns**: Timed pack openings

Think of it like a collector’s gacha with purpose.

---

## 🤝 Contributing

Love Bionicle? 🧱 Got ideas?

We welcome contributions! Please:

1. Fork the repo
2. Create a feature branch
3. Add tests for new behavior
4. Open a PR with clear motivation

👉 *Even small grammar fixes help engagement.*

---

## 🧾 License

MIT © Noah Calvo

---

If you want, I can also generate sample GIFs + badges to embed or automatically hook up GitHub Actions for readme freshness.

[1]: https://docs.github.com/en/repositories/creating-and-managing-repositories/best-practices-for-repositories?utm_source=chatgpt.com "Best practices for repositories - GitHub Docs"
[2]: https://github.com/noahcalvo?utm_source=chatgpt.com "noahcalvo (Noah Calvo) · GitHub"
[3]: https://blog.beautifulmarkdown.com/10-github-readme-examples-that-get-stars?utm_source=chatgpt.com "10 GitHub README Examples That Get Stars: A Developer's Guide to ..."
[4]: https://kanohicollector.com/?utm_source=chatgpt.com "Kanohi Collector | Track your masks!"
[5]: https://github.com/noahcalvo/kanohi-collector "GitHub - noahcalvo/kanohi-collector: A Bionicle \"Kanohi\" mask collector game"
[6]: https://www.freecodecamp.org/news/how-to-write-a-good-readme-file/?utm_source=chatgpt.com "How to Write a Good README File for Your GitHub Project"
[7]: https://github.com/matiassingers/awesome-readme?utm_source=chatgpt.com "GitHub - matiassingers/awesome-readme: A curated list of awesome READMEs"
