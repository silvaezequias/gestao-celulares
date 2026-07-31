// Lista curada de modelos para sugestão no autocomplete de cadastro de
// celular. Não precisa ser exaustiva (novos modelos saem o tempo todo) —
// o campo aceita texto livre, isso é só uma lista de atalhos comuns.

export const IPHONE_MODELS: string[] = [
  'iPhone SE (3ª geração)',
  'iPhone 11',
  'iPhone 11 Pro',
  'iPhone 11 Pro Max',
  'iPhone 12 Mini',
  'iPhone 12',
  'iPhone 12 Pro',
  'iPhone 12 Pro Max',
  'iPhone 13 Mini',
  'iPhone 13',
  'iPhone 13 Pro',
  'iPhone 13 Pro Max',
  'iPhone 14',
  'iPhone 14 Plus',
  'iPhone 14 Pro',
  'iPhone 14 Pro Max',
  'iPhone 15',
  'iPhone 15 Plus',
  'iPhone 15 Pro',
  'iPhone 15 Pro Max',
  'iPhone 16',
  'iPhone 16 Plus',
  'iPhone 16 Pro',
  'iPhone 16 Pro Max',
  'iPhone 16e',
  'iPhone 17',
  'iPhone 17 Pro',
  'iPhone 17 Pro Max',
  'iPhone Air',
];

export const ANDROID_MODELS: string[] = [
  // Samsung — no máximo 2 modelos parecidos por linha, pra não lotar as
  // sugestões só com variações de Galaxy S
  'Samsung Galaxy S23', 'Samsung Galaxy S24 Ultra',
  'Samsung Galaxy Z Flip6', 'Samsung Galaxy Z Fold6',
  'Samsung Galaxy A55', 'Samsung Galaxy A15',
  'Samsung Galaxy M34',
  // Xiaomi
  'Xiaomi 14', 'Xiaomi 14T', 'Xiaomi 13T',
  'Xiaomi Redmi Note 13', 'Xiaomi Redmi Note 13 Pro', 'Xiaomi Redmi 13',
  'Xiaomi Redmi Note 12',
  // Poco
  'Xiaomi Poco X6', 'Xiaomi Poco X6 Pro', 'Xiaomi Poco F6', 'Xiaomi Poco M6', 'Xiaomi Poco C65',
  // Motorola
  'Motorola Moto G84', 'Motorola Moto G54', 'Motorola Moto Edge 50 Pro',
  'Motorola Razr 50', 'Motorola Moto E14',
  // Google Pixel
  'Google Pixel 7', 'Google Pixel 8', 'Google Pixel 8a', 'Google Pixel 9 Pro',
  // OnePlus
  'OnePlus 12', 'OnePlus Nord 4',
  // Asus
  'Asus Zenfone 11 Ultra', 'Asus ROG Phone 8',
  // LG (linha ainda comum em uso, mesmo descontinuada)
  'LG K62', 'LG K41S',
  // Outras marcas populares
  'Realme 11', 'Realme GT 6', 'Honor Magic 6', 'Nokia G42',
  'Infinix Note 40', 'Tecno Spark 20', 'ZTE Blade A73',
];

export const ALL_PHONE_MODELS: string[] = [...IPHONE_MODELS, ...ANDROID_MODELS];
