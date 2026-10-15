const { origin, pathname } = window.location;

// The EVOL portal serves the app from a PHP launcher, so client routes must live in the hash there.
export const hashRouting = /\.php$/i.test(pathname);

export const routerBasename = pathname.startsWith('/Workboard/TodoList')
  ? '/Workboard/TodoList'
  : pathname.startsWith('/TodoList') ? '/TodoList' : '/';

export const appUrl = (route: string) => hashRouting
  ? `${origin}${pathname}#${route}`
  : `${origin}${routerBasename === '/' ? '' : routerBasename}${route}`;

/** The same route opened through the EVOL launcher, which signs the visitor in (or sends them to the portal login). */
export const portalLauncherUrl = () => {
  const route = hashRouting
    ? window.location.hash.slice(1)
    : pathname.slice(routerBasename === '/' ? 0 : routerBasename.length) + window.location.search;
  return `/EVOL/workboard_launch.php#${route || '/'}`;
};
