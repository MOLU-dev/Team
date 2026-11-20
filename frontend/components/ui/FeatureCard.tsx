interface FeatureCardProps {
  title: string
  description: string
  icon: React.ReactNode
}

export default function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="feature-card group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan to-electric-blue transform scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-left"></div>
      <div className="w-12 h-12 text-cyan mb-5">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      <p className="text-text-secondary leading-relaxed">{description}</p>
    </div>
  )
}
