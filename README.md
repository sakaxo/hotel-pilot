# HotelPilot

### Smart Hotel Management & Access Control

HotelPilot is an experimental software and hardware development project focused on exploring the integration of hotel management systems with intelligent room access technology.

The project aims to bring hotel operations and physical room access together through a connected platform, combining web-based hotel management software with purpose-built electronic locking devices.

The current development serves as a testing and validation environment for exploring the technology, workflows, and architecture required to make this integration possible.

The knowledge and results obtained from this project will inform the development of a more comprehensive, production-ready hotel management platform in the future.

**Development Status:** Active Development

---

## Project Vision

The hospitality industry relies on several interconnected processes, including room management, guest registration, accommodation management, check-in and checkout operations, and room access control.

HotelPilot explores how these activities can be connected through one technology platform.

The initial objective is to develop a working software and hardware solution that demonstrates how hotels can manage their rooms and guests while controlling room access through intelligent electronic locks.

The broader vision is to use the validated technology and experience from this project as a foundation for developing a complete hotel management product.

This future platform could serve individual hotels, hotel operators, and hospitality businesses, with opportunities to partner with hotels and other hospitality technology providers.

### The Long-Term Goal

To build a comprehensive hotel technology platform that combines:

- Hotel management software.
- Intelligent room access control.
- Purpose-built electronic locking devices.
- Connected hardware and software infrastructure.
- Operational management and reporting capabilities.

The goal is not simply to develop another hotel management application, but to explore a connected solution that brings hotel operations and physical room access into one ecosystem.

---

## Project Scope

HotelPilot is currently being developed as a testing and validation environment.

The project focuses on three major areas:

### 1. Hotel Management Software

Developing the web application and backend required to manage essential hotel operations.

### 2. Smart Access Hardware

Exploring the development of electronic door locking devices that can replace or upgrade conventional hotel door locks.

### 3. Software-Hardware Integration

Establishing communication between the hotel management backend and physical access devices to validate RFID cards and manage room access.

Once the core concepts and workflows have been successfully implemented and tested, the results will guide the design and development of a more complete commercial product.

---

## Core Software Capabilities

### 1. Room Management

Manage hotel rooms and their operational information.

Features include:

- Room registration and management.
- Room categorization.
- Room pricing and capacity.
- Floor and room identification.
- Room availability tracking.
- Room status management.

**Room statuses**

| Status              | Description                        |
| ------------------- | ---------------------------------- |
| Available           | Ready for guest allocation         |
| Occupied            | Currently assigned to a guest      |
| Awaiting Inspection | Requires inspection after checkout |
| Maintenance         | Temporarily unavailable            |

### 2. Guest Management

Maintain guest information and manage guest profiles.

Features include:

- Guest registration.
- Guest profile management.
- Contact information.
- Guest identification details.
- Guest status management.
- Guest-related records.

### 3. Guest Stays and Check-in Management

Manage guest accommodation from check-in through checkout.

The system is designed around a continuous walk-in check-in process.

Features include:

- Existing guest selection.
- New guest registration during check-in.
- Specific room allocation.
- Stay duration management.
- Guest occupancy information.
- RFID card assignment.
- Checkout processing.
- Guest stay history.

### 4. RFID Card Management

Manage the hotel's RFID card inventory.

Features include:

- RFID card registration.
- Card identification and lookup.
- Card inventory management.
- Card status management.
- Card availability tracking.

### 5. Room Access Management

Connect RFID cards to individual guest stays.

The system is designed to associate each guest stay with a specific room and an RFID access card.

Features include:

- One RFID card per guest stay.
- Room-specific access assignment.
- Access validity based on the guest's stay.
- Card availability validation.
- Access assignment tracking.
- Access revocation during checkout.

### 6. Room Operations

Support the operational lifecycle of hotel rooms.

When a guest checks out, the room moves into an inspection state. Hotel staff can then mark the room as available or under maintenance.

### 7. Dashboard and Reporting

A centralized interface for monitoring hotel operations, with reporting and analytics intended to provide visibility into guest stays, room occupancy, and other operational activities.

---

## Smart Locking Hardware

An important part of the HotelPilot vision is the development of purpose-built electronic door locks for hotel rooms.

The objective is to develop a hardware solution that hotels can purchase and install on their room doors, replacing or upgrading their existing locking systems.

The proposed solution will combine:

- Electronic door locking mechanisms.
- RFID card readers.
- Embedded controllers.
- Device firmware.
- Backend communication for access validation.

### Intended Operation

1. A hotel manages its rooms and guest stays through HotelPilot.
2. During check-in, a guest is allocated a room and assigned an RFID card.
3. The access assignment is associated with the guest's stay and allocated room.
4. The guest presents the RFID card to the room's smart lock.
5. The hardware reads the card identifier and communicates with the backend.
6. The backend validates the card's access assignment and validity.
7. The device receives the authorization decision and performs the appropriate locking action.

Access validity is intended to follow the guest's accommodation period, with access revoked when the guest checks out.

**Hardware development status:** The physical locking device and its firmware are separate development components and are not included in this repository.

---

## System Architecture

HotelPilot is being developed around a software and hardware architecture.

### Current Software Architecture

This repository contains the web application and backend.

```text
                 HOTELPILOT
                      |
           +----------+----------+
           |                     |
        FRONTEND               BACKEND
           |                     |
       React + Vite         Django + DRF
           |                     |
           +------ REST API -----+
                      |
                  SQL Database
```

### Planned Hardware Integration

```text
             HOTEL MANAGEMENT
                    |
                HotelPilot
                    |
                  Backend
                    |
                 REST API
                    |
             Smart Lock Device
                    |
              RFID Reader
                    |
             Electronic Lock
```

The software and hardware components will be developed separately and integrated through defined communication interfaces.

---

## Technology Stack

### Web Application

- React
- Vite
- JavaScript
- Tailwind CSS
- React Router
- React Icons
- Recharts

### Backend

- Python
- Django
- Django REST Framework
- RESTful APIs

### Database

- SQL relational database.

### Planned Hardware Technologies

- Embedded microcontrollers.
- RFID reader modules.
- Electronic locking mechanisms.
- Device firmware.
- Network communication.

---

## Repository Structure

This repository contains the HotelPilot web application and backend.

```text
HotelPilot/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── ...
│   └── package.json
│
├── backend/
│   ├── config/
│   ├── rooms/
│   ├── guests/
│   ├── access_control/
│   ├── reservations/
│   ├── manage.py
│   └── ...
│
└── README.md
```

The hardware firmware will be maintained separately as part of the broader HotelPilot development ecosystem.

---

## Getting Started

### Prerequisites

Ensure the following are installed:

- Python 3.10 or later.
- Node.js and npm.
- Git.
- The SQL database engine configured for the project.

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/HotelPilot.git

cd HotelPilot
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the environment.

**Windows**

```bash
venv\Scripts\activate
```

**Linux / macOS**

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure the environment variables and database settings required by the project.

Run migrations:

```bash
python manage.py migrate
```

Start the development server:

```bash
python manage.py runserver
```

The backend will be available at:

`http://127.0.0.1:8000/`

### 3. Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at the local URL provided by Vite, typically:

`http://localhost:5173/`

---

## Development Status

The project is being developed incrementally to validate the core software functionality and prepare for future hardware integration.

| Component                         | Status         |
| --------------------------------- | -------------- |
| Frontend foundation               | Implemented    |
| Backend foundation                | Implemented    |
| Room categories                   | Implemented    |
| Room management                   | Implemented    |
| Guest management                  | Implemented    |
| RFID card inventory               | Implemented    |
| Guest stay management             | In development |
| RFID access assignments           | In development |
| Check-in and checkout workflow    | In development |
| Dashboard and reporting           | In development |
| Smart lock hardware               | Planned        |
| Device firmware                   | Planned        |
| Hardware-to-backend communication | Planned        |
| Electronic door lock integration  | Planned        |

_These statuses reflect the current development direction and will be updated as implementation and testing progress._

---

## Development Approach

HotelPilot follows an iterative development approach.

Rather than attempting to build the entire commercial platform immediately, the current project focuses on implementing and testing the essential concepts.

The development process involves:

1. Building the core hotel management workflows.
2. Developing the RFID card and access assignment logic.
3. Exploring the hardware requirements for intelligent room access.
4. Establishing communication between the software and physical devices.
5. Testing and validating the complete software-hardware workflow.
6. Using the results to inform the architecture and requirements of a production-ready product.

Authentication and authorization are not currently implemented. The current development focus is on the core operational workflows and software-hardware communication.

---

## Future Product Direction

Successful validation of the current project will provide a foundation for developing a more comprehensive hotel management platform.

The future product direction includes:

- A complete hotel management platform.
- More comprehensive operational and administrative capabilities.
- Production-ready architecture and infrastructure.
- Purpose-built smart locking hardware.
- Integrated room access management.
- Improved reporting and analytics.
- Opportunities for partnerships with hotels and hospitality technology providers.

The long-term ambition is to make HotelPilot a solution that hotels can adopt to manage their operations and room access through one connected platform.

The current repository represents an important development stage towards that ambition.

---

## Contributing

HotelPilot is currently an active development project.

Technical feedback, suggestions, and discussions around the software architecture, hardware integration, and product direction are welcome.

If you identify an issue or have an idea for improvement, feel free to open an issue or start a discussion in the repository.

---

## License

No open-source licence has currently been assigned to this repository.

Unless a licence is added, the source code remains subject to its default copyright protections. Public visibility does not automatically grant permission to reuse, modify, or distribute the code.

---

## Project Information

| Item                | Details                                    |
| ------------------- | ------------------------------------------ |
| Project             | HotelPilot                                 |
| Category            | Hotel Management & Smart Access Control    |
| Current Scope       | Software and hardware validation           |
| Frontend            | React + Vite                               |
| Backend             | Django REST Framework                      |
| Database            | SQL                                        |
| Hardware            | Separate development component             |
| Development Status  | Active Development                         |
| Long-term Direction | Production-ready hotel technology platform |

---

**HotelPilot**

Smarter Hotel Operations. Connected Room Access.\_
