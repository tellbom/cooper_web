import { createBrowserRouter } from 'react-router';
import { Shell } from '../components/Shell';
import Home from '../pages/Home';
import NewsList from '../pages/NewsList';
import NewsDetail from '../pages/NewsDetail';
import SearchPage from '../pages/Search';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Shell,
    children: [
      { index: true, Component: Home },
      { path: 'news', Component: NewsList },
      { path: 'news/:id', Component: NewsDetail },
      { path: 'search', Component: SearchPage },
      { path: '*', Component: Home },
    ],
  },
]);
