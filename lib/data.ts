import { MongoClient, Db } from 'mongodb'

const uri = process.env.MONGODB_URI
if (!uri) {
  throw new Error('Missing MONGODB_URI environment variable')
}

const dbName = process.env.MONGODB_DB || 'devboard'

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

const client = new MongoClient(uri)
const clientPromise = global._mongoClientPromise || client.connect()
if (!global._mongoClientPromise) global._mongoClientPromise = clientPromise

export async function readJSON<T>(file: 'projects' | 'modules' | 'tasks' | 'docs' | 'sprints' | 'activity' | 'meta'): Promise<T> {
  const db = await getDb()
  const collection = db.collection(file)
  const items = await collection.find().toArray()
  const cleaned = items.map((item: any) => {
    const copy = { ...item }
    delete copy._id
    return copy
  })
  return { [file]: cleaned } as unknown as T
}

export async function writeJSON(file: 'projects' | 'modules' | 'tasks' | 'docs' | 'sprints' | 'activity' | 'meta', data: unknown): Promise<void> {
  const db = await getDb()
  const collection = db.collection(file)
  const docs = (((data as any)[file] ?? []) as any[]).map((d: any) => {
    const copy = { ...d }
    delete copy._id
    return copy
  })
  await collection.deleteMany({})
  if (docs.length > 0) {
    await collection.insertMany(docs)
  }
}

async function getDb(): Promise<Db> {
  const client = await clientPromise
  return client.db(dbName)
}
