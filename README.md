# BizBloom

This project was created for the FBLA Coding and Programming event 2025-2026 competition year and placed tenth at the international level, and first place at FBLA Maryland State Leadership Conference.

A modern web application designed to help users discover and support small businesses in their local community. Built with React, TypeScript, tRPC, and integrated with the Yelp Fusion API for real-time business data.

## Features

### Core Functionality

- **Real-time Business Search**: Search for local businesses using the Yelp Fusion API with location-based results
- **Geolocation Support**: Automatically detects user location for personalized search results
- **Advanced Filtering**: Filter businesses by category, sort by rating, review count, or distance
- **Business Details**: View comprehensive information including photos, ratings, reviews, contact info, and hours
- **User Authentication**: Secure login system with OAuth 2.0 and session-based authentication

### User Features

- **Favorites**: Save businesses to your favorites list for quick access
- **Reviews**: Write and submit reviews with star ratings and comments
- **Community Reviews**: Browse all reviews from the community with search functionality
- **Special Deals**: Browse exclusive deals and coupons from local businesses
- **Trending Businesses**: Discover what's popular based on community activity
- **Personalized Recommendations**: Get suggestions based on your favorite categories
- **Top Rated Leaderboard**: View highest-rated businesses across all categories

### Technical Features

- **Responsive Design**: Mobile-first design that works beautifully on all devices
- **Real API Integration**: No sample data - all business information comes from live Yelp API
- **Database Caching**: Efficient caching system to improve performance
- **Type-Safe API**: End-to-end type safety with tRPC and TypeScript
- **Modern UI**: Professional navy/slate color scheme with clean navigation

## Technology Stack

### Frontend
- **React 19**: Modern UI framework
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Utility-first styling
- **shadcn/ui**: High-quality UI components
- **Wouter**: Lightweight routing
- **tRPC**: Type-safe API client

### Backend
- **Node.js + Express**: Server runtime
- **tRPC 11**: Type-safe API layer
- **Drizzle ORM**: Type-safe database queries
- **MySQL/TiDB**: Relational database
- **Yelp Fusion API**: Business data source

## Project Structure

```
bizbloom/
├── client/                 # Frontend application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   │   ├── Home.tsx   # Main search page
│   │   │   ├── Favorites.tsx
│   │   │   ├── CommunityReviews.tsx
│   │   │   ├── Trending.tsx
│   │   │   └── Deals.tsx
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/           # Utilities and tRPC client
│   │   └── index.css      # Global styles
│   └── public/            # Static assets
├── server/                # Backend application
│   ├── routers.ts         # tRPC API routes
│   ├── db.ts              # Database queries
│   ├── yelp.ts            # Yelp API integration
│   └── _core/             # Framework core
├── drizzle/               # Database schema & migrations
│   └── schema.ts          # Database tables
└── README.md              # This file
```

## Database Schema

### Users Table
- Stores user authentication and profile information
- Linked to the OAuth authentication system

### Businesses Table
- Caches Yelp business data for performance
- Stores business details, ratings, location, categories

### Favorites Table
- User-business relationship for saved favorites
- Links users to their bookmarked businesses

### Reviews Table
- User-submitted reviews with ratings and comments
- Community-driven feedback system

### Deals Table
- Special offers and coupons for businesses
- Admin-managed promotional content

## API Endpoints

### Business Search
- `business.search`: Search businesses with filters
- `business.details`: Get detailed business information
- `business.yelpReviews`: Fetch Yelp reviews
- `business.autocomplete`: Search suggestions
- `business.trending`: Get trending businesses
- `business.recommendations`: Get personalized recommendations
- `business.leaderboard`: Get top-rated businesses

### Favorites
- `favorites.list`: Get user's saved businesses
- `favorites.add`: Save a business
- `favorites.remove`: Remove from favorites
- `favorites.check`: Check if business is favorited

### Reviews
- `reviews.list`: Get reviews for a business
- `reviews.getAllReviews`: Get all community reviews
- `reviews.create`: Submit a new review
- `reviews.update`: Edit your review
- `reviews.delete`: Delete your review
- `reviews.myReview`: Get your review for a business

### Deals
- `deals.list`: Get active deals
- `deals.create`: Create new deal (admin only)
- `deals.update`: Update deal (admin only)
- `deals.delete`: Delete deal (admin only)

## Setup Instructions

### Prerequisites
- Node.js 22.x or higher
- MySQL database
- Yelp API key

### Installation

1. **Extract the project files**
   ```bash
   unzip bizbloom.zip
   cd bizbloom
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   - The Yelp API key is already configured in the system
   - Database connection is automatically configured

4. **Run database migrations**
   ```bash
   pnpm db:push
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Access the application**
   - Open your browser to the provided URL
   - Allow location access for best experience

## Usage Guide

### Searching for Businesses

1. **Allow Location Access**: Click "Allow" when prompted for location access
2. **Enter Search Terms**: Type keywords like "coffee", "pizza", or "hair salon"
3. **Filter Results**: Use category and sort options to refine results
4. **View Details**: Click on any business card to see full details
5. **View Reviews**: Click on the review count to scroll to community reviews

### Managing Favorites

1. **Sign In**: Click "Sign In" in the navigation
2. **Save Businesses**: Click the heart icon on any business card (once to favorite, again to unfavorite)
3. **View Favorites**: Navigate to "Favorites" in the menu
4. **Remove Favorites**: Click the heart icon again or use the trash icon

### Writing Reviews

1. **Sign In**: Must be logged in to write reviews
2. **Open Business Details**: Click on a business card
3. **Click "Write a Review"**: Opens review dialog
4. **Rate and Comment**: Select stars and optionally add comments
5. **Submit**: Your review appears in the community reviews section

### Browsing Community Reviews

1. **Navigate to Reviews**: Click "Reviews" in the navigation
2. **Search Reviews**: Use the search bar to find specific reviews
3. **Filter by Business**: Type business names to see their reviews

### Discovering Trending Businesses

1. **Navigate to Trending**: Click "Trending" in the navigation
2. **View Trending**: See businesses with recent community activity
3. **Get Recommendations**: Sign in to see personalized suggestions
4. **Check Leaderboard**: View top-rated businesses with trophy badges

## FBLA Event Compliance

This project meets all requirements for the FBLA Coding and Programming event:

✅ **Real API Integration**: Uses Yelp Fusion API for live business data  
✅ **Location-Based Search**: Geolocation and manual location entry  
✅ **Business Information**: Displays ratings, reviews, categories, contact info  
✅ **User Features**: Favorites, reviews, and deals functionality  
✅ **Responsive Design**: Works on desktop, tablet, and mobile  
✅ **Professional UI**: Modern, aesthetically pleasing interface  
✅ **Full Functionality**: All features are working and tested  
✅ **Documentation**: Comprehensive README and code comments  

## Architecture Decisions

### Why Yelp API?
- Comprehensive business database
- Real-time data updates
- Rich business information (photos, hours, reviews)
- Free tier suitable for development

### Why tRPC?
- End-to-end type safety
- No code generation needed
- Excellent developer experience
- Automatic API documentation

### Why Database Caching?
- Reduces API calls
- Improves performance
- Enables offline features
- Supports custom features (favorites, reviews)

## Unique Features That Make This Website Stand Out

### 🔥 Trending Section
Discover what's hot in your community! The trending page shows businesses that are gaining the most attention based on recent favorites and user activity.

### ✨ Personalized Recommendations
Get smart suggestions based on your favorite businesses. Our algorithm analyzes your preferences and recommends similar businesses you'll love.

### 🏆 Top Rated Leaderboard
See the best of the best! Our leaderboard showcases the highest-rated businesses, with special trophy badges for the top 3.

### 💬 Community Reviews Hub
Browse all community reviews in one place with powerful search functionality. Find out what others are saying about any business.

### 🎯 Interactive Review Navigation
Click on any business's review count to instantly scroll to and view all community reviews for that business.

## Future Enhancements

- **Business Comparison**: Side-by-side comparison of 2-3 businesses
- **Bot Prevention**: Add reCAPTCHA to review submissions
- **Advanced Filters**: Price range, open now, distance radius
- **Social Features**: Share businesses, follow other users
- **Business Claims**: Allow business owners to manage their listings
- **Mobile App**: Native iOS and Android applications

## License

This project was created for the FBLA Coding and Programming event 2025-2026 competition year and placed tenth at the international level, and first place at FBLA Maryland State Leadership Conference.

## Credits

- **Yelp Fusion API**: Business data provider
- **shadcn/ui**: UI component library
- **Node.js + Express**: Server hosting and authentication
- **Tailwind CSS**: Styling framework

---


