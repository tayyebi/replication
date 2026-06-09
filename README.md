# Replication Explorer

An interactive simulator that teaches how distributed databases stay in sync — built for first-year CS students.

## Download

**[Download the latest APK](https://github.com/tayyebi/replication/releases/latest)**

Sideload on any Android device (enable *Install unknown apps* in settings).

## What is this?

Imagine one database split across 3 servers in different cities. This simulator shows you exactly what happens when:

- You save data on one server — watch it automatically copy to the others
- Two servers go offline and both get edited at the same time — see how the conflict resolves
- A server silently misses an update — see how "fingerprint" checks catch and fix the gap

All concepts are based on a real production system using:

| Concept | What it does |
|---|---|
| Hybrid Logical Clock (HLC) | Every save gets a unique timestamp that sorts correctly across all servers |
| Gossip-pull (every 7 min) | Servers periodically ask each other "what did I miss?" |
| Anti-entropy (every 11 min) | Servers compare data fingerprints (XOR checksums) to catch gaps gossip missed |
| Last-Write-Wins (LWW) | When two servers disagree, the newer timestamp wins automatically |
| Quorum writes | Critical saves require a majority of servers to confirm before committing |

## Run locally

```bash
npm install
npm run dev
```

## Rebuild the APK

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

Requires JDK 21 and Android SDK (platform-tools + build-tools 35 + platform 35).
