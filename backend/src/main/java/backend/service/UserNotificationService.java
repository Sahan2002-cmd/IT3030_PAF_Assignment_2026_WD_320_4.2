package backend.service;

import backend.dto.UserNotificationResponse;
import backend.model.AppUser;
import backend.model.Role;
import backend.model.UserNotification;
import backend.repository.AppUserRepository;
import backend.repository.UserNotificationRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class UserNotificationService {

    private final UserNotificationRepository userNotificationRepository;
    private final AppUserRepository appUserRepository;

    public UserNotificationService(
            UserNotificationRepository userNotificationRepository,
            AppUserRepository appUserRepository
    ) {
        this.userNotificationRepository = userNotificationRepository;
        this.appUserRepository = appUserRepository;
    }

    @Transactional
    public void notifyUser(AppUser recipient, String title, String message, String type) {
        if (recipient == null || !StringUtils.hasText(title) || !StringUtils.hasText(message)) {
            return;
        }

        UserNotification notification = new UserNotification();
        notification.setRecipient(recipient);
        notification.setTitle(title.trim());
        notification.setMessage(message.trim());
        notification.setType(StringUtils.hasText(type) ? type.trim().toLowerCase() : "general");
        notification.setRead(false);
        userNotificationRepository.save(notification);
    }

    @Transactional
    public void notifyAdmins(String title, String message, String type) {
        appUserRepository.findByRoleOrderByCreatedAtAsc(Role.ADMIN)
                .forEach(admin -> notifyUser(admin, title, message, type));
    }

    @Transactional(readOnly = true)
    public List<UserNotificationResponse> getMyNotifications(AppUser user) {
        return userNotificationRepository.findTop20ByRecipientIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(notification -> new UserNotificationResponse(
                        notification.getId(),
                        notification.getTitle(),
                        notification.getMessage(),
                        notification.getType(),
                        notification.isRead(),
                        notification.getCreatedAt()
                ))
                .toList();
    }

    @Transactional
    public void markAllRead(AppUser user) {
        userNotificationRepository.markAllReadByRecipientId(user.getId());
    }
}
