datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum UserRole {
  ADMIN
  MANAGER
  STAFF
  CUSTOMER
  PARTNER
}

enum CustomerType {
  RETAIL
  WHOLESALE
  THIRDPARTY
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PAID
  PARTIALLY_PAID
  REFUNDED
  FAILED
}

enum PaymentType {
  PREPAID
  PAY_ON_DELIVERY
  CREDIT
}

enum InventoryStatus {
  ACTIVE
  INACTIVE
  DISCONTINUED
}

enum MovementType {
  PURCHASE
  SALE
  RETURN
  ADJUSTMENT
  TRANSFER
}

// Authentication Models
model Account {
  id                String    @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?   @db.Text
  access_token      String?   @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?   @db.Text
  session_state     String?
  createdAt         DateTime  @default(now())
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model User {
  id                String              @id @default(cuid())
  name              String?
  email             String              @unique
  emailVerified     DateTime?
  password          String?
  image             String?
  role              UserRole            @default(CUSTOMER)
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  organization      Organization        @relation(fields: [organizationId], references: [id])
  organizationId    String
  accounts          Account[]
  sessions          Session[]
  activities        Activity[]
  inventoryMovements InventoryMovement[]

  @@index([email])
  @@index([organizationId])
}

// Core Business Models
model Organization {
  id            String        @id @default(cuid())
  name          String
  settings      Settings?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  users         User[]
  customers     Customer[]
  products      Product[]
  warehouses    Warehouse[]
  orders        Order[]

  @@index([name])
}

model Customer {
  id            String        @id @default(cuid())
  name          String
  email         String
  phone         String?
  type          CustomerType
  address       String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  organization  Organization  @relation(fields: [organizationId], references: [id])
  organizationId String
  orders        Order[]

  @@unique([email, organizationId])
  @@index([organizationId])
}

model Product {
  id            String           @id @default(cuid())
  sku           String           @unique
  name          String
  description   String?
  quantity      Int              @default(0)
  minStock      Int              @default(10)
  status        InventoryStatus  @default(ACTIVE)
  location      String?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  organization  Organization     @relation(fields: [organizationId], references: [id])
  organizationId String
  warehouse     Warehouse        @relation(fields: [warehouseId], references: [id])
  warehouseId   String
  orderItems    OrderItem[]
  movements     InventoryMovement[]

  @@index([sku])
  @@index([organizationId])
  @@index([warehouseId])
}

model Warehouse {
  id            String        @id @default(cuid())
  name          String
  location      String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  organization  Organization  @relation(fields: [organizationId], references: [id])
  organizationId String
  products      Product[]

  @@index([organizationId])
}

model Order {
  id            String        @id @default(cuid())
  orderNumber   String        @unique
  status        OrderStatus   @default(PENDING)
  paymentStatus PaymentStatus @default(PENDING)
  paymentType   PaymentType   @default(PREPAID)
  total         Float
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  customer      Customer      @relation(fields: [customerId], references: [id])
  customerId    String
  organization  Organization  @relation(fields: [organizationId], references: [id])
  organizationId String
  items         OrderItem[]
  movements     InventoryMovement[]

  @@index([orderNumber])
  @@index([customerId])
  @@index([organizationId])
}

model OrderItem {
  id        String  @id @default(cuid())
  quantity  Int
  price     Float
  
  order     Order   @relation(fields: [orderId], references: [id])
  orderId   String
  product   Product @relation(fields: [productId], references: [id])
  productId String

  @@index([orderId])
  @@index([productId])
}

model InventoryMovement {
  id            String        @id @default(cuid())
  type          MovementType
  quantity      Int
  reference     String?
  notes         String?
  createdAt     DateTime      @default(now())

  product       Product       @relation(fields: [productId], references: [id])
  productId     String
  user          User          @relation(fields: [userId], references: [id])
  userId        String
  order         Order?        @relation(fields: [orderId], references: [id])
  orderId       String?

  @@index([productId])
  @@index([userId])
  @@index([orderId])
}

model Activity {
  id        String   @id @default(cuid())
  action    String
  details   String?
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id])
  userId    String

  @@index([userId])
}

model Settings {
  id                String        @id @default(cuid())
  lowStockThreshold Int           @default(10)
  currency          String        @default("USD")
  notificationEmail String?
  metadata          Json?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  organization      Organization  @relation(fields: [organizationId], references: [id])
  organizationId    String        @unique
}