package com.illuminate.qr.dto;

public class LoginResponse {
    private String token;
    private String type = "Bearer";
    private String username;
    private String name;
    private String role;

    public LoginResponse() {}

    public LoginResponse(String token, String username, String name, String role) {
        this.token = token;
        this.username = username;
        this.name = name;
        this.role = role;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
