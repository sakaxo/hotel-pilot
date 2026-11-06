import type {
  AccessLog,
  Guest,
  HotelPilotData,
  HotelSettings,
  Notification,
  Payment,
  Reservation,
  RfidCard,
  Room,
  RoomCategory,
  StaffMember,
} from "@/types"

// --- date helpers -----------------------------------------------------------
// All seed dates are generated relative to "today" so the dashboard and
// operational screens always look current when the prototype is opened.

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function toTimestamp(date: Date): string {
  return date.toISOString()
}

// --- room categories ---------------------------------------------------------

export const ROOM_CATEGORIES: RoomCategory[] = [
  {
    id: "cat-standard-single",
    name: "Standard Single",
    description: "Compact room with a single bed, ideal for solo travellers.",
    baseRate: 65,
    capacity: 1,
  },
  {
    id: "cat-standard-double",
    name: "Standard Double",
    description: "Comfortable room with a double bed for two guests.",
    baseRate: 85,
    capacity: 2,
  },
  {
    id: "cat-deluxe",
    name: "Deluxe",
    description: "Spacious room with upgraded amenities and a city view.",
    baseRate: 120,
    capacity: 2,
  },
  {
    id: "cat-executive-suite",
    name: "Executive Suite",
    description: "Suite with a separate lounge area and premium furnishing.",
    baseRate: 180,
    capacity: 3,
  },
  {
    id: "cat-presidential-suite",
    name: "Presidential Suite",
    description: "Top-tier suite with panoramic views and butler service.",
    baseRate: 320,
    capacity: 4,
  },
]

function buildRooms(): Room[] {
  const rooms: Room[] = []
  const categoryCycle = [
    "cat-standard-single",
    "cat-standard-double",
    "cat-standard-double",
    "cat-deluxe",
    "cat-executive-suite",
  ]
  let roomIndex = 0
  for (let floor = 1; floor <= 5; floor += 1) {
    for (let unit = 1; unit <= 5; unit += 1) {
      roomIndex += 1
      const number = `${floor}0${unit}`
      const categoryId =
        floor === 5 && unit === 5
          ? "cat-presidential-suite"
          : categoryCycle[(roomIndex - 1) % categoryCycle.length]
      const category = ROOM_CATEGORIES.find((c) => c.id === categoryId)!
      rooms.push({
        id: `room-${number}`,
        number,
        categoryId,
        floor,
        rate: category.baseRate,
        status: "Available",
        currentGuestId: null,
        housekeepingStatus: "Clean",
      })
    }
  }
  return rooms
}

export const ROOMS: Room[] = buildRooms()

// --- guests ------------------------------------------------------------------

const GUEST_SEED: Array<
  Omit<Guest, "id" | "registrationDate" | "status"> & { daysAgoRegistered: number }
> = [
  {
    firstName: "Amara",
    lastName: "Chukwu",
    email: "amara.chukwu@example.com",
    phone: "+234 801 234 5678",
    nationality: "Nigerian",
    idType: "National ID",
    idNumber: "NGA-00123456",
    address: "12 Allen Avenue, Lagos",
    daysAgoRegistered: 180,
  },
  {
    firstName: "Daniel",
    lastName: "Mensah",
    email: "daniel.mensah@example.com",
    phone: "+233 24 567 8901",
    nationality: "Ghanaian",
    idType: "Passport",
    idNumber: "GHA-P0098712",
    address: "4 Ring Road Central, Accra",
    daysAgoRegistered: 95,
  },
  {
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@example.com",
    phone: "+1 415 555 0132",
    nationality: "American",
    idType: "Passport",
    idNumber: "USA-556231478",
    address: "88 Market Street, San Francisco",
    daysAgoRegistered: 60,
  },
  {
    firstName: "Liam",
    lastName: "O'Connor",
    email: "liam.oconnor@example.com",
    phone: "+353 85 123 4567",
    nationality: "Irish",
    idType: "Passport",
    idNumber: "IRL-778812233",
    address: "21 Grafton Street, Dublin",
    daysAgoRegistered: 150,
  },
  {
    firstName: "Fatima",
    lastName: "Al-Sayed",
    email: "fatima.alsayed@example.com",
    phone: "+971 50 123 9988",
    nationality: "Emirati",
    idType: "National ID",
    idNumber: "ARE-78123456",
    address: "Sheikh Zayed Road, Dubai",
    daysAgoRegistered: 40,
  },
  {
    firstName: "Kwame",
    lastName: "Boateng",
    email: "kwame.boateng@example.com",
    phone: "+233 20 456 1122",
    nationality: "Ghanaian",
    idType: "Driver's Licence",
    idNumber: "GHA-DL556621",
    address: "15 Oxford Street, Osu",
    daysAgoRegistered: 300,
  },
  {
    firstName: "Chidinma",
    lastName: "Okafor",
    email: "chidinma.okafor@example.com",
    phone: "+234 802 998 1122",
    nationality: "Nigerian",
    idType: "Passport",
    idNumber: "NGA-P0045521",
    address: "9 Adeola Odeku Street, Victoria Island",
    daysAgoRegistered: 20,
  },
  {
    firstName: "Mark",
    lastName: "Williams",
    email: "mark.williams@example.com",
    phone: "+44 7700 900123",
    nationality: "British",
    idType: "Passport",
    idNumber: "GBR-998811223",
    address: "221B Baker Street, London",
    daysAgoRegistered: 10,
  },
  {
    firstName: "Grace",
    lastName: "Adeyemi",
    email: "grace.adeyemi@example.com",
    phone: "+234 803 112 2334",
    nationality: "Nigerian",
    idType: "National ID",
    idNumber: "NGA-00998877",
    address: "3 Gimbiya Street, Abuja",
    daysAgoRegistered: 5,
  },
  {
    firstName: "Yusuf",
    lastName: "Ibrahim",
    email: "yusuf.ibrahim@example.com",
    phone: "+234 805 667 7889",
    nationality: "Nigerian",
    idType: "Passport",
    idNumber: "NGA-P0067712",
    address: "27 Ahmadu Bello Way, Kaduna",
    daysAgoRegistered: 75,
  },
  {
    firstName: "Elena",
    lastName: "Petrova",
    email: "elena.petrova@example.com",
    phone: "+359 88 123 4567",
    nationality: "Bulgarian",
    idType: "Passport",
    idNumber: "BGR-556123478",
    address: "5 Vitosha Boulevard, Sofia",
    daysAgoRegistered: 2,
  },
  {
    firstName: "Tunde",
    lastName: "Bakare",
    email: "tunde.bakare@example.com",
    phone: "+234 806 334 5566",
    nationality: "Nigerian",
    idType: "National ID",
    idNumber: "NGA-00554433",
    address: "18 Awolowo Road, Ikoyi",
    daysAgoRegistered: 1,
  },
]

const today = new Date()

export const GUESTS: Guest[] = GUEST_SEED.map((seed, index) => ({
  id: `guest-${index + 1}`,
  firstName: seed.firstName,
  lastName: seed.lastName,
  email: seed.email,
  phone: seed.phone,
  nationality: seed.nationality,
  idType: seed.idType,
  idNumber: seed.idNumber,
  address: seed.address,
  registrationDate: toDateString(addDays(today, -seed.daysAgoRegistered)),
  status: "Active",
}))

// --- reservations --------------------------------------------------------------

interface ReservationSeed {
  guestIndex: number
  roomNumber: string
  checkInOffset: number
  checkOutOffset: number
  status: Reservation["status"]
  paymentStatus: Reservation["paymentStatus"]
  adults: number
  children: number
  specialRequests: string
  paidRatio: number
}

const RESERVATION_SEED: ReservationSeed[] = [
  { guestIndex: 0, roomNumber: "101", checkInOffset: -2, checkOutOffset: 2, status: "Checked In", paymentStatus: "Partially Paid", adults: 1, children: 0, specialRequests: "Late check-out requested", paidRatio: 0.5 },
  { guestIndex: 1, roomNumber: "202", checkInOffset: -1, checkOutOffset: 3, status: "Checked In", paymentStatus: "Paid", adults: 2, children: 0, specialRequests: "High floor preferred", paidRatio: 1 },
  { guestIndex: 2, roomNumber: "304", checkInOffset: 0, checkOutOffset: 4, status: "Confirmed", paymentStatus: "Paid", adults: 2, children: 1, specialRequests: "Extra pillows", paidRatio: 1 },
  { guestIndex: 3, roomNumber: "105", checkInOffset: 0, checkOutOffset: 2, status: "Confirmed", paymentStatus: "Pending", adults: 1, children: 0, specialRequests: "", paidRatio: 0 },
  { guestIndex: 4, roomNumber: "203", checkInOffset: 1, checkOutOffset: 5, status: "Pending", paymentStatus: "Pending", adults: 2, children: 0, specialRequests: "Airport pickup", paidRatio: 0 },
  { guestIndex: 5, roomNumber: "401", checkInOffset: -5, checkOutOffset: -1, status: "Checked Out", paymentStatus: "Paid", adults: 1, children: 0, specialRequests: "", paidRatio: 1 },
  { guestIndex: 6, roomNumber: "402", checkInOffset: -6, checkOutOffset: -2, status: "Checked Out", paymentStatus: "Paid", adults: 2, children: 0, specialRequests: "Anniversary setup", paidRatio: 1 },
  { guestIndex: 7, roomNumber: "505", checkInOffset: 2, checkOutOffset: 6, status: "Confirmed", paymentStatus: "Partially Paid", adults: 2, children: 1, specialRequests: "Connecting rooms if possible", paidRatio: 0.3 },
  { guestIndex: 8, roomNumber: "102", checkInOffset: 0, checkOutOffset: 1, status: "Confirmed", paymentStatus: "Pending", adults: 1, children: 0, specialRequests: "", paidRatio: 0 },
  { guestIndex: 9, roomNumber: "204", checkInOffset: -3, checkOutOffset: -1, status: "Checked Out", paymentStatus: "Refunded", adults: 1, children: 0, specialRequests: "Cancelled early departure", paidRatio: 1 },
  { guestIndex: 10, roomNumber: "301", checkInOffset: 3, checkOutOffset: 7, status: "Pending", paymentStatus: "Pending", adults: 1, children: 0, specialRequests: "", paidRatio: 0 },
  { guestIndex: 11, roomNumber: "404", checkInOffset: -1, checkOutOffset: 1, status: "Checked In", paymentStatus: "Paid", adults: 2, children: 0, specialRequests: "Quiet room", paidRatio: 1 },
  { guestIndex: 2, roomNumber: "103", checkInOffset: -10, checkOutOffset: -8, status: "Cancelled", paymentStatus: "Refunded", adults: 1, children: 0, specialRequests: "Guest changed travel plans", paidRatio: 0 },
  { guestIndex: 4, roomNumber: "205", checkInOffset: 4, checkOutOffset: 6, status: "Confirmed", paymentStatus: "Pending", adults: 2, children: 0, specialRequests: "", paidRatio: 0 },
  { guestIndex: 6, roomNumber: "302", checkInOffset: 1, checkOutOffset: 3, status: "Pending", paymentStatus: "Pending", adults: 1, children: 0, specialRequests: "Ground floor if possible", paidRatio: 0 },
]

function roomRef(number: string): Room {
  return ROOMS.find((r) => r.number === number)!
}

export const RESERVATIONS: Reservation[] = RESERVATION_SEED.map((seed, index) => {
  const guest = GUESTS[seed.guestIndex]
  const room = roomRef(seed.roomNumber)
  const checkIn = addDays(today, seed.checkInOffset)
  const checkOut = addDays(today, seed.checkOutOffset)
  const nights = Math.max(
    1,
    Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
  )
  const totalAmount = Math.round(room.rate * nights)
  const amountPaid = Math.round(totalAmount * seed.paidRatio)
  return {
    id: `res-${index + 1}`,
    reference: `RSV-${String(1000 + index + 1)}`,
    guestId: guest.id,
    roomId: room.id,
    checkInDate: toDateString(checkIn),
    checkOutDate: toDateString(checkOut),
    adults: seed.adults,
    children: seed.children,
    specialRequests: seed.specialRequests,
    roomRate: room.rate,
    totalAmount,
    amountPaid,
    paymentStatus: seed.paymentStatus,
    status: seed.status,
    createdAt: toTimestamp(addDays(checkIn, -3)),
  }
})

// Apply room occupancy state based on reservations with an active stay.
RESERVATIONS.forEach((reservation) => {
  if (reservation.status === "Checked In") {
    const room = ROOMS.find((r) => r.id === reservation.roomId)
    if (room) {
      room.status = "Occupied"
      room.currentGuestId = reservation.guestId
      room.housekeepingStatus = "Dirty"
    }
  } else if (reservation.status === "Confirmed" || reservation.status === "Pending") {
    const room = ROOMS.find((r) => r.id === reservation.roomId)
    if (room && room.status === "Available") {
      room.status = "Reserved"
    }
  }
})

// Sprinkle in a few maintenance / cleaning rooms for realism.
;["301", "403"].forEach((number) => {
  const room = roomRef(number)
  if (room.status === "Available") {
    room.status = number === "301" ? room.status : "Maintenance"
  }
})
roomRef("502").status = "Cleaning"
roomRef("502").housekeepingStatus = "In Progress"

// --- RFID cards ------------------------------------------------------------

function buildRfidCards(): RfidCard[] {
  const cards: RfidCard[] = []
  const activeStays = RESERVATIONS.filter((r) => r.status === "Checked In")

  activeStays.forEach((reservation, index) => {
    cards.push({
      id: `card-${index + 1}`,
      reference: `CRD-${String(100 + index + 1)}`,
      uid: `04:${(index + 10).toString(16).toUpperCase()}:A3:5B:${(index + 20)
        .toString(16)
        .toUpperCase()}`,
      status: "Assigned",
      assignedGuestId: reservation.guestId,
      assignedRoomId: reservation.roomId,
      reservationId: reservation.id,
      assignedDate: reservation.checkInDate,
      expiryDate: reservation.checkOutDate,
      history: [
        {
          id: `card-${index + 1}-h1`,
          date: toTimestamp(addDays(today, -30)),
          action: "Registered",
          details: "Card added to inventory",
        },
        {
          id: `card-${index + 1}-h2`,
          date: toTimestamp(new Date(`${reservation.checkInDate}T14:00:00`)),
          action: "Assigned",
          details: `Assigned to room ${roomRef(reservation.roomId.replace("room-", "")).number || ""}`.trim(),
        },
      ],
    })
  })

  const extraAvailable = 9
  for (let i = 0; i < extraAvailable; i += 1) {
    const index = activeStays.length + i
    cards.push({
      id: `card-${index + 1}`,
      reference: `CRD-${String(100 + index + 1)}`,
      uid: `04:${(index + 10).toString(16).toUpperCase()}:A3:5B:${(index + 20)
        .toString(16)
        .toUpperCase()}`,
      status: "Available",
      assignedGuestId: null,
      assignedRoomId: null,
      reservationId: null,
      assignedDate: null,
      expiryDate: null,
      history: [
        {
          id: `card-${index + 1}-h1`,
          date: toTimestamp(addDays(today, -60 + i)),
          action: "Registered",
          details: "Card added to inventory",
        },
      ],
    })
  }

  // One blocked and one lost card for realism.
  const blockedIndex = cards.length
  cards.push({
    id: `card-${blockedIndex + 1}`,
    reference: `CRD-${String(100 + blockedIndex + 1)}`,
    uid: "04:FF:A3:5B:9C",
    status: "Blocked",
    assignedGuestId: null,
    assignedRoomId: null,
    reservationId: null,
    assignedDate: null,
    expiryDate: null,
    history: [
      {
        id: `card-${blockedIndex + 1}-h1`,
        date: toTimestamp(addDays(today, -90)),
        action: "Registered",
        details: "Card added to inventory",
      },
      {
        id: `card-${blockedIndex + 1}-h2`,
        date: toTimestamp(addDays(today, -4)),
        action: "Blocked",
        details: "Reported malfunctioning at door reader",
      },
    ],
  })

  const lostIndex = cards.length
  cards.push({
    id: `card-${lostIndex + 1}`,
    reference: `CRD-${String(100 + lostIndex + 1)}`,
    uid: "04:EE:A3:5B:7D",
    status: "Lost",
    assignedGuestId: null,
    assignedRoomId: null,
    reservationId: null,
    assignedDate: null,
    expiryDate: null,
    history: [
      {
        id: `card-${lostIndex + 1}-h1`,
        date: toTimestamp(addDays(today, -120)),
        action: "Registered",
        details: "Card added to inventory",
      },
      {
        id: `card-${lostIndex + 1}-h2`,
        date: toTimestamp(addDays(today, -7)),
        action: "Marked Lost",
        details: "Guest reported losing the card during checkout",
      },
    ],
  })

  return cards
}

export const RFID_CARDS: RfidCard[] = buildRfidCards()

// --- access logs -------------------------------------------------------------

function buildAccessLogs(): AccessLog[] {
  const logs: AccessLog[] = []
  const assignedCards = RFID_CARDS.filter((c) => c.status === "Assigned")
  let counter = 0

  assignedCards.forEach((card) => {
    for (let i = 0; i < 4; i += 1) {
      counter += 1
      const hourOffset = -(i * 6 + 1)
      logs.push({
        id: `log-${counter}`,
        reference: `ACC-${String(5000 + counter)}`,
        roomId: card.assignedRoomId!,
        cardId: card.id,
        guestId: card.assignedGuestId,
        timestamp: toTimestamp(new Date(today.getTime() + hourOffset * 60 * 60 * 1000)),
        result: "Granted",
        description: "Door access granted",
      })
    }
  })

  // A handful of denied attempts for realism (e.g. blocked/expired cards).
  const blockedCard = RFID_CARDS.find((c) => c.status === "Blocked")
  const lostCard = RFID_CARDS.find((c) => c.status === "Lost")
  ;[blockedCard, lostCard].forEach((card, i) => {
    if (!card) return
    counter += 1
    logs.push({
      id: `log-${counter}`,
      reference: `ACC-${String(5000 + counter)}`,
      roomId: ROOMS[(i * 3) % ROOMS.length].id,
      cardId: card.id,
      guestId: null,
      timestamp: toTimestamp(addDays(today, -(i + 1))),
      result: "Denied",
      description:
        card.status === "Blocked" ? "Card is blocked" : "Card reported lost",
    })
  })

  return logs.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}

export const ACCESS_LOGS: AccessLog[] = buildAccessLogs()

// --- payments -----------------------------------------------------------------

function buildPayments(): Payment[] {
  const payments: Payment[] = []
  let counter = 0
  const methods: Payment["method"][] = ["Cash", "Card", "Bank Transfer", "Mobile Money"]

  RESERVATIONS.forEach((reservation) => {
    if (reservation.amountPaid > 0) {
      counter += 1
      payments.push({
        id: `pay-${counter}`,
        reference: `PMT-${String(9000 + counter)}`,
        guestId: reservation.guestId,
        reservationId: reservation.id,
        amount: reservation.amountPaid,
        method: methods[counter % methods.length],
        date: reservation.createdAt,
        status:
          reservation.paymentStatus === "Refunded" ? "Refunded" : "Paid",
        notes: "Payment recorded at booking",
      })
    }
    if (reservation.paymentStatus === "Partially Paid") {
      counter += 1
      payments.push({
        id: `pay-${counter}`,
        reference: `PMT-${String(9000 + counter)}`,
        guestId: reservation.guestId,
        reservationId: reservation.id,
        amount: reservation.totalAmount - reservation.amountPaid,
        method: "Pending" as unknown as Payment["method"],
        date: reservation.checkOutDate,
        status: "Pending",
        notes: "Balance due on checkout",
      })
      payments[payments.length - 1].method = methods[counter % methods.length]
    }
  })

  return payments
}

export const PAYMENTS: Payment[] = buildPayments()

// --- staff ----------------------------------------------------------------------

export const STAFF: StaffMember[] = [
  {
    id: "staff-1",
    name: "Adaeze Nwosu",
    email: "adaeze.nwosu@hotelpilot.com",
    phone: "+234 801 555 0101",
    role: "Administrator",
    department: "Management",
    status: "Active",
    hireDate: toDateString(addDays(today, -820)),
  },
  {
    id: "staff-2",
    name: "Benjamin Osei",
    email: "benjamin.osei@hotelpilot.com",
    phone: "+233 24 555 0102",
    role: "Manager",
    department: "Management",
    status: "Active",
    hireDate: toDateString(addDays(today, -600)),
  },
  {
    id: "staff-3",
    name: "Comfort Eze",
    email: "comfort.eze@hotelpilot.com",
    phone: "+234 802 555 0103",
    role: "Receptionist",
    department: "Front Desk",
    status: "Active",
    hireDate: toDateString(addDays(today, -400)),
  },
  {
    id: "staff-4",
    name: "David Owusu",
    email: "david.owusu@hotelpilot.com",
    phone: "+233 55 555 0104",
    role: "Front Desk Staff",
    department: "Front Desk",
    status: "Active",
    hireDate: toDateString(addDays(today, -210)),
  },
  {
    id: "staff-5",
    name: "Esther Umeh",
    email: "esther.umeh@hotelpilot.com",
    phone: "+234 803 555 0105",
    role: "Accountant",
    department: "Accounts",
    status: "Active",
    hireDate: toDateString(addDays(today, -500)),
  },
  {
    id: "staff-6",
    name: "Felix Boadi",
    email: "felix.boadi@hotelpilot.com",
    phone: "+233 26 555 0106",
    role: "Front Desk Staff",
    department: "Housekeeping",
    status: "Active",
    hireDate: toDateString(addDays(today, -150)),
  },
  {
    id: "staff-7",
    name: "Grace Afolabi",
    email: "grace.afolabi@hotelpilot.com",
    phone: "+234 804 555 0107",
    role: "Receptionist",
    department: "Front Desk",
    status: "Inactive",
    hireDate: toDateString(addDays(today, -730)),
  },
  {
    id: "staff-8",
    name: "Henry Danso",
    email: "henry.danso@hotelpilot.com",
    phone: "+233 54 555 0108",
    role: "Front Desk Staff",
    department: "Security",
    status: "Active",
    hireDate: toDateString(addDays(today, -90)),
  },
]

// --- settings ---------------------------------------------------------------

export const DEFAULT_SETTINGS: HotelSettings = {
  hotelName: "HotelPilot Grand",
  tagline: "Smart Hotel Management & Access Control",
  address: "15 Marina Road, Lagos, Nigeria",
  phone: "+234 700 123 4567",
  email: "frontdesk@hotelpilotgrand.com",
  currency: "USD",
  checkInTime: "14:00",
  checkOutTime: "11:00",
  cancellationPolicy:
    "Reservations may be cancelled free of charge up to 48 hours before check-in.",
  lateCheckoutFee: 25,
  taxRate: 7.5,
  paymentMethods: ["Cash", "Card", "Bank Transfer", "Mobile Money", "Paystack"],
  cardExpiryDays: 30,
  autoRevokeOnCheckout: true,
  notifyOnLowCardInventory: true,
  notifyOnOverduePayments: true,
}

// --- notifications ------------------------------------------------------------

export const NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    title: "Low RFID card inventory",
    description: "Only a few cards remain available in inventory.",
    timestamp: toTimestamp(addDays(today, 0)),
    read: false,
    type: "warning",
  },
  {
    id: "notif-2",
    title: "Outstanding balance",
    description: "Some reservations have outstanding payment balances.",
    timestamp: toTimestamp(addDays(today, 0)),
    read: false,
    type: "danger",
  },
  {
    id: "notif-3",
    title: "Upcoming check-ins today",
    description: "Guests are scheduled to arrive today.",
    timestamp: toTimestamp(addDays(today, 0)),
    read: true,
    type: "info",
  },
]

export function createInitialData(): HotelPilotData {
  return {
    guests: GUESTS,
    roomCategories: ROOM_CATEGORIES,
    rooms: ROOMS,
    reservations: RESERVATIONS,
    rfidCards: RFID_CARDS,
    accessLogs: ACCESS_LOGS,
    payments: PAYMENTS,
    staff: STAFF,
    settings: DEFAULT_SETTINGS,
    notifications: NOTIFICATIONS,
  }
}
