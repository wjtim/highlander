
# 🏆 WJTIM HIGHLANDER

This is a simple web application that allows users to submit their names, which will be displayed on the site along with a live countdown showing how long the name has been displayed. The name can be replaced by another user, and a leaderboard tracks the top 5 names with the longest display times.

## 🚀 Features

- **Live Countdown**: Shows how long the current name has been displayed.
- **Real-Time Updates**: The leaderboard updates in real-time, reflecting changes across all users.
- **Leaderboard**: Tracks the top 5 names with the longest display times.
- **Profanity Filter**: Ensures that submitted names are appropriate.
- **Animations**: Smooth fade-in and fade-out animations on leaderboard updates.
- **No Empty Names**: Prevents empty name submissions and caps name length at 15 characters.

## 🛠️ Tech Stack

- **React**: Frontend library used to build the user interface.
- **Firebase**: Backend services for database, real-time updates, and hosting.

## 📦 Getting Started

### Prerequisites

- **Node.js**: Ensure you have Node.js installed. You can download it from [Node.js](https://nodejs.org/).
- **Firebase Account**: Set up a Firebase project at [Firebase Console](https://console.firebase.google.com/).

### Installation

1. **Clone the repository**:

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Firebase**:
   - Create a Firebase project from the Firebase Console.
   - In your project settings, add a new web app to obtain the Firebase configuration.
   - Create a `.env.local` file in the root directory of your project and add your Firebase configuration:

     ```bash
     REACT_APP_FIREBASE_API_KEY=your_api_key
     REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
     REACT_APP_FIREBASE_PROJECT_ID=your_project_id
     REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
     REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     REACT_APP_FIREBASE_APP_ID=your_app_id
     ```

4. **Run the application**:
   ```bash
   npm start
   ```
   The app will be available at `http://localhost:3000`.

## 🐛 Troubleshooting

- **Timer Starts in Negative**: Ensure the timer is set using the correct timestamp from Firebase.
- **Firebase Errors**: Double-check your Firebase configuration and rules.

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

## ✨ Acknowledgments

- Built with ❤️ using React and Firebase.

