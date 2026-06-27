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
type Status = 'pending' | 'approved' | 'rejected' | 'iiko_error'
type WriteOffType = 'without_deduction' | 'with_deduction'

type OutletRecord = {
  refId: string
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
  outletId: string
  iikoEmployeeId: string
  pinCode: string
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
    name: 'Bahandi Dostyk',
    address: 'Достык 109, Алматы',
    iikoStoreId: 'store_alm_dostyk',
  },
  {
    refId: 'outlet-02',
    name: 'Bahandi Mega',
    address: 'ТРЦ MEGA Alma-Ata',
    iikoStoreId: 'store_alm_mega',
  },
  {
    refId: 'outlet-03',
    name: 'Bahandi Aport',
    address: 'Aport Mall, Алматы',
    iikoStoreId: 'store_alm_aport',
  },
]

const productsSeed: ProductRecord[] = [
  {
    refId: 'product-bun',
    name: 'Булочка бриошь',
    unit: 'шт',
    iikoProductId: 'prd_brioche_bun',
    cost: 145,
    category: 'Хлеб',
  },
  {
    refId: 'product-patty',
    name: 'Котлета говяжья',
    unit: 'шт',
    iikoProductId: 'prd_beef_patty',
    cost: 520,
    category: 'Полуфабрикаты',
  },
  {
    refId: 'product-tomato',
    name: 'Помидоры',
    unit: 'кг',
    iikoProductId: 'prd_tomato',
    cost: 890,
    category: 'Овощи',
  },
  {
    refId: 'product-cheese',
    name: 'Сыр чеддер',
    unit: 'шт',
    iikoProductId: 'prd_cheddar_slice',
    cost: 95,
    category: 'Топпинги',
  },
]

const employeesSeed: EmployeeRecord[] = [
  {
    refId: 'user-aibek',
    name: 'Айбек С.',
    role: 'sender',
    outletId: 'outlet-01',
    iikoEmployeeId: 'emp_aibek',
    pinCode: '1111',
  },
  {
    refId: 'user-madina',
    name: 'Мадина К.',
    role: 'sender',
    outletId: 'outlet-02',
    iikoEmployeeId: 'emp_madina',
    pinCode: '1111',
  },
  {
    refId: 'user-timur',
    name: 'Тимур Н.',
    role: 'sender',
    outletId: 'outlet-03',
    iikoEmployeeId: 'emp_timur',
    pinCode: '1111',
  },
  {
    refId: 'user-aigerim',
    name: 'Айгерим О.',
    role: 'reviewer',
    outletId: 'outlet-01',
    iikoEmployeeId: 'emp_aigerim',
    pinCode: '9999',
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
    outletId: { type: String, required: true },
    iikoEmployeeId: { type: String, required: true },
    pinCode: { type: String, required: true },
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
    const userId = String(request.body?.userId ?? '')
    const pinCode = String(request.body?.pinCode ?? '')
    if (!userId || !pinCode) throw badRequest('Выберите пользователя и введите PIN.')

    const employee = await Employee.findOne({ refId: userId }).lean()
    if (!employee || employee.pinCode !== pinCode) {
      throw badRequest('Неверный пользователь или PIN.')
    }

    response.json({
      user: serializeEmployee(employee),
      token: Buffer.from(`${employee.refId}:${employee.role}`).toString('base64url'),
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/bootstrap', async (_request, response, next) => {
  try {
    const publicBaseUrl = getPublicBaseUrl(_request)
    const [outlets, products, employees, reasons, requests, auditEvents] =
      await Promise.all([
        Outlet.find().sort({ refId: 1 }).lean(),
        Product.find().sort({ refId: 1 }).lean(),
        Employee.find().sort({ role: 1, refId: 1 }).lean(),
        Reason.find().sort({ refId: 1 }).lean(),
        WriteOff.find().sort({ createdAt: -1 }).lean(),
        AuditEvent.find().sort({ createdAt: -1 }).lean(),
      ])

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

app.post('/api/requests', async (request, response, next) => {
  try {
    const publicBaseUrl = getPublicBaseUrl(request)
    const payload = request.body as Partial<WriteOffRecord>
    const product = await Product.findOne({ refId: payload.productId }).lean()

    validateCreateRequest(payload, Boolean(product))

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
  const outletCount = await Outlet.countDocuments()
  if (outletCount > 0) return
  await resetDemoData()
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

function validateCreateRequest(payload: Partial<WriteOffRecord>, productExists: boolean) {
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
}

function serializeRefRecord<T extends { refId: string; _id?: unknown; __v?: number }>(record: T) {
  const { refId, ...rest } = stripMongoFields(record)
  return { id: refId, ...rest }
}

function serializeEmployee(record: EmployeeRecord & { _id?: unknown; __v?: number }) {
  const { refId, pinCode: _pinCode, ...rest } = stripMongoFields(record)
  return { id: refId, ...rest }
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
