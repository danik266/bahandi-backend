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

type CounterRecord = {
  _id: string
  seq: number
}

const outletsSeed: OutletRecord[] = [
  {
    refId: 'outlet-01',
    sortOrder: 1,
    name: 'Bahandi Хан Шатыр',
    address: 'Астана, ТРЦ Хан Шатыр, 3 этаж',
    iikoStoreId: 'store_bahandi_001',
  },
  {
    refId: 'outlet-02',
    sortOrder: 2,
    name: 'Bahandi Азия Парк',
    address: 'Астана, ТРЦ Asia park, 3 этаж',
    iikoStoreId: 'store_bahandi_002',
  },
  {
    refId: 'outlet-03',
    sortOrder: 3,
    name: 'Bahandi Мега SilkWay',
    address: 'Астана, ТРЦ Мега SilkWay, 2 этаж',
    iikoStoreId: 'store_bahandi_003',
  },
  {
    refId: 'outlet-004',
    sortOrder: 4,
    name: 'Bahandi Магнум Туран',
    address: 'Астана, проспект Туран, 55д, киоск',
    iikoStoreId: 'store_bahandi_004',
  },
  {
    refId: 'outlet-005',
    sortOrder: 5,
    name: 'Bahandi Чубары',
    address: 'Астана, м-н Шубар, киоск',
    iikoStoreId: 'store_bahandi_005',
  },
  {
    refId: 'outlet-006',
    sortOrder: 6,
    name: 'Bahandi Астана Молл',
    address: 'Астана, проспект Тауелсиздик, 34/7, киоск',
    iikoStoreId: 'store_bahandi_006',
  },
  {
    refId: 'outlet-007',
    sortOrder: 7,
    name: 'Bahandi Петрова',
    address: 'Астана, ул. Алексея Петрова, 22г, 1 этаж',
    iikoStoreId: 'store_bahandi_007',
  },
  {
    refId: 'outlet-008',
    sortOrder: 8,
    name: 'Bahandi Аружан',
    address: 'Астана, ТРЦ Аружан, 3 этаж',
    iikoStoreId: 'store_bahandi_008',
  },
  {
    refId: 'outlet-009',
    sortOrder: 9,
    name: 'Bahandi Иманова',
    address: 'Астана, ул. Аменгельды Иманова, 3, киоск',
    iikoStoreId: 'store_bahandi_009',
  },
  {
    refId: 'outlet-010',
    sortOrder: 10,
    name: 'Bahandi Даму Молл',
    address: 'Астана, ТРЦ Damu Mall, 2 этаж',
    iikoStoreId: 'store_bahandi_010',
  },
  {
    refId: 'outlet-011',
    sortOrder: 11,
    name: 'Bahandi Магнум Кошкарбаева',
    address: 'Астана, Юго-Восток (левая сторона) ж/м',
    iikoStoreId: 'store_bahandi_011',
  },
  {
    refId: 'outlet-012',
    sortOrder: 12,
    name: 'Bahandi Женис',
    address: 'Астана, проспект Женис, 28а, киоск',
    iikoStoreId: 'store_bahandi_012',
  },
  {
    refId: 'outlet-013',
    sortOrder: 13,
    name: 'Bahandi Мангилик Ел',
    address: 'Астана, ЖК Only Sun',
    iikoStoreId: 'store_bahandi_013',
  },
  {
    refId: 'outlet-014',
    sortOrder: 14,
    name: 'Bahandi Тумар',
    address: 'Астана, ул. Сыганак, 1Б/2, киоск',
    iikoStoreId: 'store_bahandi_014',
  },
  {
    refId: 'outlet-015',
    sortOrder: 15,
    name: 'Bahandi АДК',
    address: 'Алматы, ТРЦ Riviera Park',
    iikoStoreId: 'store_bahandi_015',
  },
  {
    refId: 'outlet-016',
    sortOrder: 16,
    name: 'Bahandi Азия Парк',
    address: 'Алматы, ТРК Asia Park, 3 этаж',
    iikoStoreId: 'store_bahandi_016',
  },
  {
    refId: 'outlet-017',
    sortOrder: 17,
    name: 'Bahandi Айнабулак',
    address: 'Алматы, Айнабулак 2 микрорайон, 82/4, киоск',
    iikoStoreId: 'store_bahandi_017',
  },
  {
    refId: 'outlet-018',
    sortOrder: 18,
    name: 'Bahandi Акжар',
    address: 'Алматы, Жандосова 254/9',
    iikoStoreId: 'store_bahandi_018',
  },
  {
    refId: 'outlet-019',
    sortOrder: 19,
    name: 'Bahandi Апорт',
    address: 'Алматы, ТРЦ Молл Апорт, 2 этаж',
    iikoStoreId: 'store_bahandi_019',
  },
  {
    refId: 'outlet-020',
    sortOrder: 20,
    name: 'Bahandi Апорт Кульджинка',
    address: 'Алматы, ТРЦ Aport Mall East',
    iikoStoreId: 'store_bahandi_020',
  },
  {
    refId: 'outlet-021',
    sortOrder: 21,
    name: 'Bahandi Атакент',
    address: 'Алматы, ул. Ауэзова, 140, 1 этаж',
    iikoStoreId: 'store_bahandi_021',
  },
  {
    refId: 'outlet-022',
    sortOrder: 22,
    name: 'Bahandi Байтурсынова',
    address: 'Алматы, ул. Байтурсынова, 61, 1 этаж',
    iikoStoreId: 'store_bahandi_022',
  },
  {
    refId: 'outlet-023',
    sortOrder: 23,
    name: 'Bahandi Белинского',
    address: 'Алматы, ул. Ильяса Жансугурова, 258, киоск',
    iikoStoreId: 'store_bahandi_023',
  },
  {
    refId: 'outlet-024',
    sortOrder: 24,
    name: 'Bahandi Бесагаш',
    address: 'Алматы, с. Бесагаш, ул. Райымбек батыра, 250/1, киоск',
    iikoStoreId: 'store_bahandi_024',
  },
  {
    refId: 'outlet-025',
    sortOrder: 25,
    name: 'Bahandi ВАЗ',
    address: 'Алматы, ул. Тукая, 28, 1 этаж',
    iikoStoreId: 'store_bahandi_025',
  },
  {
    refId: 'outlet-026',
    sortOrder: 26,
    name: 'Bahandi Весновка',
    address: 'Алматы, Коктем-2 микрорайон, 22, киоск',
    iikoStoreId: 'store_bahandi_026',
  },
  {
    refId: 'outlet-027',
    sortOrder: 27,
    name: 'Bahandi Водник',
    address: 'Алматы, Рынок Алатау',
    iikoStoreId: 'store_bahandi_027',
  },
  {
    refId: 'outlet-028',
    sortOrder: 28,
    name: 'Bahandi Гагарина',
    address: 'Алматы, проспект Гагарина, 41, 1 этаж',
    iikoStoreId: 'store_bahandi_028',
  },
  {
    refId: 'outlet-029',
    sortOrder: 29,
    name: 'Bahandi Глобус Фудкорт',
    address: 'Алматы, ТРЦ Globus, 2 этаж',
    iikoStoreId: 'store_bahandi_029',
  },
  {
    refId: 'outlet-030',
    sortOrder: 30,
    name: 'Bahandi ГРЭС',
    address: 'Алматы, с. Отеген Батыра, ул. Жансугурова, 15а',
    iikoStoreId: 'store_bahandi_030',
  },
  {
    refId: 'outlet-031',
    sortOrder: 31,
    name: 'Bahandi Дружба',
    address: 'Алматы, ул. Шамгона Кажыгалиева, 22',
    iikoStoreId: 'store_bahandi_031',
  },
  {
    refId: 'outlet-032',
    sortOrder: 32,
    name: 'Bahandi Жаркент',
    address: 'Алматы, Панфиловский р-н, г. Жаркент, ул. Юлдашева, 7а, киоск',
    iikoStoreId: 'store_bahandi_032',
  },
  {
    refId: 'outlet-033',
    sortOrder: 33,
    name: 'Bahandi Жубанова',
    address: 'Алматы, Аксай-4 микрорайон, 22а/3, киоск',
    iikoStoreId: 'store_bahandi_033',
  },
  {
    refId: 'outlet-034',
    sortOrder: 34,
    name: 'Bahandi Жумалиева',
    address: 'Алматы, ул. Толе би, 147, 1 этаж',
    iikoStoreId: 'store_bahandi_034',
  },
  {
    refId: 'outlet-035',
    sortOrder: 35,
    name: 'Bahandi Каменка',
    address: 'Алматы, ул. Керуентау, 2/1, 1 этаж',
    iikoStoreId: 'store_bahandi_035',
  },
  {
    refId: 'outlet-036',
    sortOrder: 36,
    name: 'Bahandi Капчагай',
    address: 'Алматы, г. Конаев, Алматинская улица, 64а, киоск',
    iikoStoreId: 'store_bahandi_036',
  },
  {
    refId: 'outlet-037',
    sortOrder: 37,
    name: 'Bahandi Каскелен',
    address: 'Алматы, г. Каскелен, ул. Абен Омиралы, 99',
    iikoStoreId: 'store_bahandi_037',
  },
  {
    refId: 'outlet-038',
    sortOrder: 38,
    name: 'Bahandi Кунаева',
    address: 'Алматы, Абая проспект, 27, киоск',
    iikoStoreId: 'store_bahandi_038',
  },
  {
    refId: 'outlet-039',
    sortOrder: 39,
    name: 'Bahandi Магнум Акбулак',
    address: 'Алматы, Акбулак микрорайон, ул. Байтерекова, 6/1, 1 этаж',
    iikoStoreId: 'store_bahandi_039',
  },
  {
    refId: 'outlet-040',
    sortOrder: 40,
    name: 'Bahandi Магнум Аксуат',
    address: 'Алматы, ул. Аксуат, 128/2, киоск',
    iikoStoreId: 'store_bahandi_040',
  },
  {
    refId: 'outlet-041',
    sortOrder: 41,
    name: 'Bahandi Магнум Бесагаш',
    address: 'Алматы, Медеуский район, ул. Халиуллина, 194/3, киоск',
    iikoStoreId: 'store_bahandi_041',
  },
  {
    refId: 'outlet-042',
    sortOrder: 42,
    name: 'Bahandi Магнум Гагарина',
    address: 'Алматы, проспект Гагарина, 41, 1 этаж',
    iikoStoreId: 'store_bahandi_042',
  },
  {
    refId: 'outlet-043',
    sortOrder: 43,
    name: 'Bahandi Джангильдина',
    address: 'Алматы, ул. Демьяна Бедного, 3/2, киоск',
    iikoStoreId: 'store_bahandi_043',
  },
  {
    refId: 'outlet-044',
    sortOrder: 44,
    name: 'Bahandi Магнум Жетысу',
    address: 'Алматы, Жетысу-3 микрорайон, 1г/3, киоск',
    iikoStoreId: 'store_bahandi_044',
  },
  {
    refId: 'outlet-045',
    sortOrder: 45,
    name: 'Bahandi Максима',
    address: 'Алматы, ТРК Maxima, 3 этаж',
    iikoStoreId: 'store_bahandi_045',
  },
  {
    refId: 'outlet-046',
    sortOrder: 46,
    name: 'Bahandi Масанчи',
    address: 'Алматы, ул. Масанчи, 96, цокольный этаж',
    iikoStoreId: 'store_bahandi_046',
  },
  {
    refId: 'outlet-047',
    sortOrder: 47,
    name: 'Bahandi Масато',
    address: 'Алматы, ул. Ораза Жандосова, 162а',
    iikoStoreId: 'store_bahandi_047',
  },
  {
    refId: 'outlet-048',
    sortOrder: 48,
    name: 'Bahandi Мега Парк Сейфуллина',
    address: 'Алматы, ТРК MEGA Park, 3 этаж',
    iikoStoreId: 'store_bahandi_048',
  },
  {
    refId: 'outlet-049',
    sortOrder: 49,
    name: 'Bahandi Мега Центр Розыбакиева',
    address: 'Алматы, ТРЦ Mega Center Alma-Ata',
    iikoStoreId: 'store_bahandi_049',
  },
  {
    refId: 'outlet-050',
    sortOrder: 50,
    name: 'Bahandi Мерей',
    address: 'Алматы, проспект Суюнбая, 2/Б, киоск',
    iikoStoreId: 'store_bahandi_050',
  },
  {
    refId: 'outlet-051',
    sortOrder: 51,
    name: 'Bahandi Орбита',
    address: 'Алматы, микрорайон Орбита-3, ул. Мустафина, 5Б/1, киоск',
    iikoStoreId: 'store_bahandi_051',
  },
  {
    refId: 'outlet-052',
    sortOrder: 52,
    name: 'Bahandi Панфилова',
    address: 'Алматы, ул. Панфилова, 110, киоск',
    iikoStoreId: 'store_bahandi_052',
  },
  {
    refId: 'outlet-053',
    sortOrder: 53,
    name: 'Bahandi Ритц Палас',
    address: 'Алматы, Самал-3 микрорайон, 2а, киоск',
    iikoStoreId: 'store_bahandi_053',
  },
  {
    refId: 'outlet-054',
    sortOrder: 54,
    name: 'Bahandi Сары Арка',
    address: 'Алматы, рынок Сары Арка',
    iikoStoreId: 'store_bahandi_054',
  },
  {
    refId: 'outlet-055',
    sortOrder: 55,
    name: 'Bahandi Спутник',
    address: 'Алматы, ТРЦ SPUTNIK mall, 3 этаж',
    iikoStoreId: 'store_bahandi_055',
  },
  {
    refId: 'outlet-056',
    sortOrder: 56,
    name: 'Bahandi Талгар',
    address: 'Алматы, г. Талгар, ул. Кунаева, 140',
    iikoStoreId: 'store_bahandi_056',
  },
  {
    refId: 'outlet-057',
    sortOrder: 57,
    name: 'Bahandi Тастак',
    address: 'Алматы, Тастак-3 микрорайон, ул. Толе би, 229/3, киоск',
    iikoStoreId: 'store_bahandi_057',
  },
  {
    refId: 'outlet-058',
    sortOrder: 58,
    name: 'Bahandi Татарка',
    address: 'Алматы, ул. Оренбургская, 2, 1 этаж',
    iikoStoreId: 'store_bahandi_058',
  },
  {
    refId: 'outlet-059',
    sortOrder: 59,
    name: 'Bahandi Торнадо',
    address: 'Алматы, микрорайон 3-й, 20а, 1 этаж',
    iikoStoreId: 'store_bahandi_059',
  },
  {
    refId: 'outlet-060',
    sortOrder: 60,
    name: 'Bahandi Форум',
    address: 'Алматы, проспект Сейфуллина, 617, киоск',
    iikoStoreId: 'store_bahandi_060',
  },
  {
    refId: 'outlet-061',
    sortOrder: 61,
    name: 'Bahandi ЦУМ',
    address: 'Алматы, ТД ЦУМ, 1 этаж',
    iikoStoreId: 'store_bahandi_061',
  },
  {
    refId: 'outlet-062',
    sortOrder: 62,
    name: 'Bahandi Шолохова',
    address: 'Алматы, ул. Шолохова, 8, киоск',
    iikoStoreId: 'store_bahandi_062',
  },
  {
    refId: 'outlet-063',
    sortOrder: 63,
    name: 'Bahandi АДК Ривер',
    address: 'Усть-Каменогорск, ТРК ADK River, 3 этаж',
    iikoStoreId: 'store_bahandi_063',
  },
  {
    refId: 'outlet-064',
    sortOrder: 64,
    name: 'Bahandi Макси Молл',
    address: 'Усть-Каменогорск, ТРЦ Maxi Mall, 2 этаж',
    iikoStoreId: 'store_bahandi_064',
  },
  {
    refId: 'outlet-065',
    sortOrder: 65,
    name: 'Bahandi Даймонд Плаза',
    address: 'Шымкент, ТРК Diamond plaza, 4 этаж',
    iikoStoreId: 'store_bahandi_065',
  },
  {
    refId: 'outlet-066',
    sortOrder: 66,
    name: 'Bahandi Дала Молл',
    address: 'Шымкент, ТЦ Dala Mall, 2 этаж',
    iikoStoreId: 'store_bahandi_066',
  },
  {
    refId: 'outlet-067',
    sortOrder: 67,
    name: 'Bahandi Динара',
    address: 'Шымкент, проспект Республики, 40/1, 1 этаж',
    iikoStoreId: 'store_bahandi_067',
  },
  {
    refId: 'outlet-068',
    sortOrder: 68,
    name: 'Bahandi Керемет',
    address: 'Шымкент, ул. Байтурсынова, 81, 1 этаж',
    iikoStoreId: 'store_bahandi_068',
  },
  {
    refId: 'outlet-069',
    sortOrder: 69,
    name: 'Bahandi Роял Плаза',
    address: 'Шымкент, ТРЦ Royal Plaza, 0 этаж',
    iikoStoreId: 'store_bahandi_069',
  },
  {
    refId: 'outlet-070',
    sortOrder: 70,
    name: 'Bahandi Север',
    address: 'Шымкент, ТЦ Север, 1 этаж',
    iikoStoreId: 'store_bahandi_070',
  },
  {
    refId: 'outlet-071',
    sortOrder: 71,
    name: 'Bahandi Сити Молл',
    address: 'Шымкент, ТРЦ Shymkent City Mall, 3 этаж',
    iikoStoreId: 'store_bahandi_071',
  },
  {
    refId: 'outlet-072',
    sortOrder: 72,
    name: 'Bahandi Таукехана',
    address: 'Шымкент, проспект Тауке хана, 112, киоск',
    iikoStoreId: 'store_bahandi_072',
  },
  {
    refId: 'outlet-073',
    sortOrder: 73,
    name: 'Bahandi Янги Шахар',
    address: 'Шымкент, Тамерлановское шоссе, 1а/8, киоск',
    iikoStoreId: 'store_bahandi_073',
  },
  {
    refId: 'outlet-074',
    sortOrder: 74,
    name: 'Bahandi Гульжан',
    address: 'Караганда, микрорайон Степной-1, 5/8, киоск',
    iikoStoreId: 'store_bahandi_074',
  },
  {
    refId: 'outlet-075',
    sortOrder: 75,
    name: 'Bahandi Строителей',
    address: 'Караганда, проспект Строителей, 35, киоск',
    iikoStoreId: 'store_bahandi_075',
  },
  {
    refId: 'outlet-076',
    sortOrder: 76,
    name: 'Bahandi ЦУМ',
    address: 'Караганда, ТЦ ЦУМ, 3 этаж',
    iikoStoreId: 'store_bahandi_076',
  },
  {
    refId: 'outlet-077',
    sortOrder: 77,
    name: 'Bahandi Шахтеров',
    address: 'Караганда, проспект Шахтеров, 82/3, киоск',
    iikoStoreId: 'store_bahandi_077',
  },
  {
    refId: 'outlet-078',
    sortOrder: 78,
    name: 'Bahandi Юбилейный',
    address: 'Караганда, проспект Нуркена Абдирова, 38, киоск',
    iikoStoreId: 'store_bahandi_078',
  },
  {
    refId: 'outlet-079',
    sortOrder: 79,
    name: 'Bahandi Сая Парк',
    address: 'Актау, ТЦ Saya Park, 2 этаж',
    iikoStoreId: 'store_bahandi_079',
  },
  {
    refId: 'outlet-080',
    sortOrder: 80,
    name: 'Bahandi Грин Плаза',
    address: 'Актау, ЖК Green Plaza',
    iikoStoreId: 'store_bahandi_080',
  },
  {
    refId: 'outlet-081',
    sortOrder: 81,
    name: 'Bahandi Байзаар',
    address: 'Атырау, ТРЦ Baizaar, 3 этаж',
    iikoStoreId: 'store_bahandi_081',
  },
  {
    refId: 'outlet-082',
    sortOrder: 82,
    name: 'Bahandi Инфинити Молл',
    address: 'Атырау, ТРЦ Infinity Mall, 3 этаж',
    iikoStoreId: 'store_bahandi_082',
  },
  {
    refId: 'outlet-083',
    sortOrder: 83,
    name: 'Bahandi Рио',
    address: 'Кокшетау, ТРЦ РИО, 4 этаж',
    iikoStoreId: 'store_bahandi_083',
  },
  {
    refId: 'outlet-084',
    sortOrder: 84,
    name: 'Bahandi Март',
    address: 'Костанай, ТРЦ MART, 3 этаж',
    iikoStoreId: 'store_bahandi_084',
  },
  {
    refId: 'outlet-085',
    sortOrder: 85,
    name: 'Bahandi Март',
    address: 'Тараз, ТРЦ Mart, 3 этаж',
    iikoStoreId: 'store_bahandi_085',
  },
  {
    refId: 'outlet-086',
    sortOrder: 86,
    name: 'Bahandi Далида Сити',
    address: 'Актобе, ТРЦ Dalida Plaza, 2 этаж',
    iikoStoreId: 'store_bahandi_086',
  },
  {
    refId: 'outlet-087',
    sortOrder: 87,
    name: 'Bahandi Жибек Жолы',
    address: 'Астана, ТРЦ Жибек Жолы, 3 этаж',
    iikoStoreId: 'store_bahandi_087',
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
    name: 'Айбек С.',
    role: 'sender',
    login: 'aibek',
    password: 'demo123',
    outletId: 'outlet-01',
    outletIds: ['outlet-01'],
    accessScope: 'assigned',
    iikoEmployeeId: 'emp_aibek',
  },
  {
    refId: 'user-madina',
    name: 'Мадина К.',
    role: 'sender',
    login: 'madina',
    password: 'demo123',
    outletId: 'outlet-02',
    outletIds: ['outlet-02'],
    accessScope: 'assigned',
    iikoEmployeeId: 'emp_madina',
  },
  {
    refId: 'user-timur',
    name: 'Тимур Н.',
    role: 'sender',
    login: 'timur',
    password: 'demo123',
    outletId: 'outlet-03',
    outletIds: ['outlet-03'],
    accessScope: 'assigned',
    iikoEmployeeId: 'emp_timur',
  },
  {
    refId: 'user-aigerim',
    name: 'Айгерим О.',
    role: 'reviewer',
    login: 'aigerim',
    password: 'review123',
    outletId: 'outlet-01',
    outletIds: ['outlet-01', 'outlet-02', 'outlet-03'],
    accessScope: 'assigned',
    iikoEmployeeId: 'emp_aigerim',
  },
  {
    refId: 'user-manager',
    name: 'Главный проверяющий',
    role: 'reviewer',
    login: 'manager',
    password: 'manager123',
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

const requestsSeed: WriteOffRecord[] = [
  {
    requestId: '1028',
    outletId: 'outlet-01',
    productId: 'product-bun',
    quantity: 3,
    unit: 'шт',
    reasonId: 'damaged',
    type: 'without_deduction',
    comment: 'Булочки помялись при приемке, внешний вид не соответствует стандарту.',
    photoUrl: '/writeoff-evidence.png',
    photoName: 'writeoff-evidence.png',
    photoHash: 'sha256:demo-7f31a9c2',
    status: 'pending',
    createdById: 'user-aibek',
    createdAt: new Date('2026-06-27T08:42:00+05:00'),
  },
  {
    requestId: '1027',
    outletId: 'outlet-02',
    productId: 'product-patty',
    quantity: 1,
    unit: 'шт',
    reasonId: 'sanitary',
    type: 'with_deduction',
    deductionEmployeeId: 'user-madina',
    comment: 'Котлета упала на пол во время сборки заказа, повторное использование запрещено.',
    photoUrl: '/writeoff-evidence.png',
    photoName: 'fallen-patty.png',
    photoHash: 'sha256:demo-90e45a11',
    status: 'pending',
    createdById: 'user-madina',
    createdAt: new Date('2026-06-27T09:15:00+05:00'),
  },
  {
    requestId: '1026',
    outletId: 'outlet-03',
    productId: 'product-tomato',
    quantity: 1.4,
    unit: 'кг',
    reasonId: 'expired',
    type: 'without_deduction',
    comment: 'Помидоры стали мягкими после хранения, часть партии нельзя использовать.',
    photoUrl: '/writeoff-evidence.png',
    photoName: 'tomatoes.png',
    photoHash: 'sha256:demo-177ac3f0',
    status: 'approved',
    createdById: 'user-timur',
    reviewedById: 'user-aigerim',
    iikoDocumentId: 'WR-2706-026',
    iikoStatusMessage: 'WRITEOFF_DOCUMENT создан в mock-адаптере',
    createdAt: new Date('2026-06-27T07:58:00+05:00'),
    reviewedAt: new Date('2026-06-27T08:22:00+05:00'),
  },
  {
    requestId: '1025',
    outletId: 'outlet-01',
    productId: 'product-cheese',
    quantity: 6,
    unit: 'шт',
    reasonId: 'leftover',
    type: 'without_deduction',
    comment: 'Остаток после приготовления не был промаркирован вовремя.',
    photoUrl: '/writeoff-evidence.png',
    photoName: 'cheese-leftover.png',
    photoHash: 'sha256:demo-bca132e1',
    status: 'rejected',
    createdById: 'user-aibek',
    reviewedById: 'user-aigerim',
    rejectionReason: 'На фото не видна маркировка и количество продукции.',
    createdAt: new Date('2026-06-26T22:18:00+05:00'),
    reviewedAt: new Date('2026-06-26T22:43:00+05:00'),
  },
]

const auditSeed: AuditRecord[] = [
  {
    eventId: 'audit-1',
    requestId: '1028',
    userId: 'user-aibek',
    action: 'Создал заявку',
    createdAt: new Date('2026-06-27T08:42:00+05:00'),
  },
  {
    eventId: 'audit-2',
    requestId: '1027',
    userId: 'user-madina',
    action: 'Создала заявку с удержанием',
    createdAt: new Date('2026-06-27T09:15:00+05:00'),
  },
  {
    eventId: 'audit-3',
    requestId: '1026',
    userId: 'user-timur',
    action: 'Создал заявку',
    createdAt: new Date('2026-06-27T07:58:00+05:00'),
  },
  {
    eventId: 'audit-4',
    requestId: '1026',
    userId: 'user-aigerim',
    action: 'Подтвердила и отправила в Iiko',
    createdAt: new Date('2026-06-27T08:22:00+05:00'),
  },
  {
    eventId: 'audit-5',
    requestId: '1025',
    userId: 'user-aigerim',
    action: 'Отклонила заявку',
    createdAt: new Date('2026-06-26T22:43:00+05:00'),
  },
]

const outletSchema = new Schema<OutletRecord>(
  {
    refId: { type: String, required: true, unique: true },
    sortOrder: { type: Number, required: true, index: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
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
    console.log('🔍 Login request - body:', JSON.stringify(request.body), 'headers:', request.headers)
    const login = String(request.body?.login ?? '').trim().toLowerCase()
    const password = String(request.body?.password ?? '')
    console.log(`🔍 Extracted - login: "${login}" (length: ${login.length}), password: "${password}" (length: ${password.length})`)
    
    if (!login || !password) {
      console.log('❌ Missing login or password')
      throw badRequest('Введите логин и пароль.')
    }

    const employee = await Employee.findOne({ login }).lean()
    console.log('🔍 Found employee:', employee ? employee.login : 'not found')
    
    if (!employee || employee.password !== password) {
      console.log('❌ Invalid credentials')
      throw badRequest('Неверный логин или пароль.')
    }

    console.log('✅ Login successful for:', login)
    response.json({
      user: serializeEmployee(employee),
      token: Buffer.from(`${employee.refId}:${employee.role}:${employee.login}`).toString('base64url'),
    })
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
      status: 'pending',
      createdById: payload.createdById,
      createdAt: new Date(),
    })

    await addAuditEvent(nextId, payload.createdById ?? 'unknown', 'Создал заявку')
    response
      .status(201)
      .json({ request: serializeRequest(createdRequest.toObject(), publicBaseUrl) })
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

  const writeOffCount = await WriteOff.countDocuments()
  if (writeOffCount > 0) return

  await Promise.all([
    WriteOff.insertMany(requestsSeed),
    AuditEvent.insertMany(auditSeed),
    Counter.findOneAndUpdate(
      { _id: 'request' },
      { $set: { seq: 1028 } },
      { upsert: true, setDefaultsOnInsert: true },
    ),
  ])
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
          update: { $set: record, $unset: { pinCode: '' } },
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
    WriteOff.insertMany(requestsSeed),
    AuditEvent.insertMany(auditSeed),
    Counter.create({ _id: 'request', seq: 1028 }),
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
