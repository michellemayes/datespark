# Date Idea Generator

A smart date planning app that helps you discover and save unique date ideas based on your location, preferences, and budget.

## Features

- **Location-Based Search**: Find date venues near you using Google Places API
- **Smart Filtering**: Filter by activity type (restaurants, museums, parks, etc.), budget, and duration
- **AI-Powered Suggestions**: Get personalized date itineraries with multiple venues
- **Save Favorites**: Bookmark your favorite date ideas for later
- **Interactive Maps**: View venue locations on an integrated map
- **User Authentication**: Create an account to save and manage your date ideas across devices

## Technologies

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn-ui components
- **Backend**: Lovable Cloud (Supabase)
- **APIs**: Google Maps & Places API
- **State Management**: TanStack Query
- **Authentication**: Supabase Auth

## Getting Started

### Prerequisites

- Node.js & npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Google Maps API key
- Lovable Cloud account (or Supabase project)

### Installation

1. Clone the repository:
```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. Install dependencies:
```sh
npm install
```

3. Configure environment variables (automatically set up with Lovable Cloud)

4. Start the development server:
```sh
npm run dev
```

## Usage

1. **Enter Your Location**: Start by entering your city or address
2. **Set Your Preferences**: Choose activity type, budget range, and date duration
3. **Get Suggestions**: Click "Find Date Ideas" to generate personalized recommendations
4. **Save Favorites**: Click the heart icon to save ideas you like
5. **View Saved Ideas**: Access your saved dates anytime from the navigation menu

## Project Structure

- `/src/pages` - Main application pages (Index, SavedIdeas, Auth)
- `/src/components` - Reusable UI components
- `/src/hooks` - Custom React hooks
- `/src/integrations/supabase` - Backend integration
- `/supabase/functions` - Edge functions for API integrations and AI processing

## Deployment

Deploy your app via Lovable:
1. Open your [Lovable project](https://lovable.dev/projects/4204fc7f-f64a-44f3-a3df-fd0e553382da)
2. Click Share → Publish

## Custom Domain

Connect a custom domain via Project > Settings > Domains in Lovable.

Learn more: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain)

## License

Built with [Lovable](https://lovable.dev)
