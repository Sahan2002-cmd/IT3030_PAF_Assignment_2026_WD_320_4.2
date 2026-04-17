package backend.service;

import backend.dto.BookingDecisionRequest;
import backend.dto.BookingResponse;
import backend.dto.BookingSummaryResponse;
import backend.dto.CreateBookingRequest;
import backend.dto.MessageResponse;
import backend.model.AppUser;
import backend.model.BookingStatus;
import backend.model.FacilityBooking;
import backend.model.FacilityResource;
import backend.model.ResourceStatus;
import backend.model.Role;
import backend.repository.FacilityBookingRepository;
import backend.repository.FacilityResourceRepository;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BookingService {

    private static final EnumSet<BookingStatus> CAPACITY_BLOCKING_STATUSES = EnumSet.of(BookingStatus.PENDING, BookingStatus.APPROVED);

    private final FacilityBookingRepository facilityBookingRepository;
    private final FacilityResourceRepository facilityResourceRepository;

    public BookingService(
            FacilityBookingRepository facilityBookingRepository,
            FacilityResourceRepository facilityResourceRepository
    ) {
        this.facilityBookingRepository = facilityBookingRepository;
        this.facilityResourceRepository = facilityResourceRepository;
    }

    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request, AppUser user) {
        if (user.getRole() != Role.STUDENT) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only students can request bookings");
        }

        FacilityResource resource = facilityResourceRepository.findById(request.resourceId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));

        validateBookingRequest(request, resource);
        int requestedAttendees = normalizeAttendeeCount(request.expectedAttendees());
        ensureCapacityAvailable(resource, request.bookingDate(), request.startTime(), request.endTime(), requestedAttendees, null);

        FacilityBooking booking = new FacilityBooking();
        booking.setResource(resource);
        booking.setRequestedBy(user);
        booking.setBookingDate(request.bookingDate());
        booking.setStartTime(request.startTime());
        booking.setEndTime(request.endTime());
        booking.setPurpose(request.purpose().trim());
        booking.setExpectedAttendees(requestedAttendees);
        booking.setStatus(BookingStatus.PENDING);

        FacilityBooking saved = facilityBookingRepository.save(booking);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings(AppUser user) {
        if (user.getRole() != Role.STUDENT) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only students can view their own bookings");
        }

        return facilityBookingRepository.findByRequestedByIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings(
            AppUser user,
            String status,
            Long resourceId,
            String requester
    ) {
        requireAdmin(user);

        BookingStatus requestedStatus = StringUtils.hasText(status) ? parseStatus(status) : null;
        String requesterQuery = StringUtils.hasText(requester) ? requester.trim().toLowerCase() : null;

        return facilityBookingRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(booking -> requestedStatus == null || booking.getStatus() == requestedStatus)
                .filter(booking -> resourceId == null || booking.getResource().getId().equals(resourceId))
                .filter(booking -> requesterQuery == null
                        || booking.getRequestedBy().getName().toLowerCase().contains(requesterQuery)
                        || booking.getRequestedBy().getEmail().toLowerCase().contains(requesterQuery))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public BookingResponse approveBooking(Long bookingId, BookingDecisionRequest request, AppUser user) {
        requireAdmin(user);
        FacilityBooking booking = findBooking(bookingId);
        ensurePending(booking);
        ensureCapacityAvailable(
                booking.getResource(),
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                normalizeAttendeeCount(booking.getExpectedAttendees()),
                booking.getId()
        );
        booking.setStatus(BookingStatus.APPROVED);
        booking.setAdminReason(normalizeReason(request));
        return toResponse(booking);
    }

    @Transactional
    public BookingResponse rejectBooking(Long bookingId, BookingDecisionRequest request, AppUser user) {
        requireAdmin(user);
        FacilityBooking booking = findBooking(bookingId);
        ensurePending(booking);

        if (!StringUtils.hasText(request.reason())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A rejection reason is required");
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setAdminReason(request.reason().trim());
        return toResponse(booking);
    }

    @Transactional
    public BookingResponse cancelBooking(Long bookingId, BookingDecisionRequest request, AppUser user) {
        FacilityBooking booking = findBooking(bookingId);

        boolean isOwner = booking.getRequestedBy().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to cancel this booking");
        }

        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only approved bookings can be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setAdminReason(normalizeReason(request));
        return toResponse(booking);
    }

    @Transactional(readOnly = true)
    public Map<Long, List<BookingSummaryResponse>> getBookingSummariesByResourceIds(Collection<Long> resourceIds) {
        if (resourceIds == null || resourceIds.isEmpty()) {
            return Map.of();
        }

        return facilityBookingRepository.findByResourceIdInOrderByBookingDateAscStartTimeAsc(resourceIds).stream()
                .map(this::toSummary)
                .collect(Collectors.groupingBy(BookingSummaryResponse::id, Collectors.toList()));
    }

    @Transactional(readOnly = true)
    public Map<Long, List<BookingSummaryResponse>> getBookingSummariesByResourceIdsGrouped(Collection<Long> resourceIds) {
        if (resourceIds == null || resourceIds.isEmpty()) {
            return Map.of();
        }

        return facilityBookingRepository.findByResourceIdInOrderByBookingDateAscStartTimeAsc(resourceIds).stream()
                .collect(Collectors.groupingBy(
                        booking -> booking.getResource().getId(),
                        Collectors.mapping(this::toSummary, Collectors.toList())
                ));
    }

    private void validateBookingRequest(CreateBookingRequest request, FacilityResource resource) {
        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This resource is currently out of service");
        }

        if (request.bookingDate().isBefore(resource.getAvailableFromDate())
                || request.bookingDate().isAfter(resource.getAvailableToDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Booking date is outside the resource availability window");
        }

        if (!request.startTime().isBefore(request.endTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time");
        }

        long minutes = Duration.between(request.startTime(), request.endTime()).toMinutes();
        if (minutes > 180) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A student can book one resource for a maximum of 3 hours");
        }

        if (request.startTime().isBefore(resource.getAvailableFromTime())
                || request.endTime().isAfter(resource.getAvailableToTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Booking time must stay within the resource time window");
        }

        if (request.expectedAttendees() != null && request.expectedAttendees() > resource.getCapacity()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Expected attendees cannot exceed the resource capacity");
        }
    }

    private void ensureCapacityAvailable(
            FacilityResource resource,
            LocalDate bookingDate,
            LocalTime startTime,
            LocalTime endTime,
            int requestedAttendees,
            Long ignoredBookingId
    ) {
        int reservedAttendees = facilityBookingRepository.findByResourceIdInOrderByBookingDateAscStartTimeAsc(List.of(resource.getId())).stream()
                .filter(booking -> ignoredBookingId == null || !booking.getId().equals(ignoredBookingId))
                .filter(booking -> booking.getBookingDate().isEqual(bookingDate))
                .filter(booking -> CAPACITY_BLOCKING_STATUSES.contains(booking.getStatus()))
                .filter(booking -> startTime.isBefore(booking.getEndTime()) && endTime.isAfter(booking.getStartTime()))
                .map(FacilityBooking::getExpectedAttendees)
                .map(this::normalizeAttendeeCount)
                .reduce(0, Integer::sum);

        int remainingCapacity = resource.getCapacity() - reservedAttendees;
        if (requestedAttendees > remainingCapacity) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    remainingCapacity > 0
                            ? "Only " + remainingCapacity + " capacity left for that time slot"
                            : "No capacity left for that time slot"
            );
        }
    }

    private int normalizeAttendeeCount(Integer expectedAttendees) {
        return expectedAttendees != null ? expectedAttendees : 1;
    }

    private void requireAdmin(AppUser user) {
        if (user.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access is required");
        }
    }

    private BookingStatus parseStatus(String value) {
        try {
            return BookingStatus.valueOf(value.trim().toUpperCase());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid booking status");
        }
    }

    private FacilityBooking findBooking(Long bookingId) {
        return facilityBookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
    }

    private void ensurePending(FacilityBooking booking) {
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending bookings can be reviewed");
        }
    }

    private String normalizeReason(BookingDecisionRequest request) {
        if (request == null || !StringUtils.hasText(request.reason())) {
            return null;
        }
        return request.reason().trim();
    }

    private BookingSummaryResponse toSummary(FacilityBooking booking) {
        return new BookingSummaryResponse(
                booking.getId(),
                booking.getRequestedBy().getId(),
                booking.getRequestedBy().getName(),
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getPurpose(),
                booking.getExpectedAttendees(),
                booking.getStatus().name(),
                booking.getAdminReason()
        );
    }

    private BookingResponse toResponse(FacilityBooking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getResource().getId(),
                booking.getResource().getName(),
                booking.getResource().getType().name(),
                booking.getResource().getLocation(),
                booking.getRequestedBy().getId(),
                booking.getRequestedBy().getName(),
                booking.getRequestedBy().getEmail(),
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getPurpose(),
                booking.getExpectedAttendees(),
                booking.getStatus().name(),
                booking.getAdminReason(),
                booking.getCreatedAt(),
                booking.getUpdatedAt()
        );
    }
}
