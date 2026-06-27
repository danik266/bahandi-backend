import cors from 'cors'
import type { CorsOptions } from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import mongoose, { Schema } from 'mongoose'
import { existsSync } from 'node:fs'
import { createServer } from 'node:http'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const serverDir = path.dirname(fileURLToPath(import.meta.url))
const siteDir = path.resolve(serverDir, '..')
const projectDir = path.resolve(siteDir, '..')

dotenv.config({ path: path.join(projectDir, '.env') })
dotenv.config({ path: path.join(siteDir, '.env'), override: true })

type Role = 'sender' | 'reviewer'
type AccessScope = 'assigned' | 'all'
type Status = 'pending' | 'approved' | 'rejected' | 'iiko_error'
type WriteOffType = 'without_deduction' | 'with_deduction'

type OutletRecord = {
  refId: string
  sortOrder: number
  name: string
  address: string
  city: string
  iikoStoreId: string
}

type ProductRecord = {
  refId: string
  name: string
  unit: string
  iikoProductId: string
  cost: number
  category: string
}

type EmployeeRecord = {
  refId: string
  name: string
  role: Role
  login: string
  password: string
  pinCode: string
  city: string
  outletId: string
  outletIds: string[]
  accessScope: AccessScope
  iikoEmployeeId: string
}

type ReasonRecord = {
  refId: string
  name: string
}

type WriteOffRecord = {
  requestId: string
  outletId: string
  productId: string
  quantity: number
  unit: string
  reasonId: string
  type: WriteOffType
  deductionEmployeeId?: string
  comment: string
  photoUrl: string
  photoName: string
  photoHash: string
  extraPhotoUrls?: string[]
  status: Status
  createdById: string
  reviewedById?: string
  rejectionReason?: string
  iikoDocumentId?: string
  iikoStatusMessage?: string
  createdAt: Date
  reviewedAt?: Date
}

type AuditRecord = {
  eventId: string
  requestId: string
  userId: string
  action: string
  createdAt: Date
}

type IikoMockDocument = {
  id: string
  requestId: string
  status: 'created'
  createdAt: string
  source: 'mock-adapter'
  outlet: {
    id: string
    name: string
    iikoStoreId: string
  }
  product: {
    id: string
    name: string
    iikoProductId: string
    quantity: number
    unit: string
    cost: number
    amount: number
  }
  reason: {
    id: string
    name: string
  }
  sender: {
    id: string
    name: string
    iikoEmployeeId: string
  }
  reviewer: {
    id: string
    name: string
    iikoEmployeeId: string
  }
  deductionEmployee?: {
    id: string
    name: string
    iikoEmployeeId: string
  }
  comment: string
  payload: {
    documentType: 'WRITEOFF_DOCUMENT'
    externalNumber: string
    storeId: string
    items: Array<{
      productId: string
      amount: number
      unit: string
      comment: string
    }>
  }
}

type CounterRecord = {
  _id: string
  seq: number
}

const CITY_ASTANA = 'Астана'
const CITY_ALMATY = 'Алматы'
const CITY_UST_KAMEN = 'Усть-Каменогорск'
const CITY_SHYMKENT = 'Шымкент'
const CITY_KARAGANDA = 'Караганда'
const CITY_AKTAU = 'Актау'
const CITY_ATYRAU = 'Атырау'
const CITY_KOKSHETAU = 'Кокшетау'
const CITY_KOSTANAY = 'Костанай'
const CITY_TARAZ = 'Тараз'
const CITY_AKTOBE = 'Актобе'

const outletsSeed: OutletRecord[] = [
  {
    refId: 'outlet-01',
    sortOrder: 1,
    name: 'Bahandi Хан Шатыр',
    address: 'ТРЦ Хан Шатыр, 3 этаж',
    city: CITY_ASTANA,
    iikoStoreId: 'store_bahandi_001',
  },
  {
    refId: 'outlet-02',
    sortOrder: 2,
    name: 'Bahandi Азия Парк',
    address: 'ТРЦ Asia park, 3 этаж',
    city: CITY_ASTANA,
    iikoStoreId: 'store_bahandi_002',
  },
  {
    refId: 'outlet-03',
    sortOrder: 3,
    name: 'Bahandi Мега SilkWay',
    address: 'ТРЦ Мега SilkWay, 2 этаж',
    city: CITY_ASTANA,
    iikoStoreId: 'store_bahandi_003',
  },
  {
    refId: 'outlet-004',
    sortOrder: 4,
    name: 'Bahandi Магнум Туран',
    address: 'Проспект Туран, 55д, киоск',
    city: CITY_ASTANA,
    iikoStoreId: 'store_bahandi_004',
  },
  {
    refId: 'outlet-005',
    sortOrder: 5,
    name: 'Bahandi Чубары',
    address: 'М-н Шубар, киоск',
    city: CITY_ASTANA,
    iikoStoreId: 'store_bahandi_005',
  },
  {
    refId: 'outlet-006',
    sortOrder: 6,
    name: 'Bahandi Астана Молл',
    address: 'Проспект Тауелсиздик, 34/7, киоск',
    city: CITY_ASTANA,
    iikoStoreId: 'store_bahandi_006',
  },
  {
    refId: 'outlet-007',
    sortOrder: 7,
    name: 'Bahandi Петрова',
    address: 'Ул. Алексея Петрова, 22г, 1 этаж',
    city: CITY_ASTANA,
    iikoStoreId: 'store_bahandi_007',
  },
  {
    refId: 'outlet-008',
    sortOrder: 8,
    name: 'Bahandi Аружан',
    address: 'ТРЦ Аружан, 3 этаж',
    city: CITY_ASTANA,
    iikoStoreId: 'store_bahandi_008',
  },
  {
    refId: 'outlet-009',
    sortOrder: 9,
    name: 'Bahandi Иманова',
    address: 'Ул. Аменгельды Иманова, 3, киоск',
    city: CITY_ASTANA,
    iikoStoreId: 'store_bahandi_009',
  },
  {
    refId: 'outlet-010',
    sortOrder: 10,
    name: 'Bahandi Даму Молл',
    address: 'ТРЦ Damu Mall, 2 этаж',
    city: CITY_ASTANA,
    iikoStoreId: 'store_bahandi_010',
  },
  {
    refId: 'outlet-011',
    sortOrder: 11,
    name: 'Bahandi Магнум Кошкарбаева',
    address: 'Юго-Восток, жилмассив',
    city: CITY_ASTANA,
    iikoStoreId: 'store_bahandi_011',
  },
  {
    refId: 'outlet-012',
    sortOrder: 12,
    name: 'Bahandi Женис',
    address: 'Проспект Женис, 28а, киоск',
    city: CITY_ASTANA,
    iikoStoreId: 'store_bahandi_012',
  },
  {
    refId: 'outlet-013',
    sortOrder: 13,
    name: 'Bahandi Мангилик Ел',
    address: 'ЖК Only Sun',
    city: CITY_ASTANA,
    iikoStoreId: 'store_bahandi_013',
  },
  {
    refId: 'outlet-014',
    sortOrder: 14,
    name: 'Bahandi Тумар',
    address: 'Ул. Сыганак, 1Б/2, киоск',
    city: CITY_ASTANA,
    iikoStoreId: 'store_bahandi_014',
  },
  {
    refId: 'outlet-087',
    sortOrder: 15,
    name: 'Bahandi Жибек Жолы',
    address: 'ТРЦ Жибек Жолы, 3 этаж',
    city: CITY_ASTANA,
    iikoStoreId: 'store_bahandi_087',
  },
  {
    refId: 'outlet-015',
    sortOrder: 16,
    name: 'Bahandi АДК',
    address: 'ТРЦ Riviera Park',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_015',
  },
  {
    refId: 'outlet-016',
    sortOrder: 17,
    name: 'Bahandi Азия Парк',
    address: 'ТРК Asia Park, 3 этаж',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_016',
  },
  {
    refId: 'outlet-017',
    sortOrder: 18,
    name: 'Bahandi Айнабулак',
    address: 'Айнабулак 2 мкр., 82/4, киоск',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_017',
  },
  {
    refId: 'outlet-018',
    sortOrder: 19,
    name: 'Bahandi Акжар',
    address: 'Жандосова 254/9',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_018',
  },
  {
    refId: 'outlet-019',
    sortOrder: 20,
    name: 'Bahandi Апорт',
    address: 'ТРЦ Молл Апорт, 2 этаж',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_019',
  },
  {
    refId: 'outlet-020',
    sortOrder: 21,
    name: 'Bahandi Апорт Кульджинка',
    address: 'ТРЦ Aport Mall East',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_020',
  },
  {
    refId: 'outlet-021',
    sortOrder: 22,
    name: 'Bahandi Атакент',
    address: 'Ул. Ауэзова, 140, 1 этаж',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_021',
  },
  {
    refId: 'outlet-022',
    sortOrder: 23,
    name: 'Bahandi Байтурсынова',
    address: 'Ул. Байтурсынова, 61, 1 этаж',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_022',
  },
  {
    refId: 'outlet-023',
    sortOrder: 24,
    name: 'Bahandi Белинского',
    address: 'Ул. Ильяса Жансугурова, 258, киоск',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_023',
  },
  {
    refId: 'outlet-024',
    sortOrder: 25,
    name: 'Bahandi Бесагаш',
    address: 'С. Бесагаш, ул. Райымбек батыра, 250/1, киоск',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_024',
  },
  {
    refId: 'outlet-025',
    sortOrder: 26,
    name: 'Bahandi ВАЗ',
    address: 'Ул. Тукая, 28, 1 этаж',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_025',
  },
  {
    refId: 'outlet-026',
    sortOrder: 27,
    name: 'Bahandi Весновка',
    address: 'Коктем-2 мкр., 22, киоск',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_026',
  },
  {
    refId: 'outlet-027',
    sortOrder: 28,
    name: 'Bahandi Водник',
    address: 'Рынок Алатау',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_027',
  },
  {
    refId: 'outlet-028',
    sortOrder: 29,
    name: 'Bahandi Гагарина',
    address: 'Проспект Гагарина, 41, 1 этаж',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_028',
  },
  {
    refId: 'outlet-029',
    sortOrder: 30,
    name: 'Bahandi Глобус Фудкорт',
    address: 'ТРЦ Globus, 2 этаж',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_029',
  },
  {
    refId: 'outlet-030',
    sortOrder: 31,
    name: 'Bahandi ГРЭС',
    address: 'С. Отеген Батыра, ул. Жансугурова, 15а',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_030',
  },
  {
    refId: 'outlet-031',
    sortOrder: 32,
    name: 'Bahandi Дружба',
    address: 'Ул. Шамгона Кажыгалиева, 22',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_031',
  },
  {
    refId: 'outlet-032',
    sortOrder: 33,
    name: 'Bahandi Жаркент',
    address: 'Г. Жаркент, ул. Юлдашева, 7а, киоск',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_032',
  },
  {
    refId: 'outlet-033',
    sortOrder: 34,
    name: 'Bahandi Жубанова',
    address: 'Аксай-4 мкр., 22а/3, киоск',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_033',
  },
  {
    refId: 'outlet-034',
    sortOrder: 35,
    name: 'Bahandi Жумалиева',
    address: 'Ул. Толе би, 147, 1 этаж',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_034',
  },
  {
    refId: 'outlet-035',
    sortOrder: 36,
    name: 'Bahandi Каменка',
    address: 'Ул. Керуентау, 2/1, 1 этаж',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_035',
  },
  {
    refId: 'outlet-036',
    sortOrder: 37,
    name: 'Bahandi Капчагай',
    address: 'Г. Конаев, Алматинская улица, 64а, киоск',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_036',
  },
  {
    refId: 'outlet-037',
    sortOrder: 38,
    name: 'Bahandi Каскелен',
    address: 'Г. Каскелен, ул. Абен Омиралы, 99',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_037',
  },
  {
    refId: 'outlet-038',
    sortOrder: 39,
    name: 'Bahandi Кунаева',
    address: 'Абая проспект, 27, киоск',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_038',
  },
  {
    refId: 'outlet-039',
    sortOrder: 40,
    name: 'Bahandi Магнум Акбулак',
    address: 'Акбулак мкр., ул. Байтерекова, 6/1, 1 этаж',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_039',
  },
  {
    refId: 'outlet-040',
    sortOrder: 41,
    name: 'Bahandi Магнум Аксуат',
    address: 'Ул. Аксуат, 128/2, киоск',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_040',
  },
  {
    refId: 'outlet-041',
    sortOrder: 42,
    name: 'Bahandi Магнум Бесагаш',
    address: 'Медеуский район, ул. Халиуллина, 194/3, киоск',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_041',
  },
  {
    refId: 'outlet-042',
    sortOrder: 43,
    name: 'Bahandi Магнум Гагарина',
    address: 'Проспект Гагарина, 41, 1 этаж',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_042',
  },
  {
    refId: 'outlet-043',
    sortOrder: 44,
    name: 'Bahandi Джангильдина',
    address: 'Ул. Демьяна Бедного, 3/2, киоск',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_043',
  },
  {
    refId: 'outlet-044',
    sortOrder: 45,
    name: 'Bahandi Магнум Жетысу',
    address: 'Жетысу-3 мкр., 1г/3, киоск',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_044',
  },
  {
    refId: 'outlet-045',
    sortOrder: 46,
    name: 'Bahandi Максима',
    address: 'ТРК Maxima, 3 этаж',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_045',
  },
  {
    refId: 'outlet-046',
    sortOrder: 47,
    name: 'Bahandi Масанчи',
    address: 'Ул. Масанчи, 96, цокольный этаж',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_046',
  },
  {
    refId: 'outlet-047',
    sortOrder: 48,
    name: 'Bahandi Масато',
    address: 'Ул. Ораза Жандосова, 162а',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_047',
  },
  {
    refId: 'outlet-048',
    sortOrder: 49,
    name: 'Bahandi Мега Парк Сейфуллина',
    address: 'ТРК MEGA Park, 3 этаж',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_048',
  },
  {
    refId: 'outlet-049',
    sortOrder: 50,
    name: 'Bahandi Мега Центр Розыбакиева',
    address: 'ТРЦ Mega Center Alma-Ata',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_049',
  },
  {
    refId: 'outlet-050',
    sortOrder: 51,
    name: 'Bahandi Мерей',
    address: 'Проспект Суюнбая, 2/Б, киоск',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_050',
  },
  {
    refId: 'outlet-051',
    sortOrder: 52,
    name: 'Bahandi Орбита',
    address: 'Мкр. Орбита-3, ул. Мустафина, 5Б/1, киоск',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_051',
  },
  {
    refId: 'outlet-052',
    sortOrder: 53,
    name: 'Bahandi Панфилова',
    address: 'Ул. Панфилова, 110, киоск',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_052',
  },
  {
    refId: 'outlet-053',
    sortOrder: 54,
    name: 'Bahandi Ритц Палас',
    address: 'Самал-3 мкр., 2а, киоск',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_053',
  },
  {
    refId: 'outlet-054',
    sortOrder: 55,
    name: 'Bahandi Сары Арка',
    address: 'Рынок Сары Арка',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_054',
  },
  {
    refId: 'outlet-055',
    sortOrder: 56,
    name: 'Bahandi Спутник',
    address: 'ТРЦ SPUTNIK mall, 3 этаж',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_055',
  },
  {
    refId: 'outlet-056',
    sortOrder: 57,
    name: 'Bahandi Талгар',
    address: 'Г. Талгар, ул. Кунаева, 140',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_056',
  },
  {
    refId: 'outlet-057',
    sortOrder: 58,
    name: 'Bahandi Тастак',
    address: 'Тастак-3 мкр., ул. Толе би, 229/3, киоск',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_057',
  },
  {
    refId: 'outlet-058',
    sortOrder: 59,
    name: 'Bahandi Татарка',
    address: 'Ул. Оренбургская, 2, 1 этаж',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_058',
  },
  {
    refId: 'outlet-059',
    sortOrder: 60,
    name: 'Bahandi Торнадо',
    address: 'Мкр. 3-й, 20а, 1 этаж',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_059',
  },
  {
    refId: 'outlet-060',
    sortOrder: 61,
    name: 'Bahandi Форум',
    address: 'Проспект Сейфуллина, 617, киоск',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_060',
  },
  {
    refId: 'outlet-061',
    sortOrder: 62,
    name: 'Bahandi ЦУМ',
    address: 'ТД ЦУМ, 1 этаж',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_061',
  },
  {
    refId: 'outlet-062',
    sortOrder: 63,
    name: 'Bahandi Шолохова',
    address: 'Ул. Шолохова, 8, киоск',
    city: CITY_ALMATY,
    iikoStoreId: 'store_bahandi_062',
  },
  {
    refId: 'outlet-063',
    sortOrder: 64,
    name: 'Bahandi АДК Ривер',
    address: 'ТРК ADK River, 3 этаж',
    city: CITY_UST_KAMEN,
    iikoStoreId: 'store_bahandi_063',
  },
  {
    refId: 'outlet-064',
    sortOrder: 65,
    name: 'Bahandi Макси Молл',
    address: 'ТРЦ Maxi Mall, 2 этаж',
    city: CITY_UST_KAMEN,
    iikoStoreId: 'store_bahandi_064',
  },
  {
    refId: 'outlet-065',
    sortOrder: 66,
    name: 'Bahandi Даймонд Плаза',
    address: 'ТРК Diamond plaza, 4 этаж',
    city: CITY_SHYMKENT,
    iikoStoreId: 'store_bahandi_065',
  },
  {
    refId: 'outlet-066',
    sortOrder: 67,
    name: 'Bahandi Дала Молл',
    address: 'ТЦ Dala Mall, 2 этаж',
    city: CITY_SHYMKENT,
    iikoStoreId: 'store_bahandi_066',
  },
  {
    refId: 'outlet-067',
    sortOrder: 68,
    name: 'Bahandi Динара',
    address: 'Проспект Республики, 40/1, 1 этаж',
    city: CITY_SHYMKENT,
    iikoStoreId: 'store_bahandi_067',
  },
  {
    refId: 'outlet-068',
    sortOrder: 69,
    name: 'Bahandi Керемет',
    address: 'Ул. Байтурсынова, 81, 1 этаж',
    city: CITY_SHYMKENT,
    iikoStoreId: 'store_bahandi_068',
  },
  {
    refId: 'outlet-069',
    sortOrder: 70,
    name: 'Bahandi Роял Плаза',
    address: 'ТРЦ Royal Plaza, 0 этаж',
    city: CITY_SHYMKENT,
    iikoStoreId: 'store_bahandi_069',
  },
  {
    refId: 'outlet-070',
    sortOrder: 71,
    name: 'Bahandi Север',
    address: 'ТЦ Север, 1 этаж',
    city: CITY_SHYMKENT,
    iikoStoreId: 'store_bahandi_070',
  },
  {
    refId: 'outlet-071',
    sortOrder: 72,
    name: 'Bahandi Сити Молл',
    address: 'ТРЦ Shymkent City Mall, 3 этаж',
    city: CITY_SHYMKENT,
    iikoStoreId: 'store_bahandi_071',
  },
  {
    refId: 'outlet-072',
    sortOrder: 73,
    name: 'Bahandi Таукехана',
    address: 'Проспект Тауке хана, 112, киоск',
    city: CITY_SHYMKENT,
    iikoStoreId: 'store_bahandi_072',
  },
  {
    refId: 'outlet-073',
    sortOrder: 74,
    name: 'Bahandi Янги Шахар',
    address: 'Тамерлановское шоссе, 1а/8, киоск',
    city: CITY_SHYMKENT,
    iikoStoreId: 'store_bahandi_073',
  },
  {
    refId: 'outlet-074',
    sortOrder: 75,
    name: 'Bahandi Гульжан',
    address: 'Мкр. Степной-1, 5/8, киоск',
    city: CITY_KARAGANDA,
    iikoStoreId: 'store_bahandi_074',
  },
  {
    refId: 'outlet-075',
    sortOrder: 76,
    name: 'Bahandi Строителей',
    address: 'Проспект Строителей, 35, киоск',
    city: CITY_KARAGANDA,
    iikoStoreId: 'store_bahandi_075',
  },
  {
    refId: 'outlet-076',
    sortOrder: 77,
    name: 'Bahandi ЦУМ',
    address: 'ТЦ ЦУМ, 3 этаж',
    city: CITY_KARAGANDA,
    iikoStoreId: 'store_bahandi_076',
  },
  {
    refId: 'outlet-077',
    sortOrder: 78,
    name: 'Bahandi Шахтеров',
    address: 'Проспект Шахтеров, 82/3, киоск',
    city: CITY_KARAGANDA,
    iikoStoreId: 'store_bahandi_077',
  },
  {
    refId: 'outlet-078',
    sortOrder: 79,
    name: 'Bahandi Юбилейный',
    address: 'Проспект Нуркена Абдирова, 38, киоск',
    city: CITY_KARAGANDA,
    iikoStoreId: 'store_bahandi_078',
  },
  {
    refId: 'outlet-079',
    sortOrder: 80,
    name: 'Bahandi Сая Парк',
    address: 'ТЦ Saya Park, 2 этаж',
    city: CITY_AKTAU,
    iikoStoreId: 'store_bahandi_079',
  },
  {
    refId: 'outlet-080',
    sortOrder: 81,
    name: 'Bahandi Грин Плаза',
    address: 'ЖК Green Plaza',
    city: CITY_AKTAU,
    iikoStoreId: 'store_bahandi_080',
  },
  {
    refId: 'outlet-081',
    sortOrder: 82,
    name: 'Bahandi Байзаар',
    address: 'ТРЦ Baizaar, 3 этаж',
    city: CITY_ATYRAU,
    iikoStoreId: 'store_bahandi_081',
  },
  {
    refId: 'outlet-082',
    sortOrder: 83,
    name: 'Bahandi Инфинити Молл',
    address: 'ТРЦ Infinity Mall, 3 этаж',
    city: CITY_ATYRAU,
    iikoStoreId: 'store_bahandi_082',
  },
  {
    refId: 'outlet-083',
    sortOrder: 84,
    name: 'Bahandi Рио',
    address: 'ТРЦ РИО, 4 этаж',
    city: CITY_KOKSHETAU,
    iikoStoreId: 'store_bahandi_083',
  },
  {
    refId: 'outlet-084',
    sortOrder: 85,
    name: 'Bahandi Март',
    address: 'ТРЦ MART, 3 этаж',
    city: CITY_KOSTANAY,
    iikoStoreId: 'store_bahandi_084',
  },
  {
    refId: 'outlet-085',
    sortOrder: 86,
    name: 'Bahandi Март',
    address: 'ТРЦ Mart, 3 этаж',
    city: CITY_TARAZ,
    iikoStoreId: 'store_bahandi_085',
  },
  {
    refId: 'outlet-086',
    sortOrder: 87,
    name: 'Bahandi Далида Сити',
    address: 'ТРЦ Dalida Plaza, 2 этаж',
    city: CITY_AKTOBE,
    iikoStoreId: 'store_bahandi_086',
  },
]

const productsSeed: ProductRecord[] = [
  { refId: 'product-bun', name: 'Булочка бриошь (стандартная)', unit: 'шт', iikoProductId: 'prd_brioche_bun', cost: 145, category: 'Хлеб' },
  { refId: 'product-patty', name: 'Котлета говяжья', unit: 'шт', iikoProductId: 'prd_beef_patty', cost: 520, category: 'Полуфабрикаты' },
  { refId: 'product-patty-chicken', name: 'Котлета куриная', unit: 'шт', iikoProductId: 'prd_chicken_patty', cost: 380, category: 'Полуфабрикаты' },
  { refId: 'product-tomato', name: 'Помидоры', unit: 'кг', iikoProductId: 'prd_tomato', cost: 890, category: 'Овощи' },
  { refId: 'product-cucumber', name: 'Огурцы маринованные', unit: 'кг', iikoProductId: 'prd_cucumber', cost: 950, category: 'Овощи' },
  { refId: 'product-lettuce', name: 'Салат Айсберг', unit: 'кг', iikoProductId: 'prd_lettuce', cost: 1200, category: 'Овощи' },
  { refId: 'product-onion', name: 'Лук красный', unit: 'кг', iikoProductId: 'prd_onion', cost: 450, category: 'Овощи' },
  { refId: 'product-jalapeno', name: 'Халапеньо (маринованный)', unit: 'кг', iikoProductId: 'prd_jalapeno', cost: 1800, category: 'Овощи' },
  { refId: 'product-cheese', name: 'Сыр Чеддер (слайс)', unit: 'шт', iikoProductId: 'prd_cheddar_slice', cost: 95, category: 'Топпинги' },
  { refId: 'product-cheese-gouda', name: 'Сыр Гауда', unit: 'кг', iikoProductId: 'prd_gouda', cost: 3500, category: 'Топпинги' },
  { refId: 'product-fries-raw', name: 'Картофель фри (замороженный)', unit: 'кг', iikoProductId: 'prd_fries_raw', cost: 1100, category: 'Полуфабрикаты' },
  { refId: 'product-oil', name: 'Масло фритюрное', unit: 'л', iikoProductId: 'prd_oil', cost: 950, category: 'Прочее' },
  { refId: 'product-sauce-bbq', name: 'Соус Барбекью', unit: 'кг', iikoProductId: 'prd_sauce_bbq', cost: 1800, category: 'Соусы' },
  { refId: 'product-sauce-ketchup', name: 'Кетчуп', unit: 'кг', iikoProductId: 'prd_sauce_ketchup', cost: 1200, category: 'Соусы' },
  { refId: 'product-sauce-cheese', name: 'Соус Сырный', unit: 'кг', iikoProductId: 'prd_sauce_cheese', cost: 2100, category: 'Соусы' },
  { refId: 'product-sauce-brand', name: 'Фирменный соус для бургера', unit: 'кг', iikoProductId: 'prd_sauce_brand', cost: 1900, category: 'Соусы' },
  { refId: 'p-drink-piko-apple', name: 'Piko яблоко', unit: 'шт', iikoProductId: 'iiko-drink-piko-apple', cost: 250, category: 'Напитки' },
  { refId: 'p-drink-piko-orange', name: 'Piko апельсин', unit: 'шт', iikoProductId: 'iiko-drink-piko-orange', cost: 250, category: 'Напитки' },
  { refId: 'p-drink-fuse-peach', name: 'Fuse tea персик', unit: 'шт', iikoProductId: 'iiko-drink-fuse-peach', cost: 320, category: 'Напитки' },
  { refId: 'p-drink-fuse-mango-chamo', name: 'Fuse tea манго-ромашка', unit: 'шт', iikoProductId: 'iiko-drink-fuse-mango-chamo', cost: 320, category: 'Напитки' },
  { refId: 'p-drink-fuse-mango-pine', name: 'Fuse tea манго-ананас', unit: 'шт', iikoProductId: 'iiko-drink-fuse-mango-pine', cost: 320, category: 'Напитки' },
  { refId: 'p-drink-fanta', name: 'Fanta', unit: 'шт', iikoProductId: 'iiko-drink-fanta', cost: 350, category: 'Напитки' },
  { refId: 'p-drink-sprite', name: 'Sprite', unit: 'шт', iikoProductId: 'iiko-drink-sprite', cost: 350, category: 'Напитки' },
  { refId: 'p-drink-cola-1l', name: 'Coca-cola 1 л', unit: 'шт', iikoProductId: 'iiko-drink-cola-1l', cost: 550, category: 'Напитки' },
  { refId: 'p-drink-cola-05l', name: 'Coca-cola 0,5 л', unit: 'шт', iikoProductId: 'iiko-drink-cola-05l', cost: 350, category: 'Напитки' },
  { refId: 'p-drink-cola-zero', name: 'Coca-cola без сахара 0,5 л', unit: 'шт', iikoProductId: 'iiko-drink-cola-zero', cost: 350, category: 'Напитки' },
  { refId: 'p-drink-bonaqua', name: 'Bonaqua без газа', unit: 'шт', iikoProductId: 'iiko-drink-bonaqua', cost: 220, category: 'Напитки' },
  { refId: 'p-drink-schweppes-mojito', name: 'Schweppes мохито', unit: 'шт', iikoProductId: 'iiko-drink-schweppes-mojito', cost: 480, category: 'Напитки' },
  { refId: 'p-drink-schweppes-ginger', name: 'Schweppes имбирный эль', unit: 'шт', iikoProductId: 'iiko-drink-schweppes-ginger', cost: 480, category: 'Напитки' },
  { refId: 'p-drink-ayran', name: 'Айран по-турецки', unit: 'шт', iikoProductId: 'iiko-drink-ayran', cost: 250, category: 'Напитки' },
  { refId: 'p-drink-compot', name: 'Компот Bahandi', unit: 'шт', iikoProductId: 'iiko-drink-compot', cost: 180, category: 'Напитки' },
  { refId: 'product-box', name: 'Коробка для бургера', unit: 'шт', iikoProductId: 'prd_box', cost: 45, category: 'Упаковка' },
  { refId: 'product-bag-big', name: 'Бумажный пакет (большой)', unit: 'шт', iikoProductId: 'prd_bag_big', cost: 35, category: 'Упаковка' },
  { refId: 'product-bag-small', name: 'Бумажный пакет (малый)', unit: 'шт', iikoProductId: 'prd_bag_small', cost: 20, category: 'Упаковка' },
  { refId: 'product-cup', name: 'Стакан для напитка', unit: 'шт', iikoProductId: 'prd_cup', cost: 30, category: 'Упаковка' },
  { refId: 'product-lid', name: 'Крышка для стакана', unit: 'шт', iikoProductId: 'prd_lid', cost: 10, category: 'Упаковка' },
  { refId: 'product-wipes', name: 'Салфетки влажные', unit: 'шт', iikoProductId: 'prd_wipes', cost: 15, category: 'Упаковка' }
]

const employeesSeed: EmployeeRecord[] = [
  {
    refId: 'user-aibek',
    name: 'Айбек Сейткали',
    role: 'sender',
    login: 'aibek',
    password: 'demo123',
    pinCode: '1234',
    city: CITY_ASTANA,
    outletId: 'outlet-01',
    outletIds: ['outlet-01', 'outlet-02'],
    accessScope: 'assigned',
    iikoEmployeeId: 'emp_aibek',
  },
  {
    refId: 'user-madina',
    name: 'Мадина Касымова',
    role: 'sender',
    login: 'madina',
    password: 'demo123',
    pinCode: '2222',
    city: CITY_ASTANA,
    outletId: 'outlet-03',
    outletIds: ['outlet-03'],
    accessScope: 'assigned',
    iikoEmployeeId: 'emp_madina',
  },
  {
    refId: 'user-timur',
    name: 'Тимур Нурланов',
    role: 'sender',
    login: 'timur',
    password: 'demo123',
    pinCode: '3333',
    city: CITY_ALMATY,
    outletId: 'outlet-015',
    outletIds: ['outlet-015', 'outlet-016'],
    accessScope: 'assigned',
    iikoEmployeeId: 'emp_timur',
  },
  {
    refId: 'user-dana',
    name: 'Дана Жакупова',
    role: 'sender',
    login: 'dana',
    password: 'demo123',
    pinCode: '4444',
    city: CITY_ALMATY,
    outletId: 'outlet-019',
    outletIds: ['outlet-019'],
    accessScope: 'assigned',
    iikoEmployeeId: 'emp_dana',
  },
  {
    refId: 'user-ruslan',
    name: 'Руслан Бекенов',
    role: 'sender',
    login: 'ruslan',
    password: 'demo123',
    pinCode: '5555',
    city: CITY_SHYMKENT,
    outletId: 'outlet-065',
    outletIds: ['outlet-065', 'outlet-066'],
    accessScope: 'assigned',
    iikoEmployeeId: 'emp_ruslan',
  },
  {
    refId: 'user-aigerim',
    name: 'Айгерим Омарова',
    role: 'reviewer',
    login: 'aigerim',
    password: 'review123',
    pinCode: '9999',
    city: CITY_ASTANA,
    outletId: 'outlet-01',
    outletIds: ['outlet-01', 'outlet-02', 'outlet-03', 'outlet-004', 'outlet-005'],
    accessScope: 'assigned',
    iikoEmployeeId: 'emp_aigerim',
  },
  {
    refId: 'user-manager',
    name: 'Главный менеджер',
    role: 'reviewer',
    login: 'manager',
    password: 'manager123',
    pinCode: '0000',
    city: CITY_ASTANA,
    outletId: 'outlet-01',
    outletIds: [],
    accessScope: 'all',
    iikoEmployeeId: 'emp_manager',
  },
]

const reasonsSeed: ReasonRecord[] = [
  { refId: 'damaged', name: 'Повреждение / помято' },
  { refId: 'sanitary', name: 'Санитарное списание' },
  { refId: 'expired', name: 'Истек срок хранения' },
  { refId: 'leftover', name: 'Остаток после приготовления' },
  { refId: 'receiving', name: 'Брак при приемке' },
]

// requestsSeed and auditSeed unused variables removed

const outletSchema = new Schema<OutletRecord>(
  {
    refId: { type: String, required: true, unique: true },
    sortOrder: { type: Number, required: true, index: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true, default: '' },
    iikoStoreId: { type: String, required: true },
  },
  { timestamps: true },
)

const productSchema = new Schema<ProductRecord>(
  {
    refId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    unit: { type: String, required: true },
    iikoProductId: { type: String, required: true },
    cost: { type: Number, required: true },
    category: { type: String, required: true },
  },
  { timestamps: true },
)

const employeeSchema = new Schema<EmployeeRecord>(
  {
    refId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['sender', 'reviewer'], required: true },
    login: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    pinCode: { type: String, required: true, default: '1234' },
    city: { type: String, required: true, default: '' },
    outletId: { type: String, required: true },
    outletIds: { type: [String], required: true, default: [] },
    accessScope: { type: String, enum: ['assigned', 'all'], required: true, default: 'assigned' },
    iikoEmployeeId: { type: String, required: true },
  },
  { timestamps: true },
)

const reasonSchema = new Schema<ReasonRecord>(
  {
    refId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
  },
  { timestamps: true },
)

const writeOffSchema = new Schema<WriteOffRecord>(
  {
    requestId: { type: String, required: true, unique: true, index: true },
    outletId: { type: String, required: true },
    productId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.001 },
    unit: { type: String, required: true },
    reasonId: { type: String, required: true },
    type: {
      type: String,
      enum: ['without_deduction', 'with_deduction'],
      required: true,
    },
    deductionEmployeeId: { type: String },
    comment: { type: String, required: true, minlength: 10 },
    photoUrl: { type: String, required: true },
    photoName: { type: String, required: true },
    photoHash: { type: String, required: true, index: true },
    extraPhotoUrls: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'iiko_error'],
      required: true,
      default: 'pending',
      index: true,
    },
    createdById: { type: String, required: true },
    reviewedById: { type: String },
    rejectionReason: { type: String },
    iikoDocumentId: { type: String },
    iikoStatusMessage: { type: String },
    createdAt: { type: Date, required: true, default: Date.now },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
)

const auditSchema = new Schema<AuditRecord>(
  {
    eventId: { type: String, required: true, unique: true },
    requestId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    action: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
)

const counterSchema = new Schema<CounterRecord>({
  _id: { type: String, required: true },
  seq: { type: Number, required: true },
})

const Outlet = mongoose.model('Outlet', outletSchema)
const Product = mongoose.model('Product', productSchema)
const Employee = mongoose.model('Employee', employeeSchema)
const Reason = mongoose.model('Reason', reasonSchema)
const WriteOff = mongoose.model('WriteOffRequest', writeOffSchema)
const AuditEvent = mongoose.model('AuditEvent', auditSchema)
const Counter = mongoose.model('Counter', counterSchema)

const app = express()
const apiPort = Number(process.env.API_PORT ?? 4000)
const apiHost = process.env.API_HOST ?? '0.0.0.0'
const corsOrigin = createCorsOrigin(process.env.CORS_ORIGIN)
const publicDir = path.join(siteDir, 'public')
const distDir = path.join(siteDir, 'dist')
const shouldServeWeb = process.env.SERVE_WEB !== 'false'
const iikoSubscribers = new Set<express.Response>()

app.set('trust proxy', 1)
app.use(cors({ origin: corsOrigin }))
app.use(express.json({ limit: '12mb' }))
app.use(express.static(publicDir, { maxAge: '1h' }))

if (shouldServeWeb && existsSync(distDir)) {
  app.use(express.static(distDir, { maxAge: '1h' }))
}

app.get('/api', (_request, response) => {
  response.json({
    name: 'Bahandi write-off API',
    ok: true,
    health: '/api/health',
  })
})

app.get('/api/health', (_request, response) => {
  response.json({
    ok: mongoose.connection.readyState === 1,
    dbName: mongoose.connection.name,
    readyState: mongoose.connection.readyState,
  })
})

app.get('/api/auth/users', async (_request, response, next) => {
  try {
    const employees = await Employee.find().sort({ role: 1, refId: 1 }).lean()
    response.json({ users: employees.map(serializeEmployee) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/login', async (request, response, next) => {
  try {
    const login = String(request.body?.login ?? '').trim().toLowerCase()
    const pinCode = String(request.body?.pinCode ?? '')
    const password = String(request.body?.password ?? '')
    if (!login || (!pinCode && !password)) {
      throw badRequest('Введите логин и пин-код.')
    }

    const employee = await Employee.findOne({ login }).lean()
    const pinMatch = pinCode && employee?.pinCode === pinCode
    const passwordMatch = password && employee?.password === password
    if (!employee || (!pinMatch && !passwordMatch)) {
      throw badRequest('Неверный логин или пин-код.')
    }

    response.json({
      user: serializeEmployee(employee),
      token: Buffer.from(`${employee.refId}:${employee.role}:${employee.login}`).toString('base64url'),
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/employees', async (request, response, next) => {
  try {
    const payload = request.body as {
      name?: string
      login?: string
      pinCode?: string
      city?: string
      outletIds?: string[]
      role?: string
      createdById?: string
    }

    const creatorId = String(payload.createdById ?? '')
    const creator = creatorId ? await Employee.findOne({ refId: creatorId }).lean() : null
    if (!creator || creator.role !== 'reviewer' || creator.accessScope !== 'all') {
      throw badRequest('Только главный менеджер может добавлять сотрудников.')
    }

    const name = String(payload.name ?? '').trim()
    const login = String(payload.login ?? '').trim().toLowerCase()
    const pinCode = String(payload.pinCode ?? '').trim()
    const city = String(payload.city ?? '').trim()
    let outletIds: string[] = Array.isArray(payload.outletIds) ? payload.outletIds : []
    const role = payload.role === 'reviewer' ? 'reviewer' : 'sender'

    if (!name || name.length < 2) throw badRequest('Введите ФИО сотрудника.')
    if (!login || login.length < 2) throw badRequest('Введите логин.')
    if (!pinCode || pinCode.length < 4) throw badRequest('Пин-код должен быть 4-6 цифр.')
    if (!/^\d{4,6}$/.test(pinCode)) throw badRequest('Пин-код должен состоять только из цифр (4-6).')
    if (!city) throw badRequest('Укажите город.')

    const existing = await Employee.findOne({ login }).lean()
    if (existing) throw badRequest('Сотрудник с таким логином уже существует.')

    if (outletIds.length === 0) {
      const matchingOutlets = await Outlet.find({ city }).lean()
      outletIds = matchingOutlets.map((o) => o.refId)
    }

    const primaryOutlet = outletIds[0] ?? ''
    const refId = `user-${login}-${Date.now()}`
    const newEmployee = await Employee.create({
      refId,
      name,
      role,
      login,
      password: pinCode,
      pinCode,
      city,
      outletId: primaryOutlet,
      outletIds,
      accessScope: 'assigned',
      iikoEmployeeId: `emp_${login}_${Date.now()}`,
    })

    response.status(201).json({ user: serializeEmployee(newEmployee.toObject()) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/bootstrap', async (request, response, next) => {
  try {
    const publicBaseUrl = getPublicBaseUrl(request)
    const userId = String(request.query.userId ?? '')
    const currentUser = userId ? await Employee.findOne({ refId: userId }).lean() : null
    const [products, reasons] = await Promise.all([
      Product.find().sort({ refId: 1 }).lean(),
      Reason.find().sort({ refId: 1 }).lean(),
    ])

    const outlets = currentUser
      ? await Outlet.find(createOutletQuery(currentUser)).sort({ sortOrder: 1, refId: 1 }).lean()
      : []
    const requests = currentUser
      ? await WriteOff.find(createRequestQuery(currentUser)).sort({ createdAt: -1 }).lean()
      : []
    const requestIds = requests.map((writeOffRequest) => writeOffRequest.requestId)
    const [employees, auditEvents] = currentUser
      ? await Promise.all([
          Employee.find(createEmployeeQuery(currentUser)).sort({ role: 1, refId: 1 }).lean(),
          requestIds.length
            ? AuditEvent.find({ requestId: { $in: requestIds } }).sort({ createdAt: -1 }).lean()
            : [],
        ])
      : [[], []]

    response.json({
      outlets: outlets.map(serializeRefRecord),
      products: products.map(serializeRefRecord),
      employees: employees.map(serializeEmployee),
      reasons: reasons.map(serializeRefRecord),
      requests: requests.map((writeOffRequest) =>
        serializeRequest(writeOffRequest, publicBaseUrl),
      ),
      auditEvents: auditEvents.map(serializeAuditEvent),
      serverTime: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/iiko/mock-documents', async (request, response, next) => {
  try {
    const publicBaseUrl = getPublicBaseUrl(request)
    const documents = await getIikoMockDocuments(publicBaseUrl)
    response.json({
      documents,
      serverTime: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/iiko/mock-stream', async (request, response, next) => {
  try {
    const publicBaseUrl = getPublicBaseUrl(request)
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    response.write('retry: 2000\n\n')

    iikoSubscribers.add(response)
    const documents = await getIikoMockDocuments(publicBaseUrl)
    writeIikoEvent(response, 'snapshot', {
      documents,
      serverTime: new Date().toISOString(),
    })

    request.on('close', () => {
      iikoSubscribers.delete(response)
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/ai/analyze', async (request, response, next) => {
  try {
    const { photoBase64, hint, products, reasons } = request.body as {
      photoBase64: string
      hint?: string
      products: Array<{ id: string; name: string; category: string }>
      reasons: Array<{ id: string; name: string }>
    }

    if (!photoBase64) throw badRequest('Нет фото для анализа.')

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw badRequest('Gemini API ключ не настроен.')

    const productList = products.map((p) => `- id="${p.id}" name="${p.name}" (${p.category})`).join('\n')
    const reasonList = reasons.map((r) => `- id="${r.id}" name="${r.name}"`).join('\n')

    const prompt = `Ты — система автозаполнения формы списания продукции для фастфуд-сети Bahandi (бургеры, напитки, упаковка).

Пользователь сфотографировал товар и кратко описал проблему: "${hint || 'не указано'}".

Список продуктов в базе:
${productList}

Список причин списания:
${reasonList}

Внимательно посмотри на фото. Определи:
1. Какой продукт изображён — выбери ОДИН id из списка выше
2. Какова причина списания — выбери ОДИН id из списка причин выше
3. Количество штук, которые надо списать (целое число, смотри на фото)
4. Если причина "Повреждение / помято": укажи вид повреждения (Помято / Упало / Порвана упаковка / Прочее) и когда обнаружено (При приемке / При хранении / В процессе готовки / Прочее)
5. Короткий профессиональный комментарий для заявки (1-2 предложения на русском)

Верни ТОЛЬКО JSON без markdown и без пояснений:
{
  "productId": "...",
  "reasonId": "...",
  "quantity": 1,
  "damageType": "..." или null,
  "damageDiscoveredAt": "..." или null,
  "comment": "...",
  "confidence": 85,
  "signs": ["признак1", "признак2"]
}`

    const mimeType = photoBase64.startsWith('data:image/png') ? 'image/png'
      : photoBase64.startsWith('data:image/webp') ? 'image/webp'
      : 'image/jpeg'

    const base64Data = photoBase64.includes(',') ? photoBase64.split(',')[1] : photoBase64

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: base64Data } },
            ],
          }],
          generationConfig: { temperature: 1, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } },
        }),
      },
    )

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Gemini API error text:', errorText)
      throw badRequest('Ошибка Gemini API: ' + geminiResponse.status + ' - ' + errorText)
    }

    const geminiData = await geminiResponse.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>
    }
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    if (!rawText) {
      const finishReason = geminiData.candidates?.[0]?.finishReason ?? 'unknown'
      console.error('Gemini returned empty text, finishReason:', finishReason, JSON.stringify(geminiData))
      throw badRequest(`ИИ не смог проанализировать фото (${finishReason}). Попробуйте другое фото.`)
    }

    // Strip possible markdown code fences
    const jsonText = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

    let parsed: {
      productId: string
      reasonId: string
      quantity: number
      damageType: string | null
      damageDiscoveredAt: string | null
      comment: string
      confidence: number
      signs: string[]
    }
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      console.error('Gemini JSON parse failed. Raw text:', rawText)
      throw badRequest('ИИ вернул неожиданный ответ. Попробуйте ещё раз.')
    }

    const matchedProduct = products.find((p) => p.id === parsed.productId) ?? products[0]
    const matchedReason = reasons.find((r) => r.id === parsed.reasonId) ?? reasons[0]

    response.json({
      productId: matchedProduct.id,
      productName: matchedProduct.name,
      reasonId: matchedReason.id,
      quantity: Math.max(1, Math.round(parsed.quantity || 1)),
      damageType: parsed.damageType || '',
      damageDiscoveredAt: parsed.damageDiscoveredAt || '',
      comment: parsed.comment || '',
      confidence: Math.min(99, Math.max(50, parsed.confidence || 80)),
      signs: Array.isArray(parsed.signs) ? parsed.signs : [],
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/requests', async (request, response, next) => {
  try {
    const publicBaseUrl = getPublicBaseUrl(request)
    const payload = request.body as Partial<WriteOffRecord>
    const [product, sender] = await Promise.all([
      Product.findOne({ refId: payload.productId }).lean(),
      Employee.findOne({ refId: payload.createdById }).lean(),
    ])

    validateCreateRequest(payload, Boolean(product), sender)

    const nextId = await getNextRequestId()
    const createdRequest = await WriteOff.create({
      requestId: nextId,
      outletId: payload.outletId,
      productId: payload.productId,
      quantity: Number(payload.quantity),
      unit: product?.unit,
      reasonId: payload.reasonId,
      type: payload.type,
      deductionEmployeeId:
        payload.type === 'with_deduction' ? payload.deductionEmployeeId : undefined,
      comment: payload.comment?.trim(),
      photoUrl: normalizeIncomingPhotoUrl(payload.photoUrl),
      photoName: payload.photoName,
      photoHash: payload.photoHash,
      extraPhotoUrls: (payload.extraPhotoUrls ?? []).map(url => normalizeIncomingPhotoUrl(url) || ''),
      status: 'pending',
      createdById: payload.createdById,
      createdAt: new Date(),
    })

    await addAuditEvent(nextId, payload.createdById ?? 'unknown', 'Создал заявку')
    response
      .status(201)
      .json({ request: serializeRequest((createdRequest as any).toObject(), publicBaseUrl) })
  } catch (error) {
    next(error)
  }
})

app.patch('/api/requests/:requestId/approve', async (request, response, next) => {
  try {
    const publicBaseUrl = getPublicBaseUrl(request)
    const reviewedById = String(request.body?.reviewedById ?? '')
    if (!reviewedById) throw badRequest('Не передан проверяющий.')

    const current = await WriteOff.findOne({ requestId: request.params.requestId })
    if (!current) throw notFound('Заявка не найдена.')
    if (current.status !== 'pending') throw badRequest('Заявка уже обработана.')
    await assertReviewerAccess(reviewedById, current.outletId)

    const documentId = createIikoDocumentId(current.requestId)
    current.status = 'approved'
    current.reviewedById = reviewedById
    current.reviewedAt = new Date()
    current.iikoDocumentId = documentId
    current.iikoStatusMessage = 'WRITEOFF_DOCUMENT создан в mock-адаптере'
    await current.save()

    await addAuditEvent(current.requestId, reviewedById, 'Подтвердил и отправил в Iiko')
    const mockDocument = await buildIikoMockDocument(current.toObject(), publicBaseUrl)
    emitIikoMockEvent('document.created', mockDocument)
    response.json({ request: serializeRequest(current.toObject(), publicBaseUrl) })
  } catch (error) {
    next(error)
  }
})

app.patch('/api/requests/:requestId/reject', async (request, response, next) => {
  try {
    const publicBaseUrl = getPublicBaseUrl(request)
    const reviewedById = String(request.body?.reviewedById ?? '')
    const rejectionReason = String(request.body?.rejectionReason ?? '').trim()
    if (!reviewedById) throw badRequest('Не передан проверяющий.')
    if (rejectionReason.length < 8) throw badRequest('Укажите причину отклонения.')

    const current = await WriteOff.findOne({ requestId: request.params.requestId })
    if (!current) throw notFound('Заявка не найдена.')
    if (current.status !== 'pending') throw badRequest('Заявка уже обработана.')
    await assertReviewerAccess(reviewedById, current.outletId)

    current.status = 'rejected'
    current.reviewedById = reviewedById
    current.reviewedAt = new Date()
    current.rejectionReason = rejectionReason
    await current.save()

    await addAuditEvent(current.requestId, reviewedById, 'Отклонил заявку')
    response.json({ request: serializeRequest(current.toObject(), publicBaseUrl) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/dev/reset', async (_request, response, next) => {
  try {
    await resetDemoData()
    response.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

app.get(/^\/(?!api(?:\/|$)).*/, (_request, response, next) => {
  const indexPath = path.join(distDir, 'index.html')
  if (!shouldServeWeb || !existsSync(indexPath)) {
    next()
    return
  }

  response.sendFile(indexPath)
})

app.use((error: Error & { status?: number }, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const status = error.status ?? 500
  if (status >= 500) console.error('[Server Error]', error.message, error.stack)
  response.status(status).json({
    error: status >= 500 ? 'Server error' : error.message,
  })
})

await start()

async function start() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is required')
  }

  mongoose.set('strictQuery', true)
  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB ?? 'bahandi_writeoff',
  })
  await seedIfNeeded()

  const server = createServer(app)
  server.listen(apiPort, apiHost, () => {
    console.log(`API ready on http://${apiHost}:${apiPort}`)
    console.log(`MongoDB database: ${mongoose.connection.name}`)
  })

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down API...`)
    server.close(async () => {
      await mongoose.disconnect()
      process.exit(0)
    })
  }

  process.once('SIGINT', () => {
    void shutdown('SIGINT')
  })
  process.once('SIGTERM', () => {
    void shutdown('SIGTERM')
  })
}

async function seedIfNeeded() {
  await syncReferenceData()

  await Counter.findOneAndUpdate(
    { _id: 'request' },
    { $setOnInsert: { seq: 1000 } },
    { upsert: true, setDefaultsOnInsert: true },
  )
}

async function syncReferenceData() {
  await Promise.all([
    Outlet.bulkWrite(
      outletsSeed.map((record) => ({
        updateOne: {
          filter: { refId: record.refId },
          update: { $set: record },
          upsert: true,
        },
      })),
    ),
    Product.bulkWrite(
      productsSeed.map((record) => ({
        updateOne: {
          filter: { refId: record.refId },
          update: { $set: record },
          upsert: true,
        },
      })),
    ),
    Employee.bulkWrite(
      employeesSeed.map((record) => ({
        updateOne: {
          filter: { refId: record.refId },
          update: { $set: record },
          upsert: true,
        },
      })),
    ),
    Reason.bulkWrite(
      reasonsSeed.map((record) => ({
        updateOne: {
          filter: { refId: record.refId },
          update: { $set: record },
          upsert: true,
        },
      })),
    ),
  ])
}

async function resetDemoData() {
  await Promise.all([
    Outlet.deleteMany({}),
    Product.deleteMany({}),
    Employee.deleteMany({}),
    Reason.deleteMany({}),
    WriteOff.deleteMany({}),
    AuditEvent.deleteMany({}),
    Counter.deleteMany({}),
  ])

  await Promise.all([
    Outlet.insertMany(outletsSeed),
    Product.insertMany(productsSeed),
    Employee.insertMany(employeesSeed),
    Reason.insertMany(reasonsSeed),
    Counter.create({ _id: 'request', seq: 1000 }),
  ])
}

async function getNextRequestId() {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'request' },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  ).lean()

  return String(counter?.seq ?? 1029)
}

async function addAuditEvent(requestId: string, userId: string, action: string) {
  await AuditEvent.create({
    eventId: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    requestId,
    userId,
    action,
    createdAt: new Date(),
  })
}

async function getIikoMockDocuments(publicBaseUrl: string) {
  const approvedRequests = await WriteOff.find({
    status: 'approved',
    iikoDocumentId: { $exists: true, $ne: '' },
  })
    .sort({ reviewedAt: -1, createdAt: -1 })
    .limit(80)
    .lean()

  return Promise.all(
    approvedRequests.map((writeOffRequest) =>
      buildIikoMockDocument(writeOffRequest, publicBaseUrl),
    ),
  )
}

async function buildIikoMockDocument(
  writeOffRequest: WriteOffRecord & { _id?: unknown; __v?: number },
  _publicBaseUrl: string,
): Promise<IikoMockDocument> {
  const [outlet, product, reason, sender, reviewer, deductionEmployee] = await Promise.all([
    Outlet.findOne({ refId: writeOffRequest.outletId }).lean(),
    Product.findOne({ refId: writeOffRequest.productId }).lean(),
    Reason.findOne({ refId: writeOffRequest.reasonId }).lean(),
    Employee.findOne({ refId: writeOffRequest.createdById }).lean(),
    writeOffRequest.reviewedById
      ? Employee.findOne({ refId: writeOffRequest.reviewedById }).lean()
      : null,
    writeOffRequest.deductionEmployeeId
      ? Employee.findOne({ refId: writeOffRequest.deductionEmployeeId }).lean()
      : null,
  ])

  const quantity = Number(writeOffRequest.quantity)
  const cost = product?.cost ?? 0
  const documentId = writeOffRequest.iikoDocumentId ?? createIikoDocumentId(writeOffRequest.requestId)
  const itemComment = [
    reason?.name ?? 'Списание',
    writeOffRequest.comment,
    writeOffRequest.photoHash ? `photo=${writeOffRequest.photoHash}` : '',
  ].filter(Boolean).join(' | ')

  return {
    id: documentId,
    requestId: writeOffRequest.requestId,
    status: 'created',
    createdAt: new Date(writeOffRequest.reviewedAt ?? writeOffRequest.createdAt).toISOString(),
    source: 'mock-adapter',
    outlet: {
      id: outlet?.refId ?? writeOffRequest.outletId,
      name: outlet?.name ?? 'Bahandi',
      iikoStoreId: outlet?.iikoStoreId ?? 'mock-store',
    },
    product: {
      id: product?.refId ?? writeOffRequest.productId,
      name: product?.name ?? 'Продукт',
      iikoProductId: product?.iikoProductId ?? 'mock-product',
      quantity,
      unit: writeOffRequest.unit,
      cost,
      amount: Math.round(quantity * cost),
    },
    reason: {
      id: reason?.refId ?? writeOffRequest.reasonId,
      name: reason?.name ?? 'Списание',
    },
    sender: {
      id: sender?.refId ?? writeOffRequest.createdById,
      name: sender?.name ?? 'Сотрудник',
      iikoEmployeeId: sender?.iikoEmployeeId ?? 'mock-sender',
    },
    reviewer: {
      id: reviewer?.refId ?? writeOffRequest.reviewedById ?? 'mock-reviewer',
      name: reviewer?.name ?? 'Проверяющий',
      iikoEmployeeId: reviewer?.iikoEmployeeId ?? 'mock-reviewer',
    },
    deductionEmployee: deductionEmployee
      ? {
          id: deductionEmployee.refId,
          name: deductionEmployee.name,
          iikoEmployeeId: deductionEmployee.iikoEmployeeId,
        }
      : undefined,
    comment: writeOffRequest.comment,
    payload: {
      documentType: 'WRITEOFF_DOCUMENT',
      externalNumber: documentId,
      storeId: outlet?.iikoStoreId ?? 'mock-store',
      items: [
        {
          productId: product?.iikoProductId ?? 'mock-product',
          amount: quantity,
          unit: writeOffRequest.unit,
          comment: itemComment,
        },
      ],
    },
  }
}

function emitIikoMockEvent(event: string, payload: unknown) {
  for (const subscriber of iikoSubscribers) {
    writeIikoEvent(subscriber, event, payload)
  }
}

function writeIikoEvent(response: express.Response, event: string, payload: unknown) {
  response.write(`event: ${event}\n`)
  response.write(`data: ${JSON.stringify(payload)}\n\n`)
}

function getEmployeeOutletIds(employee: Pick<EmployeeRecord, 'outletId' | 'outletIds'>) {
  const outletIds = employee.outletIds?.length ? employee.outletIds : [employee.outletId]
  return [...new Set(outletIds.filter(Boolean))]
}

function canAccessOutlet(employee: EmployeeRecord, outletId?: string) {
  if (!outletId) return false
  return employee.accessScope === 'all' || getEmployeeOutletIds(employee).includes(outletId)
}

function createOutletQuery(employee: EmployeeRecord) {
  if (employee.accessScope === 'all') return {}
  return { refId: { $in: getEmployeeOutletIds(employee) } }
}

function createRequestQuery(employee: EmployeeRecord) {
  if (employee.role === 'sender') return { createdById: employee.refId }
  if (employee.accessScope === 'all') return {}
  return { outletId: { $in: getEmployeeOutletIds(employee) } }
}

function createEmployeeQuery(employee: EmployeeRecord) {
  if (employee.accessScope === 'all') return {}
  const outletIds = getEmployeeOutletIds(employee)
  return {
    $or: [
      { refId: employee.refId },
      { outletId: { $in: outletIds } },
      { outletIds: { $in: outletIds } },
    ],
  }
}

async function assertReviewerAccess(reviewerId: string, outletId: string) {
  const reviewer = await Employee.findOne({ refId: reviewerId }).lean()
  if (!reviewer || reviewer.role !== 'reviewer') {
    throw badRequest('Пользователь не является проверяющим.')
  }
  if (!canAccessOutlet(reviewer, outletId)) {
    throw badRequest('У проверяющего нет доступа к этой торговой точке.')
  }
}

function validateCreateRequest(
  payload: Partial<WriteOffRecord>,
  productExists: boolean,
  sender: EmployeeRecord | null,
) {
  if (!payload.outletId) throw badRequest('Выберите торговую точку.')
  if (!payload.productId || !productExists) throw badRequest('Выберите продукт из справочника.')
  if (!Number.isFinite(Number(payload.quantity)) || Number(payload.quantity) <= 0) {
    throw badRequest('Укажите корректное количество.')
  }
  if (!payload.reasonId) throw badRequest('Выберите причину списания.')
  if (!payload.photoUrl || !payload.photoHash || !payload.photoName) {
    throw badRequest('Добавьте фото продукции.')
  }
  if (!payload.comment || payload.comment.trim().length < 10) {
    throw badRequest('Комментарий должен быть не короче 10 символов.')
  }
  if (payload.type === 'with_deduction' && !payload.deductionEmployeeId) {
    throw badRequest('Выберите сотрудника для удержания.')
  }
  if (!payload.createdById) throw badRequest('Не передан отправитель.')
  if (!sender || sender.role !== 'sender') {
    throw badRequest('Пользователь не является сотрудником торговой точки.')
  }
  if (!canAccessOutlet(sender, payload.outletId)) {
    throw badRequest('Сотрудник не привязан к выбранной торговой точке.')
  }
}

function serializeRefRecord<T extends { refId: string; _id?: unknown; __v?: number }>(record: T) {
  const { refId, ...rest } = stripMongoFields(record)
  return { id: refId, ...rest }
}

function serializeEmployee(record: EmployeeRecord & { _id?: unknown; __v?: number }) {
  const {
    refId,
    password: _password,
    pinCode: _pinCode,
    outletIds,
    accessScope,
    ...rest
  } = stripMongoFields(record) as EmployeeRecord & { pinCode?: string }
  return {
    id: refId,
    ...rest,
    outletIds: outletIds?.length ? outletIds : [rest.outletId],
    accessScope: accessScope ?? 'assigned',
  }
}

function serializeRequest(
  record: WriteOffRecord & { _id?: unknown; __v?: number },
  publicBaseUrl: string,
) {
  const { requestId, createdAt, reviewedAt, ...rest } = stripMongoFields(record)
  return {
    id: requestId,
    ...rest,
    photoUrl: resolvePublicUrl(rest.photoUrl, publicBaseUrl),
    extraPhotoUrls: (rest.extraPhotoUrls ?? []).map(url => resolvePublicUrl(url, publicBaseUrl)),
    createdAt: new Date(createdAt).toISOString(),
    reviewedAt: reviewedAt ? new Date(reviewedAt).toISOString() : undefined,
  }
}

function serializeAuditEvent(record: AuditRecord & { _id?: unknown; __v?: number }) {
  const { eventId, createdAt, ...rest } = stripMongoFields(record)
  return {
    id: eventId,
    ...rest,
    createdAt: new Date(createdAt).toISOString(),
  }
}

function stripMongoFields<T extends { _id?: unknown; __v?: number }>(record: T) {
  const rest = { ...record }
  delete rest._id
  delete rest.__v
  return rest
}

function createIikoDocumentId(requestId: string) {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `WR-${month}${day}-${requestId}`
}

function createCorsOrigin(origin?: string): CorsOptions['origin'] {
  if (!origin || origin === '*') return true
  const allowedOrigins = origin.split(',').map((value) => value.trim()).filter(Boolean)
  return (requestOrigin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    if (!requestOrigin || allowedOrigins.includes(requestOrigin)) {
      callback(null, true)
      return
    }

    callback(new Error('Not allowed by CORS'))
  }
}

function getPublicBaseUrl(request: express.Request) {
  const configuredUrl = process.env.PUBLIC_BASE_URL?.replace(/\/$/, '')
  if (configuredUrl) return configuredUrl
  return `${request.protocol}://${request.get('host')}`
}

function normalizeIncomingPhotoUrl(photoUrl?: string) {
  if (!photoUrl) return photoUrl
  return photoUrl.startsWith('/writeoff-evidence') ? '/writeoff-evidence.png' : photoUrl
}

function resolvePublicUrl(photoUrl: string, publicBaseUrl: string) {
  if (
    photoUrl.startsWith('http://') ||
    photoUrl.startsWith('https://') ||
    photoUrl.startsWith('data:')
  ) {
    return photoUrl
  }

  if (photoUrl.startsWith('/')) return `${publicBaseUrl}${photoUrl}`
  return photoUrl
}

function badRequest(message: string) {
  const error = new Error(message) as Error & { status: number }
  error.status = 400
  return error
}

function notFound(message: string) {
  const error = new Error(message) as Error & { status: number }
  error.status = 404
  return error
}
