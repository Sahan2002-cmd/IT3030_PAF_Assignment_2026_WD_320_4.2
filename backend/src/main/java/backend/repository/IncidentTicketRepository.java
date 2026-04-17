package backend.repository;

import backend.model.IncidentTicket;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IncidentTicketRepository extends JpaRepository<IncidentTicket, Long> {

    @EntityGraph(attributePaths = {"createdBy", "assignedTechnician", "comments", "comments.author"})
    List<IncidentTicket> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"createdBy", "assignedTechnician", "comments", "comments.author"})
    List<IncidentTicket> findByCreatedByIdOrderByCreatedAtDesc(Long createdById);

    @EntityGraph(attributePaths = {"createdBy", "assignedTechnician", "comments", "comments.author"})
    List<IncidentTicket> findByAssignedTechnicianIdOrderByCreatedAtDesc(Long assignedTechnicianId);
}
