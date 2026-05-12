import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';

/**
 * Bidirectional mapping between URL paths and the legacy `activeNav` keys
 * used throughout `App.tsx`. Keep this list in sync with the sidebar / nav
 * buttons. New routes only need an entry here.
 */
const NAV_TO_PATH: Record<string, string> = {
  dashboard: '/',
  invoices: '/invoices',
  'export-invoices': '/export',
  contracts: '/contracts',
  'invoice-types': '/invoice-types',
  approval: '/approval',
  legal: '/legal',
  accounting: '/accounting',
  sinvoice: '/sinvoice',
  reports: '/reports',
  settings: '/settings',
  profile: '/profile',
  notifications: '/notifications',
  'screen-map': '/screen-map',
  'wireframe-nav': '/wireframe-nav',
  'signature-showcase': '/signature-showcase',
  onboarding: '/onboarding',
  signature: '/signature',
  more: '/more',
};

const PATH_TO_NAV: Record<string, string> = Object.fromEntries(
  Object.entries(NAV_TO_PATH).map(([nav, path]) => [path, nav])
);

function deriveActiveNav(pathname: string): string {
  // Strip trailing slash (except root).
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (PATH_TO_NAV[p]) return PATH_TO_NAV[p];
  // Match by longest prefix for nested routes like /invoices/:id.
  let best = 'dashboard';
  let bestLen = 0;
  for (const [path, nav] of Object.entries(PATH_TO_NAV)) {
    if (path === '/') continue;
    if ((p === path || p.startsWith(path + '/')) && path.length > bestLen) {
      best = nav;
      bestLen = path.length;
    }
  }
  return best;
}

/**
 * Drop-in replacement for `useState<string>('dashboard')` that keeps the
 * URL in sync with the legacy `activeNav` state.
 *
 *   const [activeNav, setActiveNav] = useActiveNav();
 *
 * `setActiveNav('invoices')` issues `navigate('/invoices')`, and reloading
 * `/invoices` puts the app back into the invoices branch.
 */
export function useActiveNav(): [string, (nav: string) => void] {
  const location = useLocation();
  const navigate = useNavigate();

  const activeNav = useMemo(() => deriveActiveNav(location.pathname), [location.pathname]);

  const setActiveNav = useCallback(
    (nav: string) => {
      const target = NAV_TO_PATH[nav] ?? '/';
      if (target !== location.pathname) navigate(target);
    },
    [navigate, location.pathname]
  );

  return [activeNav, setActiveNav];
}

export { NAV_TO_PATH };
