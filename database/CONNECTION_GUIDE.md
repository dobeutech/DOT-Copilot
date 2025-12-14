# Database Connection Guide
## MongoDB & Supabase Integration Documentation

**Last Updated:** June 2025  
**Version:** 1.0.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [MongoDB Connection](#mongodb-connection)
3. [Supabase Connection](#supabase-connection)
4. [Code Examples](#code-examples)
5. [Migration Strategy](#migration-strategy)
6. [Best Practices](#best-practices)

---

## Overview

This guide provides comprehensive documentation for connecting to both **MongoDB** and **Supabase** databases in your application. The architecture supports both databases to provide flexibility and allow for future migration.

### Database Comparison

| Feature | MongoDB | Supabase (PostgreSQL) |
|---------|---------|----------------------|
| **Type** | Document Database | Relational Database |
| **Query Language** | MongoDB Query Language | SQL |
| **Schema** | Flexible/Dynamic | Structured/Schema-based |
| **ACID** | Multi-document transactions | Full ACID compliance |
| **Use Case** | Document storage, flexible schemas | Relational data, complex queries |
| **Current Status** | ✅ Active (Startup Grant) | 🔄 Available as alternative |

---

## MongoDB Connection

### Prerequisites

- MongoDB Atlas account (or self-hosted MongoDB)
- Connection string/URI
- Database credentials

### Connection String Format

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

### Environment Variables

Add to your `.env` file:

```bash
# MongoDB Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
MONGO_DATABASE=appdb
MONGO_COLLECTION_USERS=users
MONGO_COLLECTION_DATA=data
```

### Python Connection (PyMongo)

#### Installation

```bash
pip install pymongo motor  # motor for async
```

#### Basic Connection

```python
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv

load_dotenv()

class MongoDBConnection:
    def __init__(self):
        self.uri = os.getenv("MONGO_URI")
        self.database_name = os.getenv("MONGO_DATABASE", "appdb")
        self.client = None
        self.db = None
    
    def connect(self):
        """Establish MongoDB connection"""
        try:
            self.client = MongoClient(
                self.uri,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
                socketTimeoutMS=5000,
                maxPoolSize=50,
                minPoolSize=10
            )
            # Test connection
            self.client.admin.command('ping')
            self.db = self.client[self.database_name]
            print("✅ MongoDB connected successfully")
            return True
        except ConnectionFailure as e:
            print(f"❌ MongoDB connection failed: {e}")
            return False
    
    def disconnect(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            print("MongoDB connection closed")
    
    def get_collection(self, collection_name):
        """Get a collection"""
        if not self.db:
            raise Exception("Database not connected")
        return self.db[collection_name]

# Usage
mongo = MongoDBConnection()
if mongo.connect():
    users_collection = mongo.get_collection("users")
    # Your operations here
    mongo.disconnect()
```

#### Async Connection (Motor)

```python
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

class AsyncMongoDBConnection:
    def __init__(self):
        self.uri = os.getenv("MONGO_URI")
        self.database_name = os.getenv("MONGO_DATABASE", "appdb")
        self.client = None
        self.db = None
    
    async def connect(self):
        """Establish async MongoDB connection"""
        try:
            self.client = AsyncIOMotorClient(
                self.uri,
                serverSelectionTimeoutMS=5000,
                maxPoolSize=50,
                minPoolSize=10
            )
            # Test connection
            await self.client.admin.command('ping')
            self.db = self.client[self.database_name]
            print("✅ MongoDB async connection established")
            return True
        except Exception as e:
            print(f"❌ MongoDB async connection failed: {e}")
            return False
    
    async def disconnect(self):
        """Close async MongoDB connection"""
        if self.client:
            self.client.close()
            print("MongoDB async connection closed")
    
    def get_collection(self, collection_name):
        """Get a collection"""
        if not self.db:
            raise Exception("Database not connected")
        return self.db[collection_name]

# Usage in async function
async def main():
    mongo = AsyncMongoDBConnection()
    if await mongo.connect():
        users_collection = mongo.get_collection("users")
        # Your async operations here
        await mongo.disconnect()
```

### Node.js Connection (Mongoose)

#### Installation

```bash
npm install mongoose
```

#### Basic Connection

```javascript
const mongoose = require('mongoose');
require('dotenv').config();

class MongoDBConnection {
    constructor() {
        this.uri = process.env.MONGO_URI;
        this.databaseName = process.env.MONGO_DATABASE || 'appdb';
    }

    async connect() {
        try {
            await mongoose.connect(this.uri, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 5000,
                maxPoolSize: 50,
                minPoolSize: 10,
            });
            console.log('✅ MongoDB connected successfully');
            return true;
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error);
            return false;
        }
    }

    async disconnect() {
        try {
            await mongoose.disconnect();
            console.log('MongoDB connection closed');
        } catch (error) {
            console.error('Error disconnecting:', error);
        }
    }
}

// Usage
const mongo = new MongoDBConnection();
await mongo.connect();

// Define schema
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Use model
const user = new User({ name: 'John', email: 'john@example.com' });
await user.save();
```

### Common MongoDB Operations

#### CRUD Operations (Python)

```python
from pymongo import MongoClient
from datetime import datetime

client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("MONGO_DATABASE")]
collection = db["users"]

# Create
user = {
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": datetime.utcnow()
}
result = collection.insert_one(user)
print(f"Inserted ID: {result.inserted_id}")

# Read
user = collection.find_one({"email": "john@example.com"})
users = collection.find({"name": {"$regex": "John"}})

# Update
collection.update_one(
    {"email": "john@example.com"},
    {"$set": {"name": "John Smith", "updated_at": datetime.utcnow()}}
)

# Delete
collection.delete_one({"email": "john@example.com"})

# Aggregation
pipeline = [
    {"$match": {"status": "active"}},
    {"$group": {"_id": "$category", "count": {"$sum": 1}}}
]
results = collection.aggregate(pipeline)
```

---

## Supabase Connection

### Prerequisites

- Supabase account (https://supabase.com)
- Project API URL
- Project API Key (anon/service role)

### Environment Variables

Add to your `.env` file:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

### Python Connection (Supabase Client)

#### Installation

```bash
pip install supabase postgrest
```

#### Basic Connection

```python
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

class SupabaseConnection:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.anon_key = os.getenv("SUPABASE_ANON_KEY")
        self.service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        self.client: Client = None
    
    def connect(self, use_service_role=False):
        """Establish Supabase connection"""
        try:
            key = self.service_key if use_service_role else self.anon_key
            self.client = create_client(self.url, key)
            print("✅ Supabase connected successfully")
            return True
        except Exception as e:
            print(f"❌ Supabase connection failed: {e}")
            return False
    
    def get_table(self, table_name):
        """Get a table reference"""
        if not self.client:
            raise Exception("Supabase not connected")
        return self.client.table(table_name)

# Usage
supabase = SupabaseConnection()
if supabase.connect():
    users_table = supabase.get_table("users")
    # Your operations here
```

### Python Connection (Direct PostgreSQL)

#### Installation

```bash
pip install psycopg2-binary sqlalchemy
```

#### Basic Connection

```python
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

class SupabasePostgresConnection:
    def __init__(self):
        self.database_url = os.getenv("SUPABASE_DATABASE_URL")
        self.engine = None
        self.Session = None
    
    def connect(self):
        """Establish PostgreSQL connection"""
        try:
            self.engine = create_engine(
                self.database_url,
                pool_size=10,
                max_overflow=20,
                pool_pre_ping=True,
                echo=False
            )
            self.Session = sessionmaker(bind=self.engine)
            # Test connection
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("✅ Supabase PostgreSQL connected successfully")
            return True
        except Exception as e:
            print(f"❌ Supabase PostgreSQL connection failed: {e}")
            return False
    
    def get_session(self):
        """Get a database session"""
        if not self.Session:
            raise Exception("Database not connected")
        return self.Session()

# Usage
db = SupabasePostgresConnection()
if db.connect():
    session = db.get_session()
    # Your operations here
    session.close()
```

### Node.js Connection (Supabase JS)

#### Installation

```bash
npm install @supabase/supabase-js
```

#### Basic Connection

```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class SupabaseConnection {
    constructor() {
        this.url = process.env.SUPABASE_URL;
        this.anonKey = process.env.SUPABASE_ANON_KEY;
        this.serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        this.client = null;
    }

    connect(useServiceRole = false) {
        try {
            const key = useServiceRole ? this.serviceKey : this.anonKey;
            this.client = createClient(this.url, key);
            console.log('✅ Supabase connected successfully');
            return true;
        } catch (error) {
            console.error('❌ Supabase connection failed:', error);
            return false;
        }
    }

    getTable(tableName) {
        if (!this.client) {
            throw new Error('Supabase not connected');
        }
        return this.client.from(tableName);
    }
}

// Usage
const supabase = new SupabaseConnection();
supabase.connect();

const usersTable = supabase.getTable('users');

// CRUD operations
const { data, error } = await usersTable
    .select('*')
    .eq('email', 'john@example.com');
```

### Common Supabase Operations

#### CRUD Operations (Python - Supabase Client)

```python
from supabase import create_client

supabase = create_client(url, key)
table = supabase.table("users")

# Create
data = {
    "name": "John Doe",
    "email": "john@example.com"
}
result = table.insert(data).execute()

# Read
result = table.select("*").eq("email", "john@example.com").execute()
all_users = table.select("*").execute()

# Update
table.update({"name": "John Smith"}).eq("email", "john@example.com").execute()

# Delete
table.delete().eq("email", "john@example.com").execute()

# Complex queries
result = table.select("*").eq("status", "active").order("created_at", desc=True).limit(10).execute()
```

#### CRUD Operations (Python - SQLAlchemy)

```python
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    name = Column(String)
    email = Column(String, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# Create session
engine = create_engine(database_url)
Session = sessionmaker(bind=engine)
session = Session()

# Create
user = User(name="John Doe", email="john@example.com")
session.add(user)
session.commit()

# Read
user = session.query(User).filter_by(email="john@example.com").first()
users = session.query(User).filter(User.name.like("%John%")).all()

# Update
user.name = "John Smith"
session.commit()

# Delete
session.delete(user)
session.commit()
```

---

## Code Examples

### FastAPI Integration

#### MongoDB FastAPI Route

```python
from fastapi import APIRouter, HTTPException, Depends
from pymongo import MongoClient
import os

router = APIRouter(prefix="/api/v1/mongo", tags=["MongoDB"])

def get_mongo_db():
    client = MongoClient(os.getenv("MONGO_URI"))
    db = client[os.getenv("MONGO_DATABASE")]
    try:
        yield db
    finally:
        client.close()

@router.get("/users")
async def get_users(db = Depends(get_mongo_db)):
    users = list(db.users.find({}, {"_id": 0}))
    return {"users": users}

@router.post("/users")
async def create_user(user_data: dict, db = Depends(get_mongo_db)):
    result = db.users.insert_one(user_data)
    return {"id": str(result.inserted_id), "status": "created"}
```

#### Supabase FastAPI Route

```python
from fastapi import APIRouter, HTTPException, Depends
from supabase import create_client
import os

router = APIRouter(prefix="/api/v1/supabase", tags=["Supabase"])

def get_supabase():
    supabase = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_ANON_KEY")
    )
    return supabase

@router.get("/users")
async def get_users(supabase = Depends(get_supabase)):
    result = supabase.table("users").select("*").execute()
    return {"users": result.data}

@router.post("/users")
async def create_user(user_data: dict, supabase = Depends(get_supabase)):
    result = supabase.table("users").insert(user_data).execute()
    return {"data": result.data, "status": "created"}
```

### Database Abstraction Layer

```python
from abc import ABC, abstractmethod
from typing import List, Dict, Any

class DatabaseAdapter(ABC):
    @abstractmethod
    def connect(self) -> bool:
        pass
    
    @abstractmethod
    def create(self, table: str, data: Dict[str, Any]) -> str:
        pass
    
    @abstractmethod
    def read(self, table: str, filters: Dict[str, Any]) -> List[Dict]:
        pass
    
    @abstractmethod
    def update(self, table: str, filters: Dict[str, Any], data: Dict[str, Any]) -> bool:
        pass
    
    @abstractmethod
    def delete(self, table: str, filters: Dict[str, Any]) -> bool:
        pass

class MongoDBAdapter(DatabaseAdapter):
    def __init__(self, uri: str, database: str):
        self.uri = uri
        self.database = database
        self.client = None
        self.db = None
    
    def connect(self) -> bool:
        from pymongo import MongoClient
        self.client = MongoClient(self.uri)
        self.db = self.client[self.database]
        return True
    
    def create(self, table: str, data: Dict[str, Any]) -> str:
        result = self.db[table].insert_one(data)
        return str(result.inserted_id)
    
    def read(self, table: str, filters: Dict[str, Any]) -> List[Dict]:
        return list(self.db[table].find(filters))
    
    def update(self, table: str, filters: Dict[str, Any], data: Dict[str, Any]) -> bool:
        result = self.db[table].update_one(filters, {"$set": data})
        return result.modified_count > 0
    
    def delete(self, table: str, filters: Dict[str, Any]) -> bool:
        result = self.db[table].delete_one(filters)
        return result.deleted_count > 0

class SupabaseAdapter(DatabaseAdapter):
    def __init__(self, url: str, key: str):
        self.url = url
        self.key = key
        self.client = None
    
    def connect(self) -> bool:
        from supabase import create_client
        self.client = create_client(self.url, self.key)
        return True
    
    def create(self, table: str, data: Dict[str, Any]) -> str:
        result = self.client.table(table).insert(data).execute()
        return result.data[0]['id'] if result.data else None
    
    def read(self, table: str, filters: Dict[str, Any]) -> List[Dict]:
        query = self.client.table(table).select("*")
        for key, value in filters.items():
            query = query.eq(key, value)
        result = query.execute()
        return result.data
    
    def update(self, table: str, filters: Dict[str, Any], data: Dict[str, Any]) -> bool:
        query = self.client.table(table).update(data)
        for key, value in filters.items():
            query = query.eq(key, value)
        result = query.execute()
        return len(result.data) > 0
    
    def delete(self, table: str, filters: Dict[str, Any]) -> bool:
        query = self.client.table(table).delete()
        for key, value in filters.items():
            query = query.eq(key, value)
        result = query.execute()
        return len(result.data) > 0

# Usage - Easy to switch between databases
db_type = os.getenv("DATABASE_TYPE", "mongodb")

if db_type == "mongodb":
    db = MongoDBAdapter(os.getenv("MONGO_URI"), os.getenv("MONGO_DATABASE"))
elif db_type == "supabase":
    db = SupabaseAdapter(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_ANON_KEY"))

db.connect()
```

---

## Migration Strategy

### Phase 1: Dual Write (Both Databases)

```python
class DualWriteDatabase:
    def __init__(self):
        self.mongo = MongoDBAdapter(...)
        self.supabase = SupabaseAdapter(...)
    
    def create(self, table: str, data: dict):
        # Write to both
        mongo_id = self.mongo.create(table, data)
        supabase_id = self.supabase.create(table, data)
        return {"mongo_id": mongo_id, "supabase_id": supabase_id}
```

### Phase 2: Read from Primary, Write to Both

```python
class MigratingDatabase:
    def __init__(self, primary="mongodb"):
        self.primary = primary
        self.mongo = MongoDBAdapter(...)
        self.supabase = SupabaseAdapter(...)
    
    def read(self, table: str, filters: dict):
        if self.primary == "mongodb":
            return self.mongo.read(table, filters)
        else:
            return self.supabase.read(table, filters)
    
    def create(self, table: str, data: dict):
        # Write to both during migration
        mongo_result = self.mongo.create(table, data)
        supabase_result = self.supabase.create(table, data)
        return supabase_result if self.primary == "supabase" else mongo_result
```

### Phase 3: Complete Migration

```python
# Switch primary database
os.environ["DATABASE_TYPE"] = "supabase"
# Remove MongoDB writes
```

---

## Best Practices

### Connection Pooling

**MongoDB:**
```python
client = MongoClient(
    uri,
    maxPoolSize=50,
    minPoolSize=10,
    maxIdleTimeMS=45000
)
```

**Supabase:**
```python
engine = create_engine(
    database_url,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)
```

### Error Handling

```python
try:
    result = db.operation()
except ConnectionError as e:
    logger.error(f"Database connection error: {e}")
    # Retry logic or fallback
except Exception as e:
    logger.error(f"Database error: {e}")
    raise HTTPException(status_code=500, detail="Database error")
```

### Environment-Specific Configuration

```python
import os

if os.getenv("ENVIRONMENT") == "production":
    # Production database settings
    MONGO_URI = os.getenv("MONGO_URI_PROD")
    SUPABASE_URL = os.getenv("SUPABASE_URL_PROD")
else:
    # Development database settings
    MONGO_URI = os.getenv("MONGO_URI_DEV")
    SUPABASE_URL = os.getenv("SUPABASE_URL_DEV")
```

---

## Troubleshooting

### MongoDB Connection Issues

**Problem:** Connection timeout
```python
# Solution: Increase timeout
client = MongoClient(uri, serverSelectionTimeoutMS=10000)
```

**Problem:** Authentication failed
```python
# Solution: Verify credentials in connection string
# Format: mongodb+srv://username:password@cluster.mongodb.net/dbname
```

### Supabase Connection Issues

**Problem:** SSL connection error
```python
# Solution: Verify SSL mode in connection string
# Add: ?sslmode=require
```

**Problem:** Row Level Security blocking queries
```python
# Solution: Use service role key for admin operations
# Or configure RLS policies in Supabase dashboard
```

---

**Document Version:** 1.0.0  
**Last Updated:** June 2025


