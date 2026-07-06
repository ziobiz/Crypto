import { UserRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string | null;
  organizationPath: string | null;
  customerProfileId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
