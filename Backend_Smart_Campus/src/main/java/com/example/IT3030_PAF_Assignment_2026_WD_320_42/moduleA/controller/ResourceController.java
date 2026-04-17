package com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.controller;

import com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.dto.ApiResponse;
import com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.dto.ResourceDTO;
import com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.model.ResourceStatus;
import com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.service.ResourceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Module A – Facilities & Assets Catalogue
 *
 * Endpoint summary
 * ─────────────────────────────────────────────────────────
 * POST   /api/resources              → Create a resource      (ADMIN)
 * GET    /api/resources              → List / search resources (ALL)
 * GET    /api/resources/{id}         → Get one resource        (ALL)
 * PUT    /api/resources/{id}         → Full update             (ADMIN)
 * PATCH  /api/resources/{id}/status  → Change status           (ADMIN)
 * DELETE /api/resources/{id}         → Delete resource         (ADMIN)
 */
@RestController
@RequestMapping("/api/resources")
@CrossOrigin(origins = "*") // React dev server; tighten in production
public class ResourceController {

    private final ResourceService resourceService;

    // Manual constructor injection (no Lombok needed)
    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    // ── POST /api/resources ───────────────────────────────────────────────────────
    // Creates a new bookable resource. Returns 201 Created.
    @PostMapping
    public ResponseEntity<ApiResponse<ResourceDTO.Response>> createResource(
            @Valid @RequestBody ResourceDTO.CreateRequest request) {

        ResourceDTO.Response created = resourceService.createResource(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Resource created successfully", created));
    }

    // ── GET /api/resources ────────────────────────────────────────────────────────
    // Returns all resources, with optional query-param filters:
    //   ?type=LAB&location=Block A&status=ACTIVE
    @GetMapping
    public ResponseEntity<ApiResponse<List<ResourceDTO.Response>>> getAllResources(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) ResourceStatus status) {

        List<ResourceDTO.Response> resources = resourceService.searchResources(type, location, status);
        return ResponseEntity.ok(ApiResponse.success("Resources fetched successfully", resources));
    }

    // ── GET /api/resources/{id} ───────────────────────────────────────────────────
    // Returns a single resource by its ID.
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ResourceDTO.Response>> getResourceById(
            @PathVariable Long id) {

        ResourceDTO.Response resource = resourceService.getResourceById(id);
        return ResponseEntity.ok(ApiResponse.success("Resource fetched successfully", resource));
    }

    // ── PUT /api/resources/{id} ───────────────────────────────────────────────────
    // Full (or partial) update of an existing resource.
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ResourceDTO.Response>> updateResource(
            @PathVariable Long id,
            @Valid @RequestBody ResourceDTO.UpdateRequest request) {

        ResourceDTO.Response updated = resourceService.updateResource(id, request);
        return ResponseEntity.ok(ApiResponse.success("Resource updated successfully", updated));
    }

    // ── PATCH /api/resources/{id}/status ─────────────────────────────────────────
    // Quickly toggle a resource's status (ACTIVE / OUT_OF_SERVICE).
    // Body: { "status": "OUT_OF_SERVICE" }
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ResourceDTO.Response>> updateStatus(
            @PathVariable Long id,
            @RequestBody StatusUpdateRequest body) {

        ResourceDTO.Response updated = resourceService.updateStatus(id, body.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Resource status updated", updated));
    }

    // ── DELETE /api/resources/{id} ────────────────────────────────────────────────
    // Permanently deletes a resource. Returns 204 No Content.
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteResource(@PathVariable Long id) {
        resourceService.deleteResource(id);
        return ResponseEntity.ok(ApiResponse.success("Resource deleted successfully"));
    }

    // ── Inner DTO for PATCH /status body ─────────────────────────────────────────
    // Explicit getter/setter — no Lombok dependency needed for this simple class.
    public static class StatusUpdateRequest {

        private ResourceStatus status;

        public StatusUpdateRequest() {}

        public ResourceStatus getStatus()              { return status; }
        public void           setStatus(ResourceStatus s) { this.status = s; }
    }
}
