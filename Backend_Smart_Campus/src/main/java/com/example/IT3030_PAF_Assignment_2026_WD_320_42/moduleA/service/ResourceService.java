package com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.dto.ResourceDTO;
import com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.model.Resource;
import com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.model.ResourceStatus;
import com.example.IT3030_PAF_Assignment_2026_WD_320_42.moduleA.repository.ResourceRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
@SuppressWarnings("null")
public class ResourceService {

    private final ResourceRepository resourceRepository;

    // Manual constructor injection (no Lombok needed)
    public ResourceService(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    // ── CREATE ───────────────────────────────────────────────────────────────────

    @Transactional
    public ResourceDTO.Response createResource(ResourceDTO.CreateRequest request) {
        Resource resource = new Resource();
        resource.setName(request.getName());
        resource.setType(request.getType().toUpperCase());
        resource.setCapacity(request.getCapacity());
        resource.setLocation(request.getLocation());
        resource.setAvailabilityWindows(request.getAvailabilityWindows());
        resource.setStatus(ResourceStatus.ACTIVE); // default on creation

        Resource saved = resourceRepository.save(resource);
        return toResponse(saved);
    }

    // ── READ ALL ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ResourceDTO.Response> getAllResources() {
        return resourceRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ── READ ONE ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ResourceDTO.Response getResourceById(Long id) {
        Resource resource = findOrThrow(id);
        return toResponse(resource);
    }

    // ── SEARCH / FILTER ──────────────────────────────────────────────────────────

    /**
     * Flexible search: any combination of type, location, status.
     * All parameters are optional — omit to return everything.
     */
    // @Transactional(readOnly = true)
    // public List<ResourceDTO.Response> searchResources(String type,
    //                                                   String location,
    //                                                   ResourceStatus status) {
    //     List<Resource> results;

    //     if (type != null && location != null) {
    //         results = resourceRepository.findByTypeAndLocation(type.toUpperCase(), location);
    //     } else if (type != null) {
    //         results = resourceRepository.findByType(type.toUpperCase());
    //     } else if (location != null) {
    //         results = resourceRepository.findByLocation(location);
    //     } else if (status != null) {
    //         results = resourceRepository.findByStatus(status);
    //     } else {
    //         results = resourceRepository.findAll();
    //     }

    //     // Apply status post-filter if both type/location AND status are given
    //     if (status != null && (type != null || location != null)) {
    //         final ResourceStatus finalStatus = status;
    //         results = results.stream()
    //                 .filter(r -> r.getStatus() == finalStatus)
    //                 .collect(Collectors.toList());
    //     }

    //     return results.stream().map(this::toResponse).collect(Collectors.toList());
    // }

    @Transactional(readOnly = true)
public List<ResourceDTO.Response> searchResources(String type,
                                                  String location,
                                                  ResourceStatus status) {
    List<Resource> results;

    if (type != null && location != null) {
        results = resourceRepository.findByTypeAndLocationContainingIgnoreCase(type.toUpperCase(), location);
    } else if (type != null) {
        results = resourceRepository.findByType(type.toUpperCase());
    } else if (location != null) {
        results = resourceRepository.findByLocationContainingIgnoreCase(location);
    } else if (status != null) {
        results = resourceRepository.findByStatus(status);
    } else {
        results = resourceRepository.findAll();
    }

    // Apply status post-filter if both type/location AND status are given
    if (status != null && (type != null || location != null)) {
        final ResourceStatus finalStatus = status;
        results = results.stream()
                .filter(r -> r.getStatus() == finalStatus)
                .collect(Collectors.toList());
    }

    return results.stream().map(this::toResponse).collect(Collectors.toList());
}

    // ── UPDATE (full) ─────────────────────────────────────────────────────────────

    @Transactional
    public ResourceDTO.Response updateResource(Long id, ResourceDTO.UpdateRequest request) {
        Resource resource = findOrThrow(id);

        if (request.getName() != null)                resource.setName(request.getName());
        if (request.getType() != null)                resource.setType(request.getType().toUpperCase());
        if (request.getCapacity() != null)            resource.setCapacity(request.getCapacity());
        if (request.getLocation() != null)            resource.setLocation(request.getLocation());
        if (request.getAvailabilityWindows() != null) resource.setAvailabilityWindows(request.getAvailabilityWindows());
        if (request.getStatus() != null)              resource.setStatus(request.getStatus());

        return toResponse(resourceRepository.save(resource));
    }

    // ── PATCH STATUS ──────────────────────────────────────────────────────────────

    @Transactional
    public ResourceDTO.Response updateStatus(Long id, ResourceStatus status) {
        Resource resource = findOrThrow(id);
        resource.setStatus(status);
        return toResponse(resourceRepository.save(resource));
    }

    // ── DELETE ────────────────────────────────────────────────────────────────────

    @Transactional
    public void deleteResource(Long id) {
        if (!resourceRepository.existsById(id)) {
            throw new EntityNotFoundException("Resource not found with id: " + id);
        }
        resourceRepository.deleteById(id);
    }

    // ── Private helpers ──────────────────────────────────────────────────────────

    private Resource findOrThrow(Long id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Resource not found with id: " + id));
    }

    private ResourceDTO.Response toResponse(Resource r) {
        return new ResourceDTO.Response(
                r.getId(),
                r.getName(),
                r.getType(),
                r.getCapacity(),
                r.getLocation(),
                r.getAvailabilityWindows(),
                r.getStatus()
        );
    }
}
