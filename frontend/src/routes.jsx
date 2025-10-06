import React, { Suspense, Fragment, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Loader from './components/Loader/Loader';
import AdminLayout from './layouts/AdminLayout';

import { BASE_URL } from './config/constant';


const AuthGuard = ({ children }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const isAuthenticated = !!localStorage.getItem('userEmail');
  console.log("isAuthenticated Check", isAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return children;
};


const GuestGuard = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('userEmail');
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};


const ChurchIdGuard = ({ children }) => {
  const location = useLocation();
  const churchId = localStorage.getItem('churchId');
  const queryParams = new URLSearchParams(location.search);
  const urlChurchId = queryParams.get('churchId');

  // Check if the current route matches /join/:broadcastId or /sermon/join/:broadcastId
  const isJoinRoute = location.pathname.match(/^\/(join|sermon\/join)\/[^/]+$/);

  if (isJoinRoute) {
    return children;
  }

  if (!urlChurchId) {
    if (churchId) {
      queryParams.set('churchId', churchId);
      return <Navigate to={`${location.pathname}?${queryParams.toString()}`} replace />;
    } else {
      console.warn('Missing churchId, redirecting to /joinlive');
      return <Navigate to="/joinlive" replace />;
    }
  }

  return children;
};


const JoinLiveGuard = ({ children }) => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const churchId = queryParams.get('churchId');
  const userId = queryParams.get('userId');

  const isValid = churchId && churchId.length > 0 && userId && userId.length > 0;

  if (!isValid) {
    console.warn('Missing or invalid churchId or userId:', { churchId, userId });
    return <Navigate to="/" replace />;
  }

  return React.cloneElement(children, { churchId, userId });
};


const QueryIdGuard = ({ children }) => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const userId = queryParams.get('userId');
  const churchId = queryParams.get('churchId');

  const isValid = userId && userId.length > 0 && churchId && churchId.length > 0;

  if (!isValid) {
    console.warn('Missing or invalid userId/churchId:', { userId, churchId });
    return <Navigate to="/" replace />;
  }

  return React.cloneElement(children, { userId, churchId });
};


export const renderRoutes = (routes = []) => (
  <Suspense fallback={<Loader />}>
    <Routes>
      {routes.map((route, i) => {
        const Guard = route.guard || Fragment;
        const Layout = route.layout || Fragment;
        const Element = route.element;

        return (
          <Route
            key={i}
            path={route.path}
            element={
              <Guard>
                <Layout>{route.routes ? renderRoutes(route.routes) : <Element props={true} />}</Layout>
              </Guard>
            }
          />
        );
      })}
    </Routes>
  </Suspense>
);

const routes = [
  {
    exact: 'true',
    guard: GuestGuard,
    path: '/',
    element: lazy(() => import('./views/auth/SignIn1'))
  },

  {
    exact: 'true',
    path: '/privacy-policy',
    element: lazy(() => import('./views/PrivacyPolicy/PrivacyPolicy'))
  },
  {
    exact: 'true',
    path: '/golive',
    guard: QueryIdGuard,
    element: lazy(() => import('./views/GoLives/MobileGoLive'))
  },
  {
    exact: 'true',
    path: '/joinlive',
    guard: JoinLiveGuard,
    element: lazy(() => import('./views/JoinLiveSermons/MobileJoinLive'))
  },
  {
    exact: 'true',
    path: '/sermon/join/:broadcastId',
    guard: ChurchIdGuard,
    element: lazy(() => import('./views/JoinLiveSermons/MobileJoinLive'))
  },
  {
    path: '*',
    guard: AuthGuard,
    layout: AdminLayout,
    routes: [
      {

        exact: 'true',
        path: '/dashboard',
        element: lazy(() => import('./views/dashboard'))
      },
      {
        exact: 'true',

        path: '/basic/button',
        element: lazy(() => import('./views/ui-elements/basic/BasicButton'))
      },
      {
        exact: 'true',

        path: '/basic/badges',
        element: lazy(() => import('./views/ui-elements/basic/BasicBadges'))
      },
      {
        exact: 'true',

        path: '/basic/breadcrumb-paging',
        element: lazy(() => import('./views/ui-elements/basic/BasicBreadcrumb'))
      },
      {
        exact: 'true',

        path: '/basic/collapse',
        element: lazy(() => import('./views/ui-elements/basic/BasicCollapse'))
      },
      {
        exact: 'true',

        path: '/basic/tabs-pills',
        element: lazy(() => import('./views/ui-elements/basic/BasicTabsPills'))
      },
      {
        exact: 'true',

        path: '/basic/typography',
        element: lazy(() => import('./views/ui-elements/basic/BasicTypography'))
      },
      {
        exact: 'true',
        path: '/profile',

        element: lazy(() => import('./views/Profile/Profile'))
      },
      {
        exact: 'true',

        path: '/administrators',
        element: lazy(() => import('./views/Administrators/Administrator'))
      },
      {
        exact: 'true',

        path: '/church',
        element: lazy(() => import('./views/ManageChurch/ManageChurch'))
      },
      {
        exact: 'true',

        path: '/events',
        element: lazy(() => import('./views/ManageEvents/ManageEvent'))
      },
      {
        exact: 'true',

        path: '/analytics',
        element: lazy(() => import('./views/AnalyticsMenu/Analytics'))
      },
      {
        exact: 'true',

        path: '/user/events',
        element: lazy(() => import('./views/userEvents/userEvents'))
      },
      {
        exact: 'true',

        path: '/admin/events',
        element: lazy(() => import('./views/adminEvents/adminEvents'))
      },
      {
        exact: true,
        path: '/real-time-sermon-translation',
        element: lazy(() => import('./views/GoLives/GoLive'))
      },
      {
        exact: 'true',

        path: '/today-sermons',
        element: lazy(() => import('./views/dashboard/index.jsx'))
      },
      {
        exact: 'true',
        path: '/live-sermon-translator',
        guard: ChurchIdGuard,
        element: lazy(() => import('./views/JoinLiveSermons/JoinLiveSermon'))
      },
      {
        exact: 'true',
        path: '/join/:broadcastId',
        guard: ChurchIdGuard,
        element: lazy(() => import('./views/JoinLiveSermons/JoinLiveSermon'))
      },

      {
        exact: true,
        path: '/churches',
        element: lazy(() => import('./views/charts/Church')),
      },
      {
        exact: 'true',

        path: '/staff-members',
        element: lazy(() => import('./views/StaffMembers/StaffMember'))
      },
      {
        exact: 'true',

        path: '/users',
        element: lazy(() => import('./views/Users/User'))
      },
      {
        exact: 'true',

        path: '/privacy-policy',
        element: lazy(() => import('./views/PrivacyPolicy/PrivacyPolicy'))
      },
      {
        exact: 'true',

        path: '/request-delete',
        element: lazy(() => import('./views/AccountManage/delete'))
      },

      {
        exact: 'true',
        path: '/feedback',
        element: lazy(() => import('./views/Feedback/Feedback'))
      },

      {
        exact: 'true',
        path: '/all-feedback',
        element: lazy(() => import('./views/Feedback/AdminFeedback'))
      },




      {
        path: '*',
        exact: 'true',
        element: () => <Navigate to={BASE_URL} />
      }
    ]
  }
];

export default routes;
