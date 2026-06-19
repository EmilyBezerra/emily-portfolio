import { Routes } from '@angular/router';
import { Home } from './pages/home/home';

export const routes: Routes = [
  // Home eager — é a página principal (LCP); mantém a landing no bundle inicial.
  { path: '', component: Home },

  // Blog lazy — isola marked/highlight.js no chunk do blog, fora do bundle inicial.
  {
    path: 'blog',
    loadComponent: () => import('./blog/blog-list/blog-list').then(m => m.BlogList),
  },
  {
    path: 'blog/:slug',
    loadComponent: () => import('./blog/blog-article/blog-article').then(m => m.BlogArticle),
  },

  { path: '**', redirectTo: '' },
];
