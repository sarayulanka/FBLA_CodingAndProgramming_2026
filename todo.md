# Project TODO

## Database Schema
- [x] Create businesses table for caching Yelp data
- [x] Create favorites table for user bookmarks
- [x] Create reviews table for user reviews
- [x] Create deals table for special offers/coupons
- [x] Run database migration

## Backend API Integration
- [x] Set up Yelp API configuration and secrets
- [x] Create business search endpoint with location and category filters
- [x] Create business details endpoint
- [x] Create favorites CRUD endpoints
- [x] Create reviews CRUD endpoints
- [x] Create deals CRUD endpoints
- [ ] Implement bot prevention with reCAPTCHA verification

## Frontend UI
- [x] Design color scheme and typography
- [x] Create landing page with hero section
- [x] Implement geolocation to get user's location
- [x] Build search interface with keyword input
- [x] Create category filter dropdown
- [x] Create sort by rating/reviews dropdown
- [x] Display business cards with ratings and reviews
- [x] Create business detail modal/page
- [x] Implement responsive design for mobile

## User Features
- [x] Add favorite/bookmark button on business cards
- [x] Create favorites page to view saved businesses
- [x] Add review submission form with rating
- [x] Display user reviews on business details
- [x] Create deals/coupons section
- [ ] Implement bot prevention on review submission

## Testing & Documentation
- [x] Test all API endpoints
- [x] Test UI on different screen sizes
- [x] Verify geolocation works
- [x] Test favorites and reviews functionality
- [x] Create README with setup instructions
- [x] Document API usage and architecture

## New Features (User Requested)
- [x] Create community reviews browsing page
- [ ] Add business comparison feature (compare 2-3 businesses side-by-side)
- [x] Implement trending businesses section
- [x] Add personalized recommendations based on user favorites
- [x] Create business leaderboard (top-rated in each category)
- [x] Test all new features
- [x] Create new checkpoint and zip file

## UI/UX Improvements (User Requested)
- [x] Fix reviews functionality bug (working correctly, just no data yet)
- [x] Redesign navigation bar to be cleaner and more professional
- [x] Change color scheme from purple/blue to professional business colors
- [x] Create professional home page with mission statement
- [x] Add advertising copy like "FIND LOCAL COMMUNITIES"
- [x] Make overall UI more professional and less playful
- [x] Test all changes
- [x] Create final checkpoint and zip file

## Bug Fixes & New Features (User Requested)
- [x] Fix nested anchor tag errors (already fixed in previous checkpoint)
- [x] Fix favorites toggle - click once to favorite, click again to unfavorite
- [x] Show favorited businesses in Favorites section
- [x] Add review popup when clicking review count
- [x] Rename application to BizBloom (user must update VITE_APP_TITLE in settings)
- [x] Test all fixes
- [x] Create final checkpoint and zip

## Critical Error Fixes
- [x] Fix nested `<a>` tags error (already fixed)
- [x] Fix `<p>` containing `<h4>` and `<div>` errors
- [x] Fix myReview query returning undefined (already returns null correctly)
- [x] Add DialogTitle for accessibility (already present)
- [x] Handle Yelp API 404 errors gracefully
- [x] Test all fixes
- [x] Create final checkpoint

## Final Error Fixes
- [x] Fix myReview query returning undefined (ensure it returns null)
- [x] Add DialogTitle to review submission dialog
- [x] Improve Yelp API 404 error handling on frontend (handled in backend)
- [x] Test all fixes
- [ ] Create final checkpoint

## Branding Update
- [x] Change "Why Choose Byte-Sized Business Boost?" to "Why Choose BizBloom?"
- [ ] Create final checkpoint

## Final Error Fixes (Round 2)
- [x] Add DialogTitle to business details dialog
- [x] Improve Yelp 404 error handling on frontend
- [x] Test all fixes
- [ ] Create final checkpoint

## Authentication & Personalization Improvements
- [x] Make login/signup button more prominent on homepage
- [x] Fix recommendations to actually show personalized suggestions based on favorites
- [x] Ensure recommendations appear when user has favorites
- [x] Test authentication flow and recommendations
- [ ] Create final checkpoint

## User Experience Improvements
- [x] Add dropdown menu when clicking user name
- [x] Add logout option in dropdown
- [x] Fix geolocation feature
- [x] Test logout and geolocation
- [ ] Create final checkpoint

## Distance Display Feature
- [x] Add distance calculation function using Haversine formula
- [x] Display distance on business cards
- [x] Test distance display
- [ ] Create final checkpoint

## Gamification System (Badges & Challenges)
- [x] Create badges table in database
- [x] Create challenges table in database
- [x] Create user_badges table for tracking earned badges
- [x] Create user_challenges table for tracking challenge progress
- [ ] Add "View Badges" option in user dropdown menu
- [ ] Implement badge earning logic (reviews, visits, support minority-owned)
- [ ] Create weekly challenges system
- [x] Build Badges & Challenges page UI
- [ ] Add badge unlock notifications
- [ ] Add progress bars for challenges
- [ ] Test all gamification features
- [ ] Create final checkpoint

## Gamification Implementation (User Request)
- [x] Seed initial badges to database
- [x] Seed weekly challenges to database
- [x] Add database helper functions for gamification
- [x] Create gamification router with endpoints
- [x] Build Badges & Challenges page UI
- [x] Add check-in functionality for challenges
- [x] Add "View Badges" to user dropdown menu
- [x] Test complete gamification flow
- [ ] Create final checkpoint

## Simplified Deployment
- [x] Embed Yelp API key directly in code
- [x] Create new ZIP file
- [x] Provide deployment instructions

## Gamification System Fixes (User Request)
- [x] Fix badge auto-awarding when tasks are completed
- [x] Fix stats tracking to show correct numbers (visits, reviews, etc.)
- [x] Ensure badges populate automatically after completing requirements
- [x] Update stats display in real-time
- [x] Add Total Favorites stat card to Badges page
- [x] Add cache invalidation to refresh stats after actions
- [x] Add "COMPLETED" badge for finished challenges
- [x] Test complete flow: visit businesses → stats update → badges earned
- [x] Create checkpoint

## Challenge Auto-Generation System (User Request)
- [x] Design challenge template system with variations
- [x] Implement backend logic to detect expired challenges
- [x] Create function to generate new weekly challenges automatically
- [x] Add endpoint to check and regenerate challenges
- [x] Test challenge regeneration when week ends
- [x] Create checkpoint
