export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
}

// In-memory user store (replace with database in production)
export const users = new Map<string, User>();

export function createUser(username: string, passwordHash: string): User {
  const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const user: User = {
    id,
    username,
    passwordHash,
    createdAt: new Date(),
  };
  users.set(id, user);
  return user;
}

export function findUserByUsername(username: string): User | undefined {
  for (const user of users.values()) {
    if (user.username === username) {
      return user;
    }
  }
  return undefined;
}

export function findUserById(id: string): User | undefined {
  return users.get(id);
}

