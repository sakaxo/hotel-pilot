// Shared frontend domain types for the HotelPilot prototype.
// These mirror the data shapes the Django backend is expected to expose later.

export type UserRole =
  | "Administrator"
  | "Manager"
  | "Receptionist"
  | "Accountant"
  | "Front Desk Staff"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  avatarInitials: string
}

export type RoomStatus =
  | "Available"
  | "Occupied"
  | "Reserved"
  | "Cleaning"
  | "Maintenance"

export interface RoomCategory {
  id: string
  name: string
  description: string
  baseRate: number
  capacity: number
}

export interface Room {
  id: string
  number: string
  categoryId: string
  floor: number
  rate: number
  status: RoomStatus
  currentGuestId: string | null
  housekeepingStatus: "Clean" | "Dirty" | "In Progress"
}

export interface Guest {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  nationality: string
  idType: string
  idNumber: string
  address: string
  registrationDate: string
  status: "Active" | "Inactive"
}

export type ReservationStatus =
  | "Pending"
  | "Confirmed"
  | "Checked In"
  | "Checked Out"
  | "Cancelled"

export type PaymentStatus =
  | "Paid"
  | "Pending"
  | "Failed"
  | "Refunded"
  | "Partially Paid"

export interface Reservation {
  id: string
  reference: string
  guestId: string
  roomId: string
  checkInDate: string
  checkOutDate: string
  adults: number
  children: number
  specialRequests: string
  roomRate: number
  totalAmount: number
  amountPaid: number
  paymentStatus: PaymentStatus
  status: ReservationStatus
  createdAt: string
}

export type CardStatus = "Available" | "Assigned" | "Blocked" | "Lost"

export interface CardHistoryEntry {
  id: string
  date: string
  action: string
  details: string
}

export interface RfidCard {
  id: string
  reference: string
  uid: string
  status: CardStatus
  assignedGuestId: string | null
  assignedRoomId: string | null
  reservationId: string | null
  assignedDate: string | null
  expiryDate: string | null
  history: CardHistoryEntry[]
}

export type AccessResult = "Granted" | "Denied"

export interface AccessLog {
  id: string
  reference: string
  roomId: string
  cardId: string | null
  guestId: string | null
  timestamp: string
  result: AccessResult
  description: string
}

export type PaymentMethod =
  | "Cash"
  | "Card"
  | "Bank Transfer"
  | "Paystack"
  | "Mobile Money"

export interface Payment {
  id: string
  reference: string
  guestId: string
  reservationId: string
  amount: number
  method: PaymentMethod
  date: string
  status: PaymentStatus
  notes: string
}

export type StaffDepartment =
  | "Management"
  | "Front Desk"
  | "Housekeeping"
  | "Accounts"
  | "Security"

export interface StaffMember {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  department: StaffDepartment
  status: "Active" | "Inactive"
  hireDate: string
}

export interface HotelSettings {
  hotelName: string
  tagline: string
  address: string
  phone: string
  email: string
  currency: string
  checkInTime: string
  checkOutTime: string
  cancellationPolicy: string
  lateCheckoutFee: number
  taxRate: number
  paymentMethods: PaymentMethod[]
  cardExpiryDays: number
  autoRevokeOnCheckout: boolean
  notifyOnLowCardInventory: boolean
  notifyOnOverduePayments: boolean
}

export interface Notification {
  id: string
  title: string
  description: string
  timestamp: string
  read: boolean
  type: "info" | "warning" | "success" | "danger"
}

export interface HotelPilotData {
  guests: Guest[]
  roomCategories: RoomCategory[]
  rooms: Room[]
  reservations: Reservation[]
  rfidCards: RfidCard[]
  accessLogs: AccessLog[]
  payments: Payment[]
  staff: StaffMember[]
  settings: HotelSettings
  notifications: Notification[]
}
