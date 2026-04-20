# AtmoMind (Dashboard Suhu Detector)

A Next.js application for monitoring and detecting temperature data.

## 🚀 Beginner-Friendly Setup Guide

Follow these steps to get the project up and running on your local machine.

### Prerequisites

Before you begin, ensure you have the following installed:
- **[Node.js](https://nodejs.org/)** (Version 18.17.0 or higher recommended)
- **[Git](https://git-scm.com/)**
- A code editor like **[VS Code](https://code.visualstudio.com/)**

### Step 1: Clone the Repository

First, open your terminal (Command Prompt, PowerShell, or Terminal) and clone the repository from GitHub:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL_HERE>
```
*(Note: Replace `<YOUR_GITHUB_REPOSITORY_URL_HERE>` with the actual URL of your repository. If you already have it downloaded, you can skip to Step 2)*

### Step 2: Navigate to the Project Directory

Once the repository is cloned, navigate into the project folder:

```bash
cd AtmoMind
```

### Step 3: Set up Environment Variables

Create a new environment configuration file by copying the provided example. You can do this by running the following command in your terminal:

```bash
cp .env.example .env
```

*(Note: On Windows Command Prompt, use `copy .env.example .env` instead)*

Once copied, open the new `.env` file in your code editor and fill in any required missing values (such as your Supabase keys).

### Step 4: Install Dependencies

Next, install all the necessary packages and dependencies required for the project to run. You can use `npm` (which comes installed with Node.js):

```bash
npm install
```

### Step 5: Run the Development Server

After the installation is complete, start the development server:

```bash
npm run dev
```

### Step 6: Open the App in Your Browser

Open your favorite web browser and go to:

👉 **[http://localhost:3000](http://localhost:3000)**

You should now see the AtmoMind application running! You can start editing the page by modifying `app/page.js` or `app/page.jsx`. The page will auto-update as you edit the file.

---

## 🛠️ Technologies Used

- **Framework:** [Next.js](https://nextjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Backend/Database:** [Supabase](https://supabase.com/)

---
Happy Coding! 🎉
