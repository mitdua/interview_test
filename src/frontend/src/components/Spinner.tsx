interface Props {
  label?: string
}

export default function Spinner({ label }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      {label ? <p className="text-sm text-gray-400">{label}</p> : null}
    </div>
  )
}
