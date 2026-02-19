# UGCio — UGC Portfolio & Rate Hub

A native cross-platform mobile app for UGC (User-Generated Content) creators to manage their portfolio, set rates, track deals, and share their work with brands.

**Platform**: iOS & Android (with web export)  
**Framework**: Expo Router + React Native

## Getting Started

### Prerequisites

- [Node.js](https://github.com/nvm-sh/nvm) (v18+)
- [Bun](https://bun.sh/docs/installation) package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/texas0418/UGCio-App.git
cd UGCio-App

# Install dependencies
bun install

# Start development server
bun run start

# Start web preview
bun run start-web
```

### Running on Devices

**On your phone:**
1. Download [Expo Go](https://apps.apple.com/app/expo-go/id982107779) (iOS) or [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) (Android)
2. Run `bun run start` and scan the QR code

**Simulators:**
```bash
# iOS Simulator (requires Xcode)
bun run start -- --ios

# Android Emulator (requires Android Studio)
bun run start -- --android
```

## Tech Stack

- **React Native** — Cross-platform native mobile framework
- **Expo** — React Native platform and tooling
- **Expo Router** — File-based routing with web support
- **TypeScript** — Type-safe JavaScript
- **React Query** — Server state management
- **Zustand** — Client state management
- **Lucide React Native** — Icon library

## Project Structure

```
├── app/                    # App screens (Expo Router)
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── (home)/        # Home tab
│   │   ├── deals/         # Deals management
│   │   ├── portfolio/     # Portfolio showcase
│   │   ├── rates/         # Rate card
│   │   └── share/         # Sharing & analytics
│   ├── _layout.tsx        # Root layout
│   ├── onboarding.tsx     # Onboarding flow
│   ├── inquiry.tsx        # Inquiry modal
│   └── invoice.tsx        # Invoice modal
├── assets/                # Static assets (icons, images)
├── constants/             # App constants and colors
├── contexts/              # React contexts (CreatorContext)
├── mocks/                 # Mock data (templates, categories)
├── types/                 # TypeScript type definitions
├── app.json               # Expo configuration
└── package.json           # Dependencies and scripts
```

## App Features

- **Creator Portfolio** — Showcase your UGC work to brands
- **Rate Card** — Set and manage your pricing for deliverables
- **Deal Tracking** — Track brand deals and collaborations
- **Shareable Link** — Share your portfolio and rates with a single link
- **Analytics** — Track views, clicks, and inquiries
- **Invoicing** — Create and send invoices to clients
- **Inquiry Form** — Let brands reach out to you directly

## Building for Production

### App Store (iOS)

```bash
bun i -g @expo/eas-cli
eas build:configure
eas build --platform ios
eas submit --platform ios
```

### Google Play (Android)

```bash
eas build --platform android
eas submit --platform android
```

See [Expo's deployment guide](https://docs.expo.dev/submit/introduction/) for detailed instructions.

## Troubleshooting

- **App not loading?** Ensure your phone and computer are on the same WiFi. Try `bun start -- --tunnel`.
- **Build failing?** Clear cache with `bunx expo start --clear`, or reinstall deps: `rm -rf node_modules && bun install`.
- **Docs**: [Expo](https://docs.expo.dev/) · [React Native](https://reactnative.dev/docs/getting-started)
