interface AssetCardProps {
  name: string
  fullName: string
  icon: React.ReactNode
}

export default function AssetCard({ name, fullName, icon }: AssetCardProps) {
  return (
    <div className="asset-card">
      <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
        {icon}
      </div>
      <h4 className="text-2xl font-bold mb-2">{name}</h4>
      <p className="text-sm text-text-secondary">{fullName}</p>
    </div>
  )
}
