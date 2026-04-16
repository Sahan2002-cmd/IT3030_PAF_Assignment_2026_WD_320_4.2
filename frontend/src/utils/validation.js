export const MOBILE_NUMBER_REGEX = /^\d{10}$/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/;

export const MOBILE_NUMBER_RULE_TEXT = "Mobile number must be exactly 10 digits.";
export const PASSWORD_RULE_TEXT =
  "Password must be at least 6 characters and include uppercase and lowercase letters.";

export function isValidMobileNumber(value) {
  return MOBILE_NUMBER_REGEX.test(value);
}

export function isValidPassword(value) {
  return PASSWORD_REGEX.test(value);
}
