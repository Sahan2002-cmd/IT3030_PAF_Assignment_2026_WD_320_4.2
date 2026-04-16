package backend.config;

import backend.model.AppUser;
import backend.model.Role;
import backend.repository.AppUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminSeeder {

    @Bean
    public CommandLineRunner seedAdmin(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.name}") String adminName,
            @Value("${app.admin.email}") String adminEmail,
            @Value("${app.admin.password}") String adminPassword
    ) {
        return args -> {
            if (appUserRepository.existsByEmailIgnoreCase(adminEmail)) {
                return;
            }

            AppUser admin = new AppUser(
                    adminName,
                    adminEmail.toLowerCase(),
                    passwordEncoder.encode(adminPassword),
                    Role.ADMIN,
                    true
            );
            appUserRepository.save(admin);
        };
    }
}
