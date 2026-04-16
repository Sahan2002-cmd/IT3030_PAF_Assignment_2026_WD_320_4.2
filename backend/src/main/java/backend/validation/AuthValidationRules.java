package backend.validation;

import java.util.regex.Pattern;

public final class AuthValidationRules {

    public static final String MOBILE_NUMBER_REGEX = "^\\d{10}$";
    public static final String MOBILE_NUMBER_MESSAGE = "Mobile number must be exactly 10 digits";
    public static final String PASSWORD_REGEX = "^(?=.*[a-z])(?=.*[A-Z]).{6,}$";
    public static final String PASSWORD_MESSAGE =
            "Password must be at least 6 characters and include uppercase and lowercase letters";

    private static final Pattern MOBILE_NUMBER_PATTERN = Pattern.compile(MOBILE_NUMBER_REGEX);
    private static final Pattern PASSWORD_PATTERN = Pattern.compile(PASSWORD_REGEX);

    private AuthValidationRules() {
    }

    public static boolean isValidMobileNumber(String value) {
        return value != null && MOBILE_NUMBER_PATTERN.matcher(value).matches();
    }

    public static boolean isValidPassword(String value) {
        return value != null && PASSWORD_PATTERN.matcher(value).matches();
    }
}
