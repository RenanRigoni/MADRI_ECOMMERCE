import Image from 'next/image'

export default function ProductGallery({ name }: { name: string }) {
  return (
    <div className="relative aspect-[3/4] w-full bg-[#FAF6F0] border border-[#E8E0D4] flex items-center justify-center overflow-hidden">
      <Image
        src="/logos/MADRI.svg"
        alt=""
        width={72}
        height={72}
        className="w-16 h-16 md:w-[72px] md:h-[72px] opacity-[0.12]"
      />
      <span className="sr-only">Foto de {name} em breve</span>
    </div>
  )
}
