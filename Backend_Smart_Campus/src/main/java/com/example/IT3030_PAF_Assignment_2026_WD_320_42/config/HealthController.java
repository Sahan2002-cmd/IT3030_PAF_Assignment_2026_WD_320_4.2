package com.example.IT3030_PAF_Assignment_2026_WD_320_42.config;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/")
    public Map<String, String> root() {
        Map<String, String> response = new LinkedHashMap<>();
        response.put("resources", "/api/resources");
        response.put("message", "Smart Campus backend is running");
        response.put("status", "UP");
        return response;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }
}
