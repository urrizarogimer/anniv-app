export type ItemId = 'dress' | 'veil' | 'shoes' | 'bouquet' | 'tiara' | 'rings' | 'earrings' | 'perfume'

export interface ItemDef {
  id: ItemId
  name: string
  sprite: string
  message: string
  face: string
}

export const ITEMS: ItemDef[] = [
  { id: 'dress', name: 'Wedding Dress', sprite: 'item_dress', message: 'Lace, tulle and a little magic. It’s perfect!', face: 'face_2' },
  { id: 'veil', name: 'Veil', sprite: 'item_veil', message: 'Soft as a cloud, light as a wish.', face: 'face_1' },
  { id: 'shoes', name: 'Bridal Shoes', sprite: 'item_shoes', message: 'Ready to walk toward forever.', face: 'face_0' },
  { id: 'bouquet', name: 'Bouquet', sprite: 'item_bouquet', message: 'Fresh roses for a fresh beginning.', face: 'face_4' },
  { id: 'tiara', name: 'Tiara', sprite: 'item_tiara', message: 'A little sparkle for the queen of the day.', face: 'face_1' },
  { id: 'rings', name: 'Wedding Rings', sprite: 'item_rings', message: 'Two rings, one promise.', face: 'face_2' },
  { id: 'earrings', name: 'Pearl Earrings', sprite: 'item_earrings', message: 'Tiny pearls, big smiles.', face: 'face_6' },
  { id: 'perfume', name: 'Perfume', sprite: 'item_perfume', message: 'A sweet scent to remember today by.', face: 'face_0' },
]

export const CHEERS = ['Yay!', 'Wonderful!', 'Beautiful!', 'So lovely!', 'Perfect!', 'Hooray!', 'Amazing!', 'Gorgeous!']
