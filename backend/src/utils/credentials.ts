import crypto from 'crypto';

/**
 * Generate a unique username from full name.
 * Format: firstname.lastname
 * If collision exists, appends a number.
 */
export const generateUsername = (fullName: string, existingUsernames: string[]): string => {
  const parts = fullName.trim().toLowerCase().split(/\s+/);
  const base = parts.length >= 2 ? `${parts[0]}.${parts[parts.length - 1]}` : parts[0];
  
  // Remove special characters
  let username = base.replace(/[^a-z0-9.]/g, '');
  
  if (!existingUsernames.includes(username)) {
    return username;
  }
  
  let counter = 1;
  while (existingUsernames.includes(`${username}${counter}`)) {
    counter++;
  }
  return `${username}${counter}`;
};

/**
 * Generate a secure temporary password.
 * Contains uppercase, lowercase, digits, and special characters.
 */
export const generateTempPassword = (): string => {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%&*';
  
  let password = '';
  
  // Ensure at least one of each category
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += digits[crypto.randomInt(digits.length)];
  password += special[crypto.randomInt(special.length)];
  
  // Fill remaining characters
  const allChars = uppercase + lowercase + digits + special;
  for (let i = 0; i < 7; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
};
