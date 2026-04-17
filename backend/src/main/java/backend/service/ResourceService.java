package backend.service;

import backend.dto.CreateResourceRequest;
import backend.dto.MessageResponse;
import backend.dto.BookingSummaryResponse;
import backend.dto.ResourceResponse;
import backend.model.AppUser;
import backend.model.FacilityResource;
import backend.model.ResourceStatus;
import backend.model.ResourceType;
import backend.model.Role;
import backend.repository.FacilityResourceRepository;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ResourceService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("hh:mm a");

    private final FacilityResourceRepository facilityResourceRepository;
    private final BookingService bookingService;

    public ResourceService(FacilityResourceRepository facilityResourceRepository, BookingService bookingService) {
        this.facilityResourceRepository = facilityResourceRepository;
        this.bookingService = bookingService;
    }

    @Transactional
    public ResourceResponse createResource(CreateResourceRequest request, AppUser user) {
        requireAdmin(user);

        FacilityResource resource = new FacilityResource();
        applyResourceDetails(resource, request);

        FacilityResource saved = facilityResourceRepository.save(resource);
        return toResponse(saved);
    }

    @Transactional
    public ResourceResponse updateResource(Long resourceId, CreateResourceRequest request, AppUser user) {
        requireAdmin(user);
        FacilityResource resource = facilityResourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));

        applyResourceDetails(resource, request);
        return toResponse(resource);
    }

    @Transactional
    public MessageResponse deleteResource(Long resourceId, AppUser user) {
        requireAdmin(user);
        FacilityResource resource = facilityResourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));

        facilityResourceRepository.delete(resource);
        return new MessageResponse("Resource deleted successfully.");
    }

    @Transactional(readOnly = true)
    public List<ResourceResponse> findResources(
            String type,
            Integer minCapacity,
            String location,
            String status
    ) {
        ResourceType requestedType = StringUtils.hasText(type) ? parseType(type) : null;
        ResourceStatus requestedStatus = StringUtils.hasText(status) ? parseStatus(status) : null;
        String requestedLocation = StringUtils.hasText(location) ? location.trim().toLowerCase(Locale.ROOT) : null;
        List<FacilityResource> matchingResources = facilityResourceRepository.findAll().stream()
                .filter(resource -> requestedType == null || resource.getType() == requestedType)
                .filter(resource -> minCapacity == null || resource.getCapacity() >= minCapacity)
                .filter(resource -> requestedStatus == null || resource.getStatus() == requestedStatus)
                .filter(resource -> requestedLocation == null
                        || resource.getLocation().toLowerCase(Locale.ROOT).contains(requestedLocation))
                .sorted((left, right) -> right.getCreatedAt().compareTo(left.getCreatedAt()))
                .toList();

        Map<Long, List<BookingSummaryResponse>> bookingSummariesByResourceId =
                bookingService.getBookingSummariesByResourceIdsGrouped(
                        matchingResources.stream().map(FacilityResource::getId).toList()
                );

        return matchingResources.stream()
                .map(resource -> toResponse(resource, bookingSummariesByResourceId.getOrDefault(resource.getId(), List.of())))
                .toList();
    }

    private void requireAdmin(AppUser user) {
        if (user.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access is required");
        }
    }

    private ResourceType parseType(String value) {
        try {
            return ResourceType.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid resource type. Use LECTURE_HALL, LAB, MEETING_ROOM, PROJECTOR, CAMERA, or EQUIPMENT"
            );
        }
    }

    private ResourceStatus parseStatus(String value) {
        try {
            return ResourceStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid resource status. Use ACTIVE or OUT_OF_SERVICE"
            );
        }
    }

    private ResourceResponse toResponse(FacilityResource resource) {
        return toResponse(resource, List.of());
    }

    private ResourceResponse toResponse(FacilityResource resource, List<BookingSummaryResponse> bookings) {
        return new ResourceResponse(
                resource.getId(),
                resource.getName(),
                resource.getType().name(),
                resource.getCapacity(),
                resource.getLocation(),
                resource.getAvailabilityWindows(),
                resource.getAvailableFromDate(),
                resource.getAvailableToDate(),
                resource.getAvailableFromTime(),
                resource.getAvailableToTime(),
                resource.getStatus().name(),
                resource.getDescription(),
                resource.getImageDataUrl(),
                bookings,
                resource.getCreatedAt(),
                resource.getUpdatedAt()
        );
    }

    private void applyResourceDetails(FacilityResource resource, CreateResourceRequest request) {
        resource.setName(request.name().trim());
        resource.setType(parseType(request.type()));
        resource.setCapacity(request.capacity());
        resource.setLocation(request.location().trim());
        validateAvailabilityWindow(request);
        resource.setAvailableFromDate(request.availableFromDate());
        resource.setAvailableToDate(request.availableToDate());
        resource.setAvailableFromTime(request.availableFromTime());
        resource.setAvailableToTime(request.availableToTime());
        resource.setAvailabilityWindows(formatAvailabilityWindow(request));
        resource.setStatus(parseStatus(request.status()));
        resource.setDescription(StringUtils.hasText(request.description()) ? request.description().trim() : null);
        resource.setImageDataUrl(validateImageDataUrl(request.imageDataUrl()));
    }

    private void validateAvailabilityWindow(CreateResourceRequest request) {
        if (request.availableToDate().isBefore(request.availableFromDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Available to date must be on or after available from date");
        }

        boolean sameDay = request.availableFromDate().isEqual(request.availableToDate());
        if (sameDay && !request.availableToTime().isAfter(request.availableFromTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Available to time must be after available from time on the same day");
        }
    }

    private String validateImageDataUrl(String imageDataUrl) {
        if (!StringUtils.hasText(imageDataUrl)) {
            return null;
        }

        String trimmed = imageDataUrl.trim();
        if (!trimmed.startsWith("data:image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource image must be an image data URL");
        }
        return trimmed;
    }

    private String formatAvailabilityWindow(CreateResourceRequest request) {
        return request.availableFromDate().format(DATE_FORMATTER)
                + " to "
                + request.availableToDate().format(DATE_FORMATTER)
                + ", "
                + request.availableFromTime().format(TIME_FORMATTER)
                + " - "
                + request.availableToTime().format(TIME_FORMATTER);
    }
}
