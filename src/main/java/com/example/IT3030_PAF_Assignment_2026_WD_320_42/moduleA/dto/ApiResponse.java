package com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
 
/**
 * Generic API response envelope.
 *
 * <pre>
 * {
 *   "success": true,
 *   "message": "Resource created successfully",
 *   "data": { ... }
 * }
 * </pre>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor

public class ApiResponse <T>{
    
    private boolean success;
    private String  message;
    private T       data;
 
    // ── Convenience factories ────────────────────────────────────────────────────
 
    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }
 
    public static <T> ApiResponse<T> success(String message) {
        return new ApiResponse<>(true, message, null);
    }
 
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }
}
