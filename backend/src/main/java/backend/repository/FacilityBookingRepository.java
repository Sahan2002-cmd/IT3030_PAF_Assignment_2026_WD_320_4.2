package backend.repository;

import backend.model.BookingStatus;
import backend.model.FacilityBooking;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FacilityBookingRepository extends JpaRepository<FacilityBooking, Long> {

    List<FacilityBooking> findByRequestedByIdOrderByCreatedAtDesc(Long requestedById);

    List<FacilityBooking> findAllByOrderByCreatedAtDesc();

    List<FacilityBooking> findByResourceIdInOrderByBookingDateAscStartTimeAsc(Collection<Long> resourceIds);

    boolean existsByResourceIdAndBookingDateAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
            Long resourceId,
            LocalDate bookingDate,
            Collection<BookingStatus> statuses,
            LocalTime endTime,
            LocalTime startTime
    );
}
