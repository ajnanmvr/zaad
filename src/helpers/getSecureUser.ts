/**
 * Secure server-side user retrieval helper
 * This should be used in server actions to get authenticated user info
 * Never trust user data passed from the frontend for tracking purposes
 */

import { UserRepository } from "@/repositories/user.repository";
import { requireAuth, requirePartner } from "@/actions/_auth";

interface SecureUser {
  id: string;
  username: string;
  fullname: string;
  role: string;
}

/**
 * Get authenticated user from secure server-side auth
 * Used for tracking createdBy, editedBy, etc.
 */
export async function getSecureUser(): Promise<SecureUser> {
  const claims = await requireAuth();
  const user = await UserRepository.findOne({ _id: claims.id, published: true });
  
  if (!user) {
    throw new Error("Authenticated user not found");
  }

  return {
    id: claims.id,
    username: claims.username,
    fullname: (user as any).fullname || "",
    role: claims.role,
  };
}

/**
 * Get authenticated user with partner role requirement
 */
export async function getSecurePartnerUser(): Promise<SecureUser> {
  const claims = await requirePartner();
  const user = await UserRepository.findOne({ _id: claims.id, published: true });
  
  if (!user) {
    throw new Error("Authenticated user not found");
  }

  return {
    id: claims.id,
    username: claims.username,
    fullname: (user as any).fullname || "",
    role: claims.role,
  };
}
