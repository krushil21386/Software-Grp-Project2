# Professional Data Flow Diagrams: Medicare Plus System

This architectural set follows the **Gane-Sarson notation** for professional systems analysis. It provides a multi-level, recursive breakdown of the platform's data movement, ensuring hierarchical balancing and explicit data element labeling.

---

## Level 0: Professional Context Diagram
**Process 0.0** represents the entire system boundary. All external interactions are defined by specific data packets.

```mermaid
graph LR
    %% External Entities (Gane-Sarson Style)
    subgraph External_Entities
        P[Patient]
        D[Doctor]
        A[Admin]
        AI[AI Engine - Gemini]
        PG[Payment - Stripe]
        IS[Inventory MS]
    end

    %% Central Process (Gane-Sarson Rounded Rectangle)
    subgraph System_Perimeter
        S(0.0 Medicare Plus Platform)
    end

    %% Multi-Element Data Flows
    P <-->|Identity Info, Records, Order Meta| S
    D <-->|Availability, Prescriptions, Slots| S
    A <-->|Config, MGMT Commands, Reports| S
    S <-->|Binary PDF Stream, JSON Results| AI
    S <-->|Transaction Meta, Payment Status| PG
    S <-->|Stock Sync Packet, Low-Stock Alert| IS
```

---

## Level 1: Balanced Architecture (Direct Expansion of 0.0)
Level 1 expands the root into its functional domains. All flows that entered/left 0.0 in Level 0 are balanced here.

```mermaid
graph TD
    %% Traffic Interception
    Traffic((External Traffic)) -- Data Packet --> SG(0.0 Security Gateway)

    %% Core Domains
    SG -- Validated Data Flow --> P1(1.0 Identity Mgmt)
    SG -- Validated Data Flow --> P2(2.0 Telemedicine)
    SG -- Validated Data Flow --> P3(3.0 Health Records)
    SG -- Validated Data Flow --> P4(4.0 Supply Chain)
    SG -- Security Events --> P5(5.0 Governance & BI)

    %% Professional Data Stores (Open Rectangles)
    D1[D1: Identity DB]
    D2[D2: Clinical DB]
    D3[D3: Records DB]
    D4[D4: Inventory DB]
    D5[D5: Audit BI DB]

    %% Explicit Storage Interfaces
    P1 <-->|Stored Credentials, OTP Tokens| D1
    P2 <-->|Slot Status, Appointment Meta| D2
    P3 <-->|PDF Metadata, AI Summaries| D3
    P4 <-->|Transaction History, Med Stats| D4
    P5 <-->|Security Logs, Aggregates| D5
```

---

## Level 2: Unified System Models (Expansion of Level 1)
Level 2 provides a comprehensive operational view of every domain's sub-processes.

```mermaid
graph TD
    %% Process Layering
    subgraph SG_Exp [0.0 Security Pipeline]
        0_1(0.1 Rate Limiting) -- Request Meta --> 0_2(0.2 JWT Auth)
        0_2 -- Auth User context --> 0_3(0.3 RBAC Check)
    end

    subgraph IAM_Exp [1.0 Identity Mgmt]
        1_1(1.1 Auth Logic) -- Credentials --> 1_2(1.2 OTP Gateway)
        1_2 -- Hashed Secrets --> D1[D1: Identity DB]
        1_2 -- Session state --> 1_3(1.3 Session Mgmt)
    end

    subgraph Clin_Exp [2.0 Telemedicine]
        2_1(2.1 Search Logic) -- Criteria --> 2_2(2.2 Availability)
        2_2 -- Sync Request --> D2[D2: Clinical DB]
        2_2 -- Reservation --> 2_3(2.3 Booking Engine)
        2_3 -- Event Meta --> 2_4(2.4 Socket.io Push)
    end

    subgraph Rec_Exp [3.0 Clinical AI]
        3_1(3.1 File Ingestion) -- PDF Stream --> 3_2(3.2 AI Inference)
        3_2 -- JSON Summary --> 3_3(3.3 Passport Gen)
        3_3 -- Persistent Data --> D3[D3: Records DB]
    end

    subgraph Sup_Exp [4.0 Supply Chain]
        4_1(4.1 RX Validate) -- Prescription Proof --> 4_2(4.2 Checkout)
        4_2 -- Stripe URL --> 4_3(4.3 Payment)
        4_3 -- Stock Packet --> 4_4(4.4 Inventory MS)
        4_4 -- Order Record --> D4[D4: Inventory DB]
    end

    subgraph Gov_Exp [5.0 BI & Governance]
        5_1(5.1 Audit Tap) -- Mutation Meta --> 5_2(5.2 Log Archiver)
        5_2 -- BSON Record --> D5[D5: Audit BI DB]
        5_2 -- Data Stream --> 5_3(5.3 Analytics)
    end

    %% Balanced Inter-process connections
    0_3 -- Routing --> 1_1
    0_3 -- Routing --> 2_1
    0_3 -- Routing --> 3_1
    0_3 -- Routing --> 4_1
```

---

## Level 3: Atomic System Logic (Unit Implementation)
Level 3 expands the operational units into implementation-level logic and data transformations.

```mermaid
graph TD
    %% Technical logic units
    subgraph L_IAM [1.0 Logic]
        L1_1{Schema Valid} -- Error --> Reject[400 Bad Req]
        L1_1 -- Valid --> L1_2(Bcrypt Salt/Hash)
        L1_2 --> L1_3(SMTP/SMS Handshake)
        L1_3 --> L1_4(JWT Sign & Set-Cookie)
    end

    subgraph L_Tele [2.0 Logic]
        L2_1(Geospatial Query) -- Mongo Agg --> L2_2(Semaphore Lock)
        L2_2 -- Race Condition? --> L2_3{Sync Verify}
        L2_3 -- Success --> L2_4(Socket Broadcast)
    end

    subgraph L_AI [3.0 Logic]
        L3_1(GridFS/Buffer) --> L3_2(Gemini Prompting)
        L3_2 -- Result JSON --> L3_3(Harmonization)
        L3_3 --> L3_4(Passport JSON Commit)
    end

    subgraph L_Sup [4.0 Logic]
        L4_1(Reference Records) --> L4_2(Stripe Session API)
        L4_2 -- Status Callback --> L4_3(Webhook Valid)
        L4_3 --> L4_4(REST JSON Trigger)
    end

    subgraph L_BI [5.0 Logic]
        L5_1(BSON Serialization) --> L5_2(D3 format logic)
    end
```

## Data Standards Compliance
- **Gane-Sarson Elements**: Consistent use of rounding, squares, and open rectangles.
- **Data Element Integrity**: All flows are labeled with specific technical data elements.
- **Hierarchical Traceability**: Numbering persists through all levels (e.g., 4.0 -> 4.1 -> L4_1).
