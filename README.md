# Health Fit Bot 🏋️‍♂️🤖

A comprehensive, AI-powered personal health and fitness dashboard. This application integrates with **Google Fit** to track your daily activity, allows you to log nutrition and weight, and uses **AI Vision (Gemini 2.0)** to analyze your physique progress photos.

![Dashboard Preview](/public/window.svg)

## 🌟 Key Features

### 1. 📊 AI Health Dashboard
-   **Real-time Sync**: Connects with Google Fit to pull steps, calories, and heart points.
-   **Health Score**: Calculates a daily "Health Score" (0-100) based on your activity and nutrition stats.
-   **AI Coach**: A built-in chatbot that gives personalized advice based on your *actual* daily data.

### 2. 📸 AI Physique Analysis & Comparison
-   **Visual Progress**: Upload progress photos securely.
-   **AI Analysis**: Uses **Gemini 2.0 Vision** to analyze body fat, muscle definition, and structural balance.
-   **Transformation Mode**: Side-by-side comparison of "Before" vs "After" photos with an AI-generated text report highlighting changes.

### 3. 🍎 Nutrition & Fiber Tracking
-   **Log Meals**: specialized database for tracking Calories, Protein, Carbs, Fats, and **Fiber**.
-   **AI Lookup**: "Chat with Food" to get instant nutritional info for any meal description (e.g., "Chicken breast with rice").

### 4. ⚖️ Weight & Goals
-   **Goal Setting**: Set active weight loss or muscle gain goals.
-   **Progress Charts**: Visualize your weight trend over time.

---

## 🛠️ Tech Stack

-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
-   **Language**: TypeScript
-   **Database**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **AI**: 
    -   Google Gemini 2.0 Flash (via OpenRouter)
    -   Google Fit REST API
-   **Auth**: Supabase Auth (Google OAuth)

---

## 🚀 Getting Started

### Prerequisites
-   Node.js 18+
-   A Supabase project
-   A Google Cloud Project (for Google Fit API)
-   An OpenRouter API Key

### Installation

1.  **Clone the repo**:
    ```bash
    git clone https://github.com/praveen0006/gym-app.git
    cd gym-app
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env.local` file with the following keys:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
    
    # Google Auth (for Login & Fit)
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    
    # AI Keys
    OPENROUTER_API_KEY=your_openrouter_key
    
    # App URL (for redirects)
    NEXT_PUBLIC_BASE_URL=http://localhost:3000
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 📦 Deployment (Vercel)

1.  Push your code to GitHub.
2.  Import the project into [Vercel](https://vercel.com).
3.  Add the **Environment Variables** listed above in the Vercel Dashboard.
4.  **Important**: Update your Google Cloud Console "Authorized redirect URIs" to include your new Vercel domain (e.g., `https://your-app.vercel.app/api/fit/callback`).

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
