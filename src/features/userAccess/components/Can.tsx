import React from 'react';
import { can } from '../permissions';

interface CanProps {
  /** Current session role (admin | dispatcher | facility). */
  role: string | null | undefined;
  /** Capability key, e.g. "trips.delete". */
  perm: string;
  /** Rendered when the role lacks the capability (default: nothing). */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Permission gate — renders children only when `role` is allowed `perm`.
 * Keeps destructive / admin-only controls out of the DOM for roles that
 * shouldn't see them. Pair with route-level guards in appRoutes for defense
 * in depth.
 */
export const Can = ({ role, perm, fallback = null, children }: CanProps) => (
  <>{can(role, perm) ? children : fallback}</>
);

/** Hook form for imperative checks inside handlers/conditionals. */
export const useCan = (role: string | null | undefined) =>
  (perm: string) => can(role, perm);
