package com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.dto;

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
public class ApiResponse<T> {

    private boolean success;
    private String  message;
    private T       data;

    // ── Constructors ─────────────────────────────────────────────────────────────

    public ApiResponse() {}

    public ApiResponse(boolean success, String message, T data) {
        this.success = success;
        this.message = message;
        this.data    = data;
    }

    // ── Getters & Setters ────────────────────────────────────────────────────────

    public boolean isSuccess()           { return success; }
    public void    setSuccess(boolean s) { this.success = s; }

    public String  getMessage()          { return message; }
    public void    setMessage(String m)  { this.message = m; }

    public T       getData()             { return data; }
    public void    setData(T d)          { this.data = d; }

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
