import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Usar estes em vez de next/link e next/navigation: aplicam o prefixo e o URL traduzido do locale ativo
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
