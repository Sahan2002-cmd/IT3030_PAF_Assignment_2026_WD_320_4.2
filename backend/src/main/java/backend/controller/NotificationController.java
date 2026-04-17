package backend.controller;

import backend.dto.MessageResponse;
import backend.dto.UserNotificationResponse;
import backend.model.AppUser;
import backend.service.UserNotificationService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final UserNotificationService userNotificationService;

    public NotificationController(UserNotificationService userNotificationService) {
        this.userNotificationService = userNotificationService;
    }

    @GetMapping("/me")
    public ResponseEntity<List<UserNotificationResponse>> getMyNotifications(@AuthenticationPrincipal AppUser user) {
        return ResponseEntity.ok(userNotificationService.getMyNotifications(user));
    }

    @PatchMapping("/me/read-all")
    public ResponseEntity<MessageResponse> markAllRead(@AuthenticationPrincipal AppUser user) {
        userNotificationService.markAllRead(user);
        return ResponseEntity.ok(new MessageResponse("Notifications marked as read."));
    }
}
