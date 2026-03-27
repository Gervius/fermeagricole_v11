import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
    accountingReview,
    buildingsIndex,
    dashboard,
    generation,
    invoicesIndex,
    journalVouchersIndex,
    recipesIndex,
    reportsBalance,
    stockMovementsIndex,
    treatmentsIndex,
    feedProductionsIndex
} from '@/routes';
import { NavItem, type NavGroup } from '@/types';
import { Link } from '@inertiajs/react';
import {
    Bird,
    BookOpen,
    Calculator,
    ClipboardList,
    Coins,
    Egg,
    FileText,
    Folder,
    LayoutGrid,
    Package,
    Receipt,
    Settings,
    ShoppingCart,
    Stethoscope,
    UsersRound
} from 'lucide-react';
import { partnersIndex } from '@/routes';
import AppLogo from './app-logo';

const navGroups: NavGroup[] = [
    {
        title: 'Général',
        items: [
            {
                title: 'Tableau de bord',
                href: dashboard(),
                icon: LayoutGrid,
            },
        ],
    },
    {
        title: 'Production',
        items: [
            {
                title: 'Lots de poules',
                href: generation(),
                icon: Bird,
            },
            {
                title: 'Soins vétérinaires',
                href: treatmentsIndex(),
                icon: Stethoscope,
            },
        ],
    },
    {
        title: 'Alimentation',
        items: [
            {
                title: 'Mouvements de stock',
                href: stockMovementsIndex(),
                icon: ShoppingCart,
            },
            {
                title: "Recettes d'aliments",
                href: recipesIndex(),
                icon: BookOpen,
            },
            {
                title: 'Productions',
                href: feedProductionsIndex(),
                icon: Package,
            },
        ],
    },
    {
        title: 'Finance & Compta',
        items: [
            {
                title: 'Tiers & Partenaires',
                href: partnersIndex(),
                icon: UsersRound,
            },
            {
                title: 'Facturation Unifiée',
                href: invoicesIndex(),
                icon: Receipt,
            },
            {
                title: 'Révision Comptable',
                href: accountingReview(),
                icon: ClipboardList,
            },
            {
                title: 'Journaux (Vouchers)',
                href: journalVouchersIndex(),
                icon: FileText,
            },
            {
                title: 'Balance Générale',
                href: reportsBalance(),
                icon: Calculator,
            },
        ],
    },
    {
        title: 'Administration',
        items: [
            {
                title: 'Paramétrages (Hub)',
                href: buildingsIndex(),
                icon: Settings,
            },
        ],
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain groups={navGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
