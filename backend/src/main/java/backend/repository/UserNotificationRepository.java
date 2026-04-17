package backend.repository;

import backend.model.UserNotification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {

    List<UserNotification> findTop20ByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    @Modifying
    @Query("update UserNotification notification set notification.read = true where notification.recipient.id = :recipientId and notification.read = false")
    int markAllReadByRecipientId(@Param("recipientId") Long recipientId);
}
