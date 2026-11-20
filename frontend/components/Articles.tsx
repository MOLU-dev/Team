'use client';

import { ArrowRight, BookOpen, Clock, Tag } from 'lucide-react';
import Link from 'next/link';

import { articles } from '@/lib/articles';

export default function Articles() {
  return (
    <section className="py-24 relative overflow-hidden" id="insights">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 -right-1/4 w-96 h-96 bg-cyan/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -left-1/4 w-96 h-96 bg-purple/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan/10 border border-cyan/20 rounded-full text-cyan text-xs font-bold uppercase tracking-widest mb-4">
              <BookOpen size={14} />
              <span>Insights & News</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
              Stay ahead in the <br />
              <span className="bg-gradient-to-r from-cyan to-indigo-400 bg-clip-text text-transparent">evolving crypto space.</span>
            </h2>
            <p className="text-white/60 text-lg leading-relaxed font-medium">
              Deep dives, tutorials, and ecosystem updates from the BitSilo core team.
            </p>
          </div>
          <Link 
            href="/insights" 
            className="group flex items-center gap-2 text-cyan font-bold hover:text-white transition-colors"
          >
            Visit Resource Hub
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <div 
              key={article.id}
              className="group relative flex flex-col bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-500 hover:-translate-y-2 shadow-2xl hover:shadow-cyan/10"
            >
              {/* Image Container */}
              <div className="relative h-64 overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${article.gradient} opacity-20 mix-blend-overlay group-hover:opacity-40 transition-opacity duration-700 z-10`}></div>
                <img 
                  src={article.image} 
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4 z-20">
                  <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-white/90 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Tag size={10} className="text-cyan" />
                    {article.category}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 flex-1 flex flex-col">
                <div className="flex items-center gap-4 text-white/40 text-[10px] font-bold uppercase tracking-widest mb-4">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    {article.readTime}
                  </div>
                  <span>•</span>
                  <div>{article.date}</div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-cyan transition-colors leading-snug">
                  {article.title}
                </h3>
                
                <p className="text-white/50 text-sm leading-relaxed mb-8 line-clamp-3">
                  {article.excerpt}
                </p>

                <div className="mt-auto pt-6 border-t border-white/5">
                  <Link 
                    href={`/blog/${article.id}`}
                    className="flex items-center gap-2 text-white font-bold text-sm group/btn"
                  >
                    Read Story
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover/btn:bg-cyan group-hover/btn:text-midnight transition-all duration-300">
                      <ArrowRight size={14} />
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
