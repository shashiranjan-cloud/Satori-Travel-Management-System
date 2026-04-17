# 🌍 Satori – Travel & Tourism Management System

A high-performance, full-stack **Travel & Tourism Management System** built with a pure **Java HTTP Server** backend and a modern **Vanilla HTML/CSS/JS** frontend. Features role-based access control, live data APIs, dynamic card UI, and a premium dark-mode design.

---

## 🚀 How to Run Locally

### ✅ Prerequisites
- Java 17+ installed
- Maven installed (`mvn -v` to check)
- MySQL running (optional – for user registration)

---

### ▶️ Step 1 — Stop any existing Java server (if running)

```powershell
Get-Process -Name java -ErrorAction SilentlyContinue | Stop-Process -Force
```

---

### ▶️ Step 2 — Navigate to the Satori project folder

```powershell
cd "C:\Users\shash\OneDrive\Desktop\Java\Satori"
```

---

### ▶️ Step 3 — Compile and Start the Server

```powershell
mvn compile exec:java
```

> ✅ You should see: `Satori Server is running on http://localhost:8080`

---

### 🌐 Step 4 — Open in Browser

```
http://localhost:8080
```

> Use **`Ctrl + Shift + R`** for a hard refresh to clear old browser cache.

---

## 🔑 Demo Credentials

| Role   | Username | Password  | Access                          |
|--------|----------|-----------|---------------------------------|
| Admin  | `admin`  | `admin123`| Full access + Add Location      |
| User   | Any      | Any       | Browse locations, request booking|

---

## 📁 Project Structure

```
Satori/
├── src/main/java/
│   └── SatoriServer.java      ← Full backend (APIs + static file server)
├── index.html                 ← Frontend UI (Login + Dashboard)
├── style.css                  ← Premium dark/light theme styles
├── script.js                  ← Dynamic frontend logic
└── pom.xml                    ← Maven build config
```

---

## 🔧 Available API Endpoints

| Endpoint              | Description                    |
|-----------------------|--------------------------------|
| `GET /api/locations`  | Returns curated travel spots   |
| `GET /api/hotels`     | Returns luxury hotel listings  |
| `GET /api/cars`       | Returns premium car rentals    |
| `GET /api/restaurants`| Returns top restaurant picks   |
| `GET /api/hidden`     | Returns hidden gem destinations|
| `POST /api/login`     | User login                     |
| `POST /api/register`  | New user registration          |

---

## 🛑 Stop the Server

Press **`Ctrl + C`** in the terminal where Maven is running.

---

## 🔗 GitHub Repository

[https://github.com/shashiranjan-cloud/Satori-Travel-Management-System](https://github.com/shashiranjan-cloud/Satori-Travel-Management-System)