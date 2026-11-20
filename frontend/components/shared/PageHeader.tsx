interface PageHeaderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function PageHeader({ title, description, icon }: PageHeaderProps) {
  return (
    <div className="mb-8 animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
      <h1 className="font-orbitron text-3xl md:text-4xl font-black mb-2 flex items-center gap-3 text-text-primary">
        <div className="w-9 h-9 text-cyan">
          {icon}
        </div>
        {title}
      </h1>
      <p className="text-text-secondary">{description}</p>
    </div>
  );
}
