'use client';

import { useParams, useRouter } from 'next/navigation';
import { articles } from '@/lib/articles';
import Background from '@/components/shared/Background';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  User, 
  Share2, 
  Bookmark,
  ChevronLeft,
  Tag
} from 'lucide-react';
import Link from 'next/link';

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const article = articles.find(a => a.id === params.id);

  if (!article) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Article Not Found</h1>
          <button 
            onClick={() => router.push('/')}
            className="text-cyan font-bold hover:underline"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-midnight">
      <Background type="landing" />
      <Header />
      
      <div className="relative z-10 pt-32 pb-24">
        {/* Progress Bar Container */}
        <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-white/5">
           <div className="h-full bg-cyan transition-all duration-300" style={{ width: '30%' }}></div>
        </div>

        <article className="container mx-auto px-6 max-w-4xl">
          {/* Back Navigation */}
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-cyan transition-colors mb-8 group font-bold text-sm"
          >
             <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan/10">
                <ChevronLeft size={18} />
             </div>
             Back to Insights
          </Link>

          {/* Header Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-cyan/70 mb-6">
            <span className="px-3 py-1 bg-cyan/10 border border-cyan/20 rounded-lg">{article.category}</span>
            <span className="flex items-center gap-1.5"><Calendar size={14} /> {article.date}</span>
            <span className="flex items-center gap-1.5"><Clock size={14} /> {article.readTime} Read</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-8 tracking-tight leading-[1.1]">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-6 mb-12 py-8 border-y border-white/5">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan to-indigo-600 p-0.5">
                  <div className="w-full h-full rounded-full bg-midnight flex items-center justify-center overflow-hidden">
                     <User className="text-cyan" size={24} />
                  </div>
               </div>
               <div>
                  <p className="text-sm font-bold text-white">{article.author}</p>
                  <p className="text-xs text-text-secondary">{article.authorRole}</p>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
               <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-cyan transition-all">
                  <Share2 size={18} />
               </button>
               <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-cyan transition-all">
                  <Bookmark size={18} />
               </button>
            </div>
          </div>

          {/* Featured Image */}
          <div className="relative aspect-[16/9] mb-16 rounded-[40px] overflow-hidden group shadow-2xl border border-white/10">
             <div className="absolute inset-0 bg-gradient-to-t from-midnight/40 to-transparent z-10"></div>
             <img 
               src={article.image} 
               alt={article.title}
               className="w-full h-full object-cover"
             />
          </div>

          {/* Article Content */}
          <div 
            className="prose prose-invert prose-lg max-w-none 
              prose-headings:text-white prose-headings:font-black prose-headings:tracking-tight
              prose-p:text-white/70 prose-p:leading-relaxed
              prose-strong:text-cyan prose-strong:font-bold
              prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-6
              mb-16
            "
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-20">
            {article.tags.map(tag => (
              <span key={tag} className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-white/50 hover:border-cyan/30 hover:text-cyan transition-all cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>

          {/* Newsletter / CTA */}
          <div className="bg-gradient-to-br from-deep-navy/80 to-slate/40 border border-white/10 rounded-[40px] p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-cyan/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
             <h3 className="text-2xl sm:text-3xl font-black text-white mb-4">Never miss an update.</h3>
             <p className="text-white/50 mb-8 max-w-md mx-auto leading-relaxed">
               Get the latest security briefings and ecosystem news delivered straight to your inbox.
             </p>
             <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-cyan transition-all"
                />
                <button className="bg-gradient-to-r from-cyan to-indigo-400 text-midnight font-black px-8 py-4 rounded-2xl hover:scale-[1.02] transition-all shadow-xl shadow-cyan/20">
                  Subscribe
                </button>
             </form>
          </div>
        </article>
      </div>

      <Footer />
    </main>
  );
}
