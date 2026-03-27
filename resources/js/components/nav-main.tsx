import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { resolveUrl } from '@/lib/utils';
import { type NavGroup } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ groups = [] }: { groups: NavGroup[] }) {
    const page = usePage();

    return (
        <>
            {groups.map((group) => (
                <SidebarGroup key={group.title} className="px-2 py-0 mt-4 first:mt-0">
                    <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                    <SidebarMenu>
                        {group.items.map((item) => {
                            const itemUrl = resolveUrl(item.href);
                            // Extraction du path pour une comparaison correcte (sans query params et sans host)
                            const currentPath = page.url.split('?')[0];
                            let expectedPath = itemUrl;
                            try {
                                expectedPath = new URL(itemUrl).pathname;
                            } catch (e) {
                                // Si URL relative
                            }

                            // isActive est vrai si le path exact match ou s'il commence par ce path suivi d'un slash (pour les sous-vues de ressources /edit /show)
                            const isActive = currentPath === expectedPath || currentPath.startsWith(expectedPath === '/' ? '/#ne_jamais_matcher#' : expectedPath + '/');

                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive}
                                        tooltip={{ children: item.title }}
                                    >
                                        <Link href={item.href} prefetch>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    );
}
