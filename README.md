# UGCio — UGC Portfolio & Rate Hub

A native cross-platform mobile app for UGC (User-Generated Content) creators to manage their portfolio, set rates, track deals, and share their work with brands.

**Platform**: iOS & Android (with web export)  
**Framework**: Expo Router + React Native

## Getting Started

### Prerequisites

- [Node.js](https://github.com/nvm-sh/nvm) (v18+)
- [Bun](https://bun.sh/docs/installation) package manager
- [Xcode](https://developer.apple.com/xcode/) 15+ (for iOS builds)
- [CocoaPods](https://cocoapods.org/) (`sudo gem install cocoapods`)
- Active [Apple Developer Program](https://developer.apple.com/programs/) membership

### Installation

```bash
git clone https://github.com/texas0418/UGCio-App.git
cd UGCio-App

# Install JS dependencies
bun install

# Generate the native iOS project
npx expo prebuild --platform ios

# Install CocoaPods dependencies
cd ios && pod install && cd ..
```

### Development

```bash
# Start Metro bundler
bun run start

# Run on iOS Simulator (press "i" in terminal)
bun run start

# Start web preview
bun run start-web
```

**On your phone with Expo Go:**
1. Download [Expo Go](https://apps.apple.com/app/expo-go/id982107779)
2. Run `bun run start` and scan the QR code

## Building for App Store (Xcode)

### 1. Generate / Update Native Project

Whenever you add new Expo plugins or update `app.json`, regenerate the native project:

```bash
npx expo prebuild --platform ios --clean
cd ios && pod install && cd ..
```

### 2. Open in Xcode

```bash
open ios/ugcportfolioratehub.xcworkspace
```

> **Important:** Always open the `.xcworkspace` file, not `.xcodeproj`.

### 3. Configure Signing

1. Select the project in Xcode's navigator
2. Go to **Signing & Capabilities**
3. Select your **Team** (Apple Developer account)
4. Ensure **Bundle Identifier** is `com.ugcio.app`
5. Let Xcode manage signing automatically, or configure manually

### 4. Archive & Submit

1. Set the build target to **Any iOS Device (arm64)** (not a simulator)
2. **Product → Archive**
3. Once archived, the **Organizer** window opens
4. Select your archive → **Distribute App**
5. Choose **App Store Connect** → **Upload**
6. Follow the prompts to upload to App Store Connect

### 5. In App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app → **TestFlight** or **App Store** tab
3. Fill in metadata, screenshots, and description
4. Submit for review

### Version Bumps

Update version numbers in `app.json` before each submission:

```json
{
  "expo": {
    "version": "1.0.1",
    "ios": {
      "buildNumber": "2"
    }
  }
}
```

Then regenerate: `npx expo prebuild --platform ios --clean && cd ios && pod install && cd ..`

## Tech Stack

- **React Native** — Cross-platform native mobile framework
- **Expo** — React Native platform and tooling (prebuild/bare workflow)
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
├── ios/                   # Native iOS project (Xcode)
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

## Troubleshooting

- **Pod install fails?** Run `cd ios && pod repo update && pod install && cd ..`
- **Build errors after plugin changes?** Run `npx expo prebuild --platform ios --clean` to regenerate
- **Signing issues?** Ensure your Apple Developer membership is active and your bundle ID matches in both Xcode and App Store Connect
- **Metro not connecting?** Clear cache with `bunx expo start --clear`
- **Docs**: [Expo Bare Workflow](https://docs.expo.dev/bare/overview/) · [React Native](https://reactnative.dev/docs/getting-started)
