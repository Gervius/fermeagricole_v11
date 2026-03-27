import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export type FlockStatus = 'draft' | 'pending' | 'active' | 'rejected';
export type DailyRecordStatus = 'pending' | 'approved' | 'rejected';

export interface Flock {
  id: number;
  name: string;
  building_id: number;
  building_name: string;
  arrival_date: string; // format YYYY-MM-DD
  initial_quantity: number;
  current_quantity: number;
  status: FlockStatus;
  notes: string | null;
  created_by: number;
  creator_name: string;
  approved_by: number | null;
  approver_name: string | null;
  approved_at: string | null;
  // permissions calculées côté backend et passées en props
  can_edit: boolean;
  can_delete: boolean;
  can_submit: boolean;
  can_approve: boolean;
  can_reject: boolean;
}

export interface Building {
  id: number;
  name: string;
  description: string | null;
  capacity: number | null;
}

export interface DailyRecord {
  id: number;
  flock_id: number;
  date: string; // YYYY-MM-DD
  losses: number;
  eggs: number;
  notes: string | null;
  status: DailyRecordStatus;
  created_by: number;
  creator_name: string;
  approved_by: number | null;
  approver_name: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  // permissions
  can_approve: boolean;
  can_reject: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
}


interface User {
    id: number;
    name: string;
    email: string;
    roles: string[]; // noms des rôles
    created_at: string;
    can_edit?: boolean;
    can_delete?: boolean;
}

interface PaginatedUsers {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
}

// Types pour les rôles
interface Role {
    id: number;
    name: string;
    permissions: string[]; // noms des permissions
    created_at: string;
    can_edit?: boolean;
    can_delete?: boolean;
}

interface PaginatedRoles {
    data: Role[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
}

// Types pour les permissions
interface Permission {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
}

interface PaginatedPermissions {
    data: Permission[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
}

// Props pour les pages
interface UsersPageProps {
    users: PaginatedUsers;
    roles: { id: number; name: string }[]; // pour les selects
    filters: { search?: string };
    flash?: { success?: string; error?: string };
}

interface RolesPageProps {
    roles: PaginatedRoles;
    permissions: { id: number; name: string }[]; // pour les selects
    filters: { search?: string };
    flash?: { success?: string; error?: string };
}

interface PermissionsPageProps {
    permissions: PaginatedPermissions;
    filters: { search?: string };
    flash?: { success?: string; error?: string };
}
