import type { ComponentType, SVGProps } from 'react';
import type { PermissionKey } from './permission';

export type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

export interface NavItem {
  id: string;
  label: string;
  to: string;
  icon?: NavIcon;
  /** Item is shown only if the user holds at least one of these permissions. */
  anyOf?: readonly PermissionKey[];
  /** Item is shown only if the user holds every one of these permissions. */
  allOf?: readonly PermissionKey[];
  /** Match the route exactly rather than by prefix (used for index routes). */
  end?: boolean;
  children?: readonly NavItem[];
}

export interface NavSection {
  id: string;
  /** Undefined for ungrouped top-level items such as Dashboard. */
  label?: string;
  items: readonly NavItem[];
}
