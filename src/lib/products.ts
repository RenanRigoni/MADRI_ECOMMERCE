export type FragranceFamily =
  | 'floral'
  | 'amadeirado'
  | 'citrico'
  | 'oriental'
  | 'frutal'
  | 'aromatico'
  | 'gourmand'
  | 'musk'

export type Intensity = 'leve' | 'moderada' | 'marcante'
export type Profile = 'feminino' | 'masculino' | 'unissex'
export type Occasion = 'dia' | 'noite' | 'trabalho' | 'encontros' | 'especial' | 'presente'

export interface Product {
  id: string
  slug: string
  name: string
  volume: string
  price: number
  discount?: number
  imageUrl?: string
  isNew?: boolean
  isBestSeller?: boolean
  isGiftable?: boolean
  stock: number
  fragranceFamily: FragranceFamily
  notesTop: string[]
  notesHeart: string[]
  notesBase: string[]
  intensity: Intensity
  occasion: Occasion[]
  profile: Profile
  shortDescription: string
}

export const familyLabels: Record<FragranceFamily, string> = {
  floral: 'Floral',
  amadeirado: 'Amadeirado',
  citrico: 'Cítrico',
  oriental: 'Oriental',
  frutal: 'Frutal',
  aromatico: 'Aromático',
  gourmand: 'Gourmand',
  musk: 'Musk',
}

export const familyDescriptions: Record<FragranceFamily, string> = {
  floral: 'Delicado, elegante e envolvente',
  amadeirado: 'Sofisticado, quente e marcante',
  citrico: 'Fresco, leve e vibrante',
  oriental: 'Intenso, sensual e memorável',
  frutal: 'Doce, jovem e luminoso',
  aromatico: 'Limpo, versátil e moderno',
  gourmand: 'Doce, cremoso e confortável',
  musk: 'Íntimo, limpo e sofisticado',
}

export const intensityLabel: Record<Intensity, string> = {
  leve: 'Leve',
  moderada: 'Moderada',
  marcante: 'Marcante',
}

export const products: Product[] = [
  {
    id: '1',
    slug: 'eau-de-parfum-noir',
    name: 'Eau de Parfum Noir',
    volume: '100ml',
    price: 289,
    stock: 5,
    isBestSeller: true,
    isGiftable: true,
    fragranceFamily: 'oriental',
    notesTop: ['Bergamota', 'Cardamomo'],
    notesHeart: ['Oud', 'Rosa negra'],
    notesBase: ['Sândalo', 'Âmbar', 'Baunilha'],
    intensity: 'marcante',
    occasion: ['noite', 'encontros', 'especial'],
    profile: 'unissex',
    shortDescription: 'Um oriental profundo e envolvente com toque de oud e âmbar.',
  },
  {
    id: '2',
    slug: 'rose-orient',
    name: 'Rose Orient',
    volume: '75ml',
    price: 249,
    discount: 15,
    stock: 3,
    isBestSeller: true,
    isGiftable: true,
    fragranceFamily: 'floral',
    notesTop: ['Bergamota', 'Pêra'],
    notesHeart: ['Rosa de Damasco', 'Jasmim'],
    notesBase: ['Patchouli', 'Almíscar', 'Cedro'],
    intensity: 'moderada',
    occasion: ['dia', 'encontros', 'presente'],
    profile: 'feminino',
    shortDescription: 'Floral romântico com rosa de damasco e base amadeirada sutil.',
  },
  {
    id: '3',
    slug: 'velvet-musk',
    name: 'Velvet Musk',
    volume: '100ml',
    price: 319,
    stock: 8,
    isBestSeller: true,
    fragranceFamily: 'musk',
    notesTop: ['Bergamota', 'Neroli'],
    notesHeart: ['Almíscar branco', 'Íris'],
    notesBase: ['Baunilha', 'Cedro', 'Sândalo'],
    intensity: 'leve',
    occasion: ['dia', 'trabalho', 'presente'],
    profile: 'unissex',
    shortDescription: 'Almíscar sedoso e íris sobre base amadeirada e calorosa.',
  },
  {
    id: '4',
    slug: 'amber-noir',
    name: 'Amber Noir',
    volume: '50ml',
    price: 189,
    stock: 0,
    isBestSeller: true,
    fragranceFamily: 'amadeirado',
    notesTop: ['Pimenta negra', 'Couro'],
    notesHeart: ['Âmbar', 'Vetiver'],
    notesBase: ['Tabaco', 'Musgo de carvalho', 'Incenso'],
    intensity: 'marcante',
    occasion: ['noite', 'especial'],
    profile: 'masculino',
    shortDescription: 'Amadeirado seco com âmbar e tabaco para noites marcantes.',
  },
  {
    id: '5',
    slug: 'floresta-negra',
    name: 'Floresta Negra',
    volume: '100ml',
    price: 359,
    stock: 10,
    isNew: true,
    isGiftable: true,
    fragranceFamily: 'amadeirado',
    notesTop: ['Pinheiro', 'Gengibre'],
    notesHeart: ['Cedro', 'Vetiver', 'Musgo'],
    notesBase: ['Âmbar cinza', 'Patchouli', 'Incenso'],
    intensity: 'marcante',
    occasion: ['noite', 'encontros', 'especial'],
    profile: 'unissex',
    shortDescription: 'Uma floresta profunda: cedro, musgo e incenso em harmonia.',
  },
  {
    id: '6',
    slug: 'citrus-elite',
    name: 'Citrus Élite',
    volume: '75ml',
    price: 219,
    stock: 6,
    isNew: true,
    fragranceFamily: 'citrico',
    notesTop: ['Bergamota', 'Limão siciliano', 'Toranja'],
    notesHeart: ['Neroli', 'Jasmim'],
    notesBase: ['Almíscar branco', 'Madeira de lei'],
    intensity: 'leve',
    occasion: ['dia', 'trabalho'],
    profile: 'unissex',
    shortDescription: 'Cítrico vivo e neroli com toque almiscarado para o dia a dia.',
  },
  {
    id: '7',
    slug: 'santal-rouge',
    name: 'Santal Rouge',
    volume: '100ml',
    price: 299,
    stock: 4,
    isNew: true,
    isGiftable: true,
    fragranceFamily: 'amadeirado',
    notesTop: ['Rosa', 'Açafrão'],
    notesHeart: ['Sândalo', 'Âmbar rosa'],
    notesBase: ['Patchouli', 'Baunilha', 'Cedro'],
    intensity: 'moderada',
    occasion: ['dia', 'encontros', 'presente'],
    profile: 'feminino',
    shortDescription: 'Sândalo aquecido por rosa e especiarias em equilíbrio refinado.',
  },
  {
    id: '8',
    slug: 'nuit-doree',
    name: 'Nuit Dorée',
    volume: '50ml',
    price: 229,
    discount: 10,
    stock: 2,
    isNew: true,
    fragranceFamily: 'gourmand',
    notesTop: ['Baunilha', 'Caramelo'],
    notesHeart: ['Jasmim', 'Tuberosa'],
    notesBase: ['Almíscar', 'Âmbar', 'Benjoim'],
    intensity: 'moderada',
    occasion: ['noite', 'encontros'],
    profile: 'feminino',
    shortDescription: 'Gourmand floral com caramelo e jasmim — sedutor e confortável.',
  },
]

export const maisVendidos = products.filter((p) => p.isBestSeller)
export const novidades = products.filter((p) => p.isNew)
export const presenteáveis = products.filter((p) => p.isGiftable)
