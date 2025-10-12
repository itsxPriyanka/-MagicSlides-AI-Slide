**AI PPT Generator 🎨✨**

An AI-powered PowerPoint presentation generator using Google Gemini AI and React.

📁 Project Structure
```
ai-ppt-chat/
├── client/                        # Frontend (React + Vite)
│   ├── src/
│   │   ├── App.jsx                # Main React component
│   │   ├── App.css                # Application styles
│   │   ├── pptGenerator.js        # PowerPoint generation logic
│   │   ├── main.jsx               # React entry point
│   │   └── index.css              # Global styles
│   └── package.json               # Frontend dependencies
│
└── server/                        # Backend (Node.js + Express)
    ├── server.js                  # Express server + Gemini API integration
    ├── .env                       # Environment variables (create this)
    └── package.json               # Backend dependencies
```

**🔧 Setup Instructions**
1. Install Dependencies

**Backend:**

cd server
npm install


**Frontend:**

cd ../client
npm install

2. Environment Variables

Backend .env file (server/.env):

# Google Gemini API Key
GEMINI_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY

# Backend server port (optional, default: 4000)
PORT=4000


⚠️ Replace YOUR_GOOGLE_GEMINI_API_KEY with your own key from Google AI Studio
.

Frontend: No .env file required — frontend calls backend API only.

3. Run the Application

Terminal 1 – Start Backend:

cd server
node server.js/ npm start 


Should show: Server running on http://localhost:4000

Terminal 2 – Start Frontend:

cd client
npm run dev


Should show: Local: http://localhost:5173/

Open your browser: http://localhost:5173


**🎯 Features / What's Included**

AI-powered slide generation

4 color themes: Blue, Purple, Green, Orange

Edit slides before download

Bold text formatting using (*text*)

Smart filename generation

Maximum 4 bullets per slide

Automatic markdown cleaning


**Dependencies:**

Frontend: React 18, Vite, Axios, PptxGenJS, React Icons

Backend: Express, Axios, Dotenv, CORS


**🐛 Common Issues**

Port 4000 already in use:

npx kill-port 4000


**API Key not working:**

Ensure .env is in the server/ folder

Verify the API key is correct

Restart backend after adding the key

