import { inject } from '@angular/core';
import { RenderMode, ServerRoute } from '@angular/ssr';
import { BlogService } from './blog/blog.service';

export const serverRoutes: ServerRoute[] = [
  // Pré-renderiza um HTML estático para cada slug de artigo (todos os idiomas).
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => {
      const blog = inject(BlogService);
      return blog.getAll().map(p => ({ slug: p.slug }));
    },
  },
  // Demais rotas (home, /blog) pré-renderizadas.
  { path: '**', renderMode: RenderMode.Prerender },
];
