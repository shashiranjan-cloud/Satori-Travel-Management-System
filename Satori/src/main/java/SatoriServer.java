import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.*;
import java.util.HashMap;
import java.util.Map;

public class SatoriServer {

    private static final int PORT = 8080;
    private static final String DB_URL = "jdbc:mysql://localhost:3306/satori";
    private static final String DB_USER = "root";
    private static final String DB_PASS = "Access@#7429";

    public static void main(String[] args) throws IOException {
        System.out.println("Starting Satori Server...");
        
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            initializeDatabase();
        } catch (ClassNotFoundException | SQLException e) {
            System.err.println("Could not initialize MySQL integration: " + e.getMessage());
        }

        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        // API Endpoints
        server.createContext("/api/login", new LoginHandler());
        server.createContext("/api/register", new RegisterHandler());
        server.createContext("/api/locations", new LocationsHandler());
        
        // Static File Handling
        server.createContext("/", new StaticFileHandler());

        server.setExecutor(null); // creates a default executor
        server.start();
        
        System.out.println("Satori Server is running on http://localhost:" + PORT);
    }

    private static void initializeDatabase() throws SQLException {
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
             Statement stmt = conn.createStatement()) {
            
            // Create Users Table
            stmt.execute("CREATE TABLE IF NOT EXISTS users (" +
                    "id INT AUTO_INCREMENT PRIMARY KEY," +
                    "username VARCHAR(255) UNIQUE NOT NULL," +
                    "password VARCHAR(255) NOT NULL," +
                    "role VARCHAR(50) DEFAULT 'USER'," + // ADMIN, USER
                    "membership VARCHAR(50) DEFAULT 'Normal'" + // Normal, Premium, Black
                    ")");

            // Seed initial users if empty
            ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM users");
            rs.next();
            if (rs.getInt(1) == 0) {
                stmt.execute("INSERT INTO users (username, password, role, membership) VALUES " +
                        "('admin', 'admin123', 'ADMIN', 'Black')," +
                        "('black', 'black123', 'USER', 'Black')," +
                        "('premium', 'premium123', 'USER', 'Premium')," +
                        "('user', 'user123', 'USER', 'Normal')");
                System.out.println("Database seeded with default accounts.");
            }
        }
    }

    // Helper to send JSON responses
    private static void sendJsonResponse(HttpExchange exchange, int statusCode, String jsonResponse) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        // add cors
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        
        byte[] response = jsonResponse.getBytes("UTF-8");
        exchange.sendResponseHeaders(statusCode, response.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response);
        }
    }

    // Helper to extract JSON from request body simply (without extra libraries)
    private static Map<String, String> parseSimpleJson(InputStream is) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(is));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
        String json = sb.toString();
        // A very basic manual JSON parser that works for simple key-value pairs {"key":"value", "key2":"value2"}
        Map<String, String> map = new HashMap<>();
        json = json.replace("{", "").replace("}", "").replace("\"", "").trim();
        if(json.isEmpty()) return map;
        String[] pairs = json.split(",");
        for (String pair : pairs) {
            String[] kv = pair.split(":");
            if (kv.length == 2) {
                map.put(kv[0].trim(), kv[1].trim());
            }
        }
        return map;
    }

    static class LoginHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "POST");
                exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            if (!"POST".equals(exchange.getRequestMethod())) {
                sendJsonResponse(exchange, 405, "{\"error\": \"Method not allowed\"}");
                return;
            }

            Map<String, String> body = parseSimpleJson(exchange.getRequestBody());
            String username = body.get("username");
            String password = body.get("password");

            try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
                 PreparedStatement pstmt = conn.prepareStatement("SELECT * FROM users WHERE username = ? AND password = ?")) {
                
                pstmt.setString(1, username);
                pstmt.setString(2, password);
                ResultSet rs = pstmt.executeQuery();
                
                if (rs.next()) {
                    String role = rs.getString("role");
                    String membership = rs.getString("membership");
                    
                    String jsonResp = String.format("{\"success\": true, \"username\": \"%s\", \"role\": \"%s\", \"membership\": \"%s\"}", 
                            username, role, membership);
                    sendJsonResponse(exchange, 200, jsonResp);
                } else {
                    sendJsonResponse(exchange, 401, "{\"success\": false, \"message\": \"Invalid credentials\"}");
                }
            } catch (SQLException e) {
                System.err.println("Database error during login: " + e.getMessage());
                sendJsonResponse(exchange, 500, "{\"error\": \"Database error\"}");
            }
        }
    }
    
    static class RegisterHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
             if ("OPTIONS".equals(exchange.getRequestMethod())) {
                exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "POST");
                exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            Map<String, String> body = parseSimpleJson(exchange.getRequestBody());
            String username = body.get("username");
            String password = body.get("password");
            
            try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
                 PreparedStatement pstmt = conn.prepareStatement("INSERT INTO users (username, password) VALUES (?, ?)")) {
                pstmt.setString(1, username);
                pstmt.setString(2, password);
                pstmt.executeUpdate();
                sendJsonResponse(exchange, 201, "{\"success\": true, \"message\": \"User registered\"}");
            } catch (SQLException e) {
                 sendJsonResponse(exchange, 400, "{\"success\": false, \"message\": \"Username exists or error\"}");
            }
        }
    }

    static class LocationsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            // Returning some simulated data.
            String simulatedData = "[" +
                "{\"id\":1, \"name\":\"Goa Beaches\", \"type\":\"Location\", \"rating\":4.8, \"price\":\"$200/night\", \"distance\":\"Local\", \"desc\":\"Sunny beaches, perfect for holidays.\" }," +
                "{\"id\":2, \"name\":\"Taj Hotel\", \"type\":\"Hotel\", \"rating\":5.0, \"price\":\"$500/night\", \"distance\":\"2 km\", \"desc\":\"Luxurious 5-star hotel.\" }," +
                "{\"id\":3, \"name\":\"Hidden Cave Cafe\", \"type\":\"Restaurant\", \"rating\":4.6, \"price\":\"$50/person\", \"distance\":\"5 km\", \"desc\":\"A secret place mostly untouched.\" }" +
            "]";
            sendJsonResponse(exchange, 200, simulatedData);
        }
    }

    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            if (path.equals("/")) {
                path = "/index.html";
            }
            
            // Map the request directly to files in the current folder where the server was launched
            Path filePath = Paths.get(".", path).normalize();
            
            if (Files.exists(filePath) && !Files.isDirectory(filePath)) {
                String contentType = "text/plain";
                if (path.endsWith(".html")) contentType = "text/html";
                else if (path.endsWith(".css")) contentType = "text/css";
                else if (path.endsWith(".js")) contentType = "application/javascript";
                else if (path.endsWith(".svg")) contentType = "image/svg+xml";

                exchange.getResponseHeaders().set("Content-Type", contentType);
                exchange.sendResponseHeaders(200, Files.size(filePath));
                try (OutputStream os = exchange.getResponseBody()) {
                    Files.copy(filePath, os);
                }
            } else {
                String notFound = "404 File Not Found";
                exchange.getResponseHeaders().set("Content-Type", "text/plain");
                exchange.sendResponseHeaders(404, notFound.length());
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(notFound.getBytes());
                }
            }
        }
    }
}
