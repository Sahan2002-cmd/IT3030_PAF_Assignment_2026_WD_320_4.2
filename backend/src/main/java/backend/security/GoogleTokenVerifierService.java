package backend.security;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GoogleTokenVerifierService {

    private static final Pattern JSON_STRING_FIELD =
            Pattern.compile("\"%s\"\\s*:\\s*\"([^\"]*)\"");

    private final HttpClient httpClient;
    private final String googleClientId;

    public GoogleTokenVerifierService(
            @Value("${app.google.client-id:}") String googleClientId
    ) {
        this.httpClient = HttpClient.newHttpClient();
        this.googleClientId = googleClientId == null ? "" : googleClientId.trim();
    }

    public GoogleUserInfo verify(String credential) {
        if (googleClientId.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Google sign-in is not configured on the server"
            );
        }

        try {
            String encodedCredential = URLEncoder.encode(credential, StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodedCredential))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Google sign-in credential");
            }

            String payload = response.body();
            String audience = extractStringField(payload, "aud");
            boolean emailVerified = Boolean.parseBoolean(extractStringField(payload, "email_verified"));
            String email = extractStringField(payload, "email").trim().toLowerCase();
            String name = extractStringField(payload, "name").trim();
            String subject = extractStringField(payload, "sub").trim();

            if (!googleClientId.equals(audience)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google sign-in audience mismatch");
            }

            if (!emailVerified || email.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google account email is not verified");
            }

            if (subject.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google sign-in response is incomplete");
            }

            String resolvedName = name.isBlank() ? email.substring(0, email.indexOf('@')) : name;
            return new GoogleUserInfo(subject, email, resolvedName);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Google sign-in verification failed");
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Google sign-in verification failed");
        }
    }

    private String extractStringField(String json, String fieldName) {
        Pattern pattern = Pattern.compile(String.format(JSON_STRING_FIELD.pattern(), fieldName));
        Matcher matcher = pattern.matcher(json);
        if (!matcher.find()) {
            return "";
        }
        return matcher.group(1);
    }

    public record GoogleUserInfo(String subject, String email, String name) {
    }
}
