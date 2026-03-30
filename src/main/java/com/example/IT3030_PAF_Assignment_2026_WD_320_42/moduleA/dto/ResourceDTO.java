package com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.dto;

import com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.model.ResourceStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class ResourceDTO {
     // ── Create Request ──────────────────────────────────────────────────────────
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
 
        @NotBlank(message = "Name is required")
        private String name;
 
        @NotBlank(message = "Type is required")
        // Accepted values: LECTURE_HALL, LAB, MEETING_ROOM, EQUIPMENT
        private String type;
 
        @Min(value = 1, message = "Capacity must be at least 1")
        private int capacity;
 
        @NotBlank(message = "Location is required")
        private String location;
 
        // e.g. "08:00-18:00"
        private String availabilityWindows;
    }
 
    // ── Update Request (all optional — PATCH-friendly) ──────────────────────────
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
 
        private String name;
        private String type;
 
        @Min(value = 1, message = "Capacity must be at least 1")
        private Integer capacity;   // Integer (nullable) so PATCH can omit it
 
        private String location;
        private String availabilityWindows;
        private ResourceStatus status;
    }
 
    // ── Response ────────────────────────────────────────────────────────────────
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
 
        private Long id;
        private String name;
        private String type;
        private int capacity;
        private String location;
        private String availabilityWindows;
        private ResourceStatus status;
    }
}
