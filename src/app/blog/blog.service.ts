import { Injectable } from '@angular/core';
import blogData from './blog.data.json';
import type { ArticleMeta } from './blog.types';

const POSTS = blogData as ArticleMeta[];

@Injectable({ providedIn: 'root' })
export class BlogService {
  getAll(): ArticleMeta[] {
    return POSTS;
  }

  // Artigos de um idioma, do mais recente para o mais antigo.
  getByLang(lang: string): ArticleMeta[] {
    return POSTS
      .filter(p => p.lang === lang)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  getBySlug(slug: string): ArticleMeta | undefined {
    return POSTS.find(p => p.slug === slug);
  }

  // Todas as versões (idiomas) de um mesmo artigo — base para os links hreflang.
  getAlternates(group: string): ArticleMeta[] {
    return POSTS.filter(p => p.group === group);
  }
}
