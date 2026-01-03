# Esvitabi Dashboard - Kapsamlı Teknik Dokümantasyon

## 📋 İçindekiler
1. [Proje Genel Bakış](#proje-genel-bakış)
2. [Teknoloji Stack](#teknoloji-stack)
3. [Mimari Yapı](#mimari-yapı)
4. [Veri Modelleri](#veri-modelleri)
5. [Bileşen Yapısı](#bileşen-yapısı)
6. [Özellikler ve Fonksiyonlar](#özellikler-ve-fonksiyonlar)
7. [Kurulum ve Çalıştırma](#kurulum-ve-çalıştırma)
8. [Kullanım Kılavuzu](#kullanım-kılavuzu)
9. [Genişletme Rehberi](#genişletme-rehberi)

---

## 🎯 Proje Genel Bakış

**Esvitabi Dashboard**, medikal turizm sektöründe faaliyet gösteren bir şirket için geliştirilmiş, kapsamlı bir **Lead Management & Analytics** platformudur. Sistem, potansiyel müşterilerin (lead) takibinden, satış hunisine, pazarlama analizlerinden hasta operasyonlarına kadar tüm iş süreçlerini tek bir platformda yönetir.

### Ana Amaç
- **Lead Tracking**: Potansiyel müşterilerin yaşam döngüsünü takip etme
- **Sales Funnel Analysis**: Satış hunisi performans analizi
- **Team Performance**: Ekip ve bireysel performans ölçümü
- **Marketing ROI**: Pazarlama kampanyalarının geri dönüş analizi
- **Patient Operations**: Hasta operasyon ve lojistik yönetimi
- **Data-Driven Insights**: Veri odaklı karar destek sistemi

### Hedef Kullanıcılar
1. **Team Leaders**: Ekip liderleri - Kendi ekiplerinin performansını izler
2. **Managers**: Yöneticiler - Tüm organizasyonun stratejik görünümüne erişir

---

## 🛠 Teknoloji Stack

### Frontend Framework
```json
{
  "react": "^19.2.1",
  "react-dom": "^19.2.1"
}
```
- **React 19**: En güncel React versiyonu ile modern component yapısı
- **TypeScript**: Tip güvenliği ve kod kalitesi için

### Build Tool
```json
{
  "vite": "^6.2.0",
  "@vitejs/plugin-react": "^5.0.0"
}
```
- **Vite**: Hızlı development server ve optimized production build
- Hot Module Replacement (HMR) ile anında güncelleme

### UI Libraries
```json
{
  "recharts": "^3.5.1",
  "lucide-react": "^0.556.0"
}
```
- **Recharts**: Profesyonel, interaktif grafikler ve veri görselleştirme
- **Lucide React**: Modern, hafif icon kütüphanesi (600+ icon)

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Dark Mode**: Sistem genelinde dark/light tema desteği
- **Glassmorphism**: Modern, şeffaf UI tasarımı
- **Responsive Design**: Mobil, tablet, desktop uyumlu

---

## 🏗 Mimari Yapı

### Proje Dizin Yapısı
```
esvitabi-v1.0-for-integration/
├── components/              # React bileşenleri
│   ├── CloudTalkView.tsx
│   ├── DataManagementView.tsx
│   ├── DiagnosisView.tsx
│   ├── FilterBar.tsx
│   ├── FunnelChart.tsx
│   ├── FunnelComparisonView.tsx
│   ├── Header.tsx
│   ├── LeadListModal.tsx
│   ├── ManagerOverview.tsx
│   ├── MarketingFunnelView.tsx
│   ├── ParetoEngineView.tsx
│   ├── PatientOpsView.tsx
│   ├── PipelineBreakdownModal.tsx
│   ├── PipelineView.tsx
│   ├── RepPerformanceView.tsx
│   └── RepSplitterView.tsx
├── services/                # Veri servisleri
│   ├── mockData.ts         # Mock veri üretimi
│   └── mockManagerData.ts  # Manager dashboard mock data
├── App.tsx                  # Ana uygulama bileşeni
├── types.ts                 # TypeScript tip tanımlamaları
├── index.tsx                # Uygulama giriş noktası
├── index.html               # HTML template
├── package.json             # Proje bağımlılıkları
├── tsconfig.json            # TypeScript yapılandırması
├── vite.config.ts           # Vite yapılandırması
└── README.md                # Proje dokümantasyonu
```

### Mimari Prensipler

#### 1. Component-Based Architecture
Her view/ekran ayrı bir component olarak tasarlanmıştır:
- **Modülerlik**: Her component bağımsız çalışabilir
- **Reusability**: Ortak componentler tekrar kullanılabilir
- **Maintainability**: Kolay bakım ve güncelleme

#### 2. State Management
```typescript
// App.tsx içinde merkezi state yönetimi
const [leads, setLeads] = useState<Lead[]>([]);
const [filters, setFilters] = useState<FilterState>({...});
const [view, setView] = useState<ViewType>('overview');
const [userType, setUserType] = useState<'TEAM_LEADER' | 'MANAGER'>('TEAM_LEADER');
```

#### 3. Data Flow
```
Mock Data Generator → State → Filters → Computed Data → UI Components
```

---

## 📊 Veri Modelleri

### 1. Lead (Potansiyel Müşteri)
```typescript
interface Lead {
  id: string;                    // Benzersiz lead ID (LD-10000 formatında)
  customerName: string;          // Müşteri adı
  email: string;                 // E-posta adresi
  createDate: Date;              // Oluşturulma tarihi
  updateDate: Date;              // Son güncelleme tarihi
  repName: string;               // Sorumlu satış temsilcisi
  country: string;               // Müşteri ülkesi
  language: string;              // İletişim dili
  treatment: 'Dental' | 'Hair' | 'Other';  // Tedavi türü
  status: FunnelStage;           // Hunideki aşama
  originalStatus: string;        // CRM'den gelen ham durum
  nrCount?: number;              // No Response sayacı
  leadScore: number;             // Lead kalite skoru (0-10)
  diffDays: number;              // Son aktiviteden bu yana geçen gün
  revenue: number;               // Gelir (başarılı ise)
  source: string;                // Kaynak (Google Ads, Facebook, vb.)
  campaign: string;              // Kampanya adı
  adset?: string;                // Reklam seti
  ad?: string;                   // Reklam adı
}
```

**Lead Score Sistemi (0-10)**:
- **0-1**: Çok düşük kalite (junk leads)
- **2-3**: Düşük kalite
- **4-5**: Orta kalite (örn: "Lost" statusu = 4)
- **6-7**: İyi kalite
- **8-10**: Mükemmel kalite (yüksek dönüşüm potansiyeli)

### 2. Funnel Stages (Satış Hunisi Aşamaları)
```typescript
enum FunnelStage {
  New = 'New',                   // Yeni lead
  Interested = 'Interested',     // İlgilenen
  WaitingEval = 'Waiting Eval',  // Değerlendirme bekleyen
  OfferSent = 'Offer Sent',      // Teklif gönderildi
  Success = 'Success'            // Başarılı dönüşüm
}
```

**Status Mapping Logic**:
```typescript
// OPEN (Açık Leadler)
STATUS_OPEN = ['New Lead', 'NR', 'NR0', 'NR1', 'NR2', 'NR3', 'NR4', 'NR5']

// ACTIVE (Aktif İşlemde)
STATUS_ACTIVE = ['Lost', 'Interested No Details', 'Waiting For Photo', 
                 'Waiting For Evaluation', 'Waiting For Ticket', 
                 'Evaluation Done', 'Offer Sent', 'Planning']

// CLOSED - SUCCESS (Başarılı Kapanış)
STATUS_CLOSED_SUCCESS = ['Operation Done', 'Ticket Received', 
                         'Pre-Payment Received', 'Pre/Payment Received']

// NEGATIVE/LOST (Kayıp)
STATUS_LOST = ['Not Interest / Junk', 'High Price', 'Wrong Number', 
               'Block', 'Other Languages', 'Night Shift', 
               'Rejected by Doctor', "Interested Can't Travel"]
```

**ÖNEMLİ NOT**: "Lost" statusu artık ACTIVE kategorisinde! (Daha önce LOST kategorisindeydi)

### 3. Patient (Hasta - MMS Sistemi)
```typescript
interface Patient {
  mmsId: string;                 // MMS sistem ID
  crmId?: string;                // CRM'deki lead ID (bağlantı için)
  ticketDate: Date;              // Bilet alma tarihi
  
  // Hasta Bilgileri
  patientName: string;
  patientCountry: string;
  patientPhone: string;
  patientEmail: string;
  
  // Tedavi Bilgileri
  category: string;              // Dental, Hair, Other
  opType: string;                // Operasyon tipi
  opTechnique: string;           // Teknik (FUE, Zirconia, vb.)
  operationCenter: string;       // Operasyon merkezi
  doctor: string;                // Doktor
  repName?: string;              // Sorumlu temsilci
  
  // Durum
  status: string;                // Ham durum
  conversionOutcome: 'Completed' | 'Cancelled' | 'Postponed' | 'Planned';
  
  // Operasyonel Tarihler
  arrivalAnchorDate: Date;       // Varış tarihi (ana tarih)
  operationDate?: Date;          // Operasyon tarihi
  hotelEnterDate?: Date;         // Otel giriş
  hotelLeaveDate?: Date;         // Otel çıkış
  airportPickupDate?: Date;      // Havalimanı karşılama
  
  // Finansal
  expectedTotalRaw: number;      // Beklenen toplam (orijinal para birimi)
  expectedCurrency: string;      // Para birimi (Euro, Pound, USD)
  expectedTotalEur?: number;     // Euro cinsinden (sadece Euro ise)
  actualCollectedRaw: number;    // Gerçekleşen tahsilat
  actualReceivedEur?: number;    // Euro cinsinden tahsilat
  upsaleEur?: number;            // Ek satış (Euro)
  
  notes: string;
  raw: Record<string, any>;      // Ham veri
}
```

### 4. Filter State (Filtre Durumu)
```typescript
interface FilterState {
  dateRange: 'month' | 'last_month' | '6m' | 'all_time' | 'custom';
  customDateStart?: string;      // YYYY-MM-DD formatında
  customDateEnd?: string;
  treatments: string[];          // Tedavi türleri
  countries: string[];           // Ülkeler
  reps: string[];                // Temsilciler
  languages: string[];           // Diller
  sources: string[];             // Kaynaklar
  teams: string[];               // Takımlar
  campaigns?: string[];          // Kampanyalar
  adsets?: string[];             // Reklam setleri
  ads?: string[];                // Reklamlar
  mmsStatus?: string[];          // MMS durum filtreleri
  mmsDoctor?: string[];          // Doktor filtreleri
  mmsCenter?: string[];          // Merkez filtreleri
}
```

### 5. Team Structure (Takım Yapısı)
```typescript
const TEAMS: Record<string, string[]> = {
  'Alex Traon': ['Alex Traon', 'Dina Brusca', 'Angie Moreau', 'Luna Maidi'],
  'Enzo Hamadouche': ['Enzo Hamadouche', 'Nadia Belova', 'Olivia Campbell', 
                      'Emma Harris', 'Oliver Sahar', 'Josh Foster', 
                      'Nadine Crose', 'Anastasia Wells', 'Mirella Spencer', 
                      'Liam Grant'],
  'Giovanni Severini': ['Giovanni Severini', 'Roberto Arslan'],
  'Mazen Hourania': ['Mazen Hourania', 'Chris Taylor', 'Maria Hayes', 
                     'Laura Hansen', 'Hali Quinn', 'Jessica Weber', 
                     'David Jones', 'Jane Carter', 'Kate Adams'],
  'John Michelle': ['John Michelle', 'Leo Stone', 'Jim Hopper', 'Emily Mitchell'],
  'Robert Wood': ['Robert Wood', 'Ekaterina Valkova', 'Cole Whitman', 
                  'Bobby Thomson', 'Lisa Shaw', 'Nikolay Mironov', 
                  'Alisa Smirnova', 'Alexandra Petrova'],
  'Selman Esen': ['Selman Esen', 'Parisa Balaei']
};
```

---

## 🧩 Bileşen Yapısı

### Ana Uygulama (App.tsx)

**Sorumluluklar**:
1. Global state yönetimi
2. View routing (hangi ekranın gösterileceği)
3. Modal yönetimi
4. Theme yönetimi (dark/light)
5. User type yönetimi (Team Leader / Manager)

**State Yönetimi**:
```typescript
// Veri State'leri
const [leads, setLeads] = useState<Lead[]>([]);
const [patients, setPatients] = useState<Patient[]>([]);
const [marketingSpend, setMarketingSpend] = useState<MarketingSpendRecord[]>([]);

// UI State'leri
const [filters, setFilters] = useState<FilterState>({...});
const [view, setView] = useState<ViewType>('overview');
const [theme, setTheme] = useState<'light' | 'dark'>('light');
const [userType, setUserType] = useState<'TEAM_LEADER' | 'MANAGER'>('TEAM_LEADER');

// Modal State'leri
const [isModalOpen, setIsModalOpen] = useState(false);
const [modalLeads, setModalLeads] = useState<Lead[]>([]);
const [modalTitle, setModalTitle] = useState('');
```

### View Components (Ekran Bileşenleri)

#### 1. Overview (Ana Dashboard)
**Dosya**: `App.tsx` içinde `Overview` component
**Amaç**: Genel performans metrikleri ve grafikler

**Özellikler**:
- **Metric Cards**: Opportunities, Closed Success, Conversion Rate
- **Conversion Funnel**: İnteraktif satış hunisi grafiği
- **Treatment Split**: Tedavi türü dağılımı (Pie Chart)
- **Pipeline Health Check**: Pipeline sağlık durumu (Bar Chart)
- **Lead Quality Momentum**: 7 günlük kalite trendi (Composed Chart)
- **Peak Traffic Analysis**: Saatlik trafik ısı haritası
- **Lead Quality Heatmap**: Gün x Ülke kalite matrisi

**Manager Exclusive Section**:
```typescript
{userType === 'MANAGER' && (
  <ManagerOverview leads={leads} />
)}
```
Manager kullanıcıları için ek analytics bölümü gösterilir.

**Chart Copy Feature**:
Her grafik üzerinde hover yapıldığında kamera ikonu görünür ve grafiği clipboard'a kopyalar:
```typescript
const copyChart = async (elementId: string) => {
  const element = document.getElementById(elementId);
  const canvas = await html2canvas(element, {...});
  canvas.toBlob(async (blob) => {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
  });
};
```

#### 2. Marketing Funnel View
**Dosya**: `components/MarketingFunnelView.tsx`
**Amaç**: Pazarlama kampanyalarının performans analizi

**Özellikler**:
- Campaign-level funnel analysis
- Adset performance comparison
- Ad creative effectiveness
- Cost per lead, cost per acquisition
- ROI hesaplamaları
- Spend vs Revenue grafiği

#### 3. Funnel Comparison View
**Dosya**: `components/FunnelComparisonView.tsx`
**Amaç**: Farklı segmentlerin hunilerini karşılaştırma

**Karşılaştırma Boyutları**:
- Ülkelere göre
- Tedavi türlerine göre
- Kaynaklara göre
- Temsilcilere göre
- Takımlara göre

#### 4. Rep Performance View (Scorecard)
**Dosya**: `components/RepPerformanceView.tsx`
**Amaç**: Satış temsilcilerinin bireysel performans kartları

**Metrikler**:
- Assigned Leads
- Interested Leads
- Conversion Rate
- Ticket Target vs Actual
- Revenue Target vs Actual
- Lead Quality Score
- Response Time

#### 5. Diagnosis View
**Dosya**: `components/DiagnosisView.tsx`
**Amaç**: Pipeline sağlık tanısı ve sorun tespiti

**Analizler**:
- Stale leads (uzun süredir güncellenmeyen)
- Low quality leads
- High NR count leads
- Bottleneck detection
- Conversion drop-off points

#### 6. Pareto Engine View (Insights)
**Dosya**: `components/ParetoEngineView.tsx`
**Amaç**: 80/20 kuralı ile kritik insights

**Analizler**:
- Top 20% countries generating 80% revenue
- Top performing campaigns
- Most valuable customer segments
- Efficiency metrics

#### 7. Pipeline Matrix View
**Dosya**: `components/PipelineView.tsx`
**Amaç**: Pipeline'ı matris formatında görüntüleme

**Yapı**:
```
         | Open | Active | Closed-Success | Negative/Lost
---------|------|--------|----------------|---------------
Dental   |  45  |  120   |      32        |      18
Hair     |  38  |   95   |      28        |      15
Other    |  12  |   30   |       8        |       5
```

Her hücre tıklanabilir ve detaylı lead listesi açar.

#### 8. Patient Ops View
**Dosya**: `components/PatientOpsView.tsx`
**Amaç**: Hasta operasyon ve lojistik yönetimi

**Özellikler**:
- Upcoming arrivals calendar
- Operation schedule
- Hotel bookings
- Airport pickup schedule
- Financial tracking (expected vs actual)
- Upsale opportunities

#### 9. CloudTalk View
**Dosya**: `components/CloudTalkView.tsx`
**Amaç**: CloudTalk entegrasyonu için placeholder

**Planlanan Özellikler**:
- Call logs
- Call recordings
- Call duration analytics
- Agent availability
- Call sentiment analysis

#### 10. Rep Splitter View
**Dosya**: `components/RepSplitterView.tsx`
**Amaç**: Lead dağıtım aracı

**Fonksiyon**:
- Leadleri temsilciler arasında otomatik dağıtma
- Workload balancing
- Skill-based routing

#### 11. Data Management View
**Dosya**: `components/DataManagementView.tsx`
**Amaç**: Veri import/export ve yönetim

**Özellikler**:
- CSV import (leads, marketing spend, patients)
- Data export
- Bulk operations
- Data validation
- Exchange rate management

### Utility Components

#### FilterBar
**Dosya**: `components/FilterBar.tsx`

**Filtre Türleri**:
1. **Date Range**: Month, Last Month, 6 Months, All Time, Custom
2. **Multi-select Filters**:
   - Treatments
   - Countries
   - Reps
   - Languages
   - Sources
   - Teams

**Kullanım**:
```typescript
<FilterBar
  filters={filters}
  setFilters={setFilters}
  options={filterOptions}
/>
```

#### FunnelChart
**Dosya**: `components/FunnelChart.tsx`

**Props**:
```typescript
interface FunnelChartProps {
  data: Record<string, number>;  // Stage counts
  height?: string;
  onBarClick?: (stage: string) => void;
}
```

**Görselleştirme**:
- Gradient bar chart
- Conversion rates between stages
- Interactive click handlers
- Responsive design

#### LeadListModal
**Dosya**: `components/LeadListModal.tsx`

**Özellikler**:
- Sortable columns
- Search functionality
- Export to CSV
- Pagination
- Column visibility toggle
- Lead detail view

**Kolonlar**:
- Lead ID
- Customer Name
- Country
- Treatment
- Status
- Rep Name
- Lead Score
- Create Date
- Last Activity
- Revenue

#### Header
**Dosya**: `components/Header.tsx`

**Özellikler**:
- Logo ve başlık
- User type switcher (Team Leader / Manager)
- Theme toggle (Light / Dark)
- Navigation bar
- Responsive design

#### ManagerOverview
**Dosya**: `components/ManagerOverview.tsx`

**Manager-Exclusive Analytics**:
- Ad Performance Table
- Sales by Country
- Language Performance
- Agent Performance Leaderboard
- Team Performance
- Monthly Trends

---

## ⚙️ Özellikler ve Fonksiyonlar

### 1. Veri Üretimi (Mock Data)

**generateData(count: number)**:
```typescript
// 1500 adet mock lead üretir
const leads = generateData(1500);
```

**Üretim Mantığı**:
- Rastgele tarih dağılımı (son 6 ay)
- Gerçekçi funnel dağılımı (weighted random)
- Lead score korelasyonu (başarılı leadler daha yüksek score)
- Marketing attribution (campaign, adset, ad)
- Team assignment

**generateMMSData(count: number)**:
```typescript
// 200 adet mock hasta verisi üretir
const patients = generateMMSData(200);
```

### 2. Filtreleme Sistemi

**filterLeads(leads, filters)**:

**Tarih Filtreleme**:
```typescript
// Preset ranges
if (filters.dateRange === 'month') {
  startCutoff = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  endCutoff = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
}

// Custom range
if (filters.dateRange === 'custom') {
  startCutoff = parseDate(filters.customDateStart);
  endCutoff = parseDate(filters.customDateEnd);
}
```

**Multi-Dimension Filtering**:
- AND logic between different filter types
- OR logic within same filter type
- Team filter expands to include all team members

### 3. Funnel Hesaplamaları

**calculateFunnelStats(leads)**:

**Kümülatif Mantık**:
```typescript
// Her aşama bir öncekini içerir
New: Tüm leadler
Interested: INTERESTED_SET'e dahil olanlar
WaitingEval: WAITING_EVAL_SET'e dahil olanlar
OfferSent: OFFER_SENT_SET'e dahil olanlar
Success: SUCCESS_SET'e dahil olanlar
Negative: NEGATIVE_LOST_SET'e dahil olanlar
```

**Conversion Rate Hesaplama**:
```typescript
const conversionRate = (success / new) * 100;
```

### 4. Pipeline Health Logic

**getPipelineBucket(status)**:

**Kategorileme**:
```typescript
if (status === 'New Lead' || status.startsWith('NR')) return 'Open';
if (SUCCESS_SET.has(status)) return 'Closed – Success';
if (NEGATIVE_LOST_SET.has(status)) return 'Negative/Lost';
return 'Active';  // Default fallback
```

### 5. Lead Quality Scoring

**Scoring Factors**:
1. **Base Random Score**: 0-10 arası rastgele
2. **Status Adjustment**: 
   - "Lost" = 4 (sabit)
   - Success = +2 bonus
3. **Correlation**: Yüksek score = yüksek dönüşüm olasılığı

**Score Interpretation**:
```typescript
const getScoreColor = (score: number) => {
  if (score < 1) return 'bg-red-500';      // Çok kötü
  if (score < 2) return 'bg-orange-500';   // Kötü
  if (score < 3) return 'bg-yellow-400';   // Orta-Kötü
  if (score <= 5) return 'bg-emerald-500'; // İyi
  return 'bg-purple-600';                  // Mükemmel
};
```

### 6. Interaktif Grafikler

**Click Handlers**:
Tüm grafikler tıklanabilir ve ilgili lead listesini açar:

```typescript
// Funnel bar click
onBarClick={(stage) => {
  const filtered = leads.filter(l => isInStage(l, stage));
  openModal(filtered, `Funnel Stage: ${stage}`);
}}

// Pie chart segment click
onClick={(data) => {
  const filtered = leads.filter(l => l.treatment === data.name);
  openModal(filtered, `Treatment: ${data.name}`);
}}

// Heatmap cell click
onClick={(country, hour) => {
  const filtered = leads.filter(l => 
    l.country === country && 
    new Date(l.createDate).getHours() === hour
  );
  openModal(filtered, `Traffic: ${country} @ ${hour}:00`);
}}
```

### 7. Theme System

**Dark Mode Implementation**:
```typescript
// LocalStorage persistence
const [theme, setTheme] = useState<'light' | 'dark'>(() => {
  return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
});

// Apply to DOM
useEffect(() => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}, [theme]);
```

**Tailwind Dark Mode**:
```typescript
// Light mode
className="bg-white text-slate-800"

// Dark mode
className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
```

### 8. Responsive Design

**Breakpoints**:
```typescript
// Mobile-first approach
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"

// Responsive padding
className="p-4 md:p-6 lg:p-8"

// Responsive text
className="text-sm md:text-base lg:text-lg"
```

### 9. Export Functionality

**Chart Export (Image)**:
```typescript
// html2canvas kullanarak grafik görüntüsü alma
const canvas = await html2canvas(element, {
  backgroundColor: isDark ? '#0f172a' : '#ffffff',
  scale: 2,  // Retina display için
});

// Clipboard'a kopyalama
canvas.toBlob(async (blob) => {
  await navigator.clipboard.write([
    new ClipboardItem({ 'image/png': blob })
  ]);
});
```

**Data Export (CSV)**:
LeadListModal içinde CSV export özelliği mevcut.

---

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- **Node.js**: v18 veya üzeri
- **npm**: v9 veya üzeri

### Kurulum Adımları

1. **Projeyi klonlayın**:
```bash
git clone https://github.com/esvweb/esvbi.git
cd esvbi
```

2. **Bağımlılıkları yükleyin**:
```bash
npm install
```

3. **Development server'ı başlatın**:
```bash
npm run dev
```

4. **Tarayıcıda açın**:
```
http://localhost:5173
```

### Production Build

```bash
# Build oluştur
npm run build

# Build'i preview et
npm run preview
```

Build çıktısı `dist/` klasöründe oluşur.

### Deployment

**Vercel**:
```bash
npm install -g vercel
vercel
```

**Netlify**:
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**GitHub Pages**:
```bash
npm run build
# dist/ klasörünü gh-pages branch'ine push edin
```

---

## 📖 Kullanım Kılavuzu

### İlk Giriş

1. **User Type Seçimi**:
   - Sağ üst köşeden "Team Leader" veya "Manager" seçin
   - Manager seçildiğinde ek analytics bölümleri görünür

2. **Theme Seçimi**:
   - Güneş/Ay ikonuna tıklayarak Light/Dark mode arasında geçiş yapın

### Filtreleme

1. **Tarih Aralığı**:
   - "This Month", "Last Month", "Last 6 Months", "All Time"
   - "Custom" seçerek özel tarih aralığı belirleyin

2. **Çoklu Filtreler**:
   - Treatment, Country, Rep, Language, Source, Team
   - Birden fazla seçim yapabilirsiniz
   - Filtreler AND mantığıyla çalışır

3. **Filtreleri Temizleme**:
   - "Clear All" butonuna tıklayın

### Grafik İnceleme

1. **Hover**:
   - Grafik üzerine gelin, detaylı tooltip görün

2. **Click**:
   - Bar, pie segment, heatmap cell'e tıklayın
   - İlgili lead listesi modal'da açılır

3. **Export**:
   - Grafik üzerine hover yapın
   - Kamera ikonuna tıklayın
   - Grafik clipboard'a kopyalanır

### Lead Listesi İnceleme

1. **Sıralama**:
   - Kolon başlığına tıklayarak sıralayın
   - İkinci tıklama ters sıralama yapar

2. **Arama**:
   - Üst kısımdaki search box'a yazın
   - Tüm kolonlarda arama yapar

3. **Export**:
   - "Export CSV" butonuna tıklayın
   - Filtrelenmiş veri CSV olarak indirilir

### View Geçişleri

**Navigation Bar**'dan istediğiniz view'a geçin:

1. **Overview**: Genel dashboard
2. **Marketing**: Pazarlama analizi
3. **Funnel Compare**: Segment karşılaştırma
4. **Scorecard**: Rep performansı
5. **Diagnosis**: Pipeline sağlık tanısı
6. **Insights**: Pareto analizi
7. **Pipeline Matrix**: Matris görünümü
8. **Patient Ops**: Hasta operasyonları
9. **CloudTalk**: Çağrı merkezi (placeholder)
10. **Rep Splitter**: Lead dağıtım aracı
11. **Data**: Veri yönetimi

---

## 🔧 Genişletme Rehberi

### Yeni Bir View Ekleme

1. **Component Oluştur**:
```typescript
// components/MyNewView.tsx
import React from 'react';
import { Lead } from '../types';

interface MyNewViewProps {
  leads: Lead[];
  onActionClick: (leads: Lead[], title: string) => void;
}

export const MyNewView: React.FC<MyNewViewProps> = ({ leads, onActionClick }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My New View</h2>
      {/* Your content */}
    </div>
  );
};
```

2. **App.tsx'e Ekle**:
```typescript
// Import
import { MyNewView } from './components/MyNewView';

// View type'a ekle
type ViewType = 'overview' | 'comparison' | ... | 'mynewview';

// Navigation'a ekle
{ id: 'mynewview', label: 'My New View', icon: Star }

// Render
{view === 'mynewview' && (
  <MyNewView leads={filteredLeads} onActionClick={handleMetricClick} />
)}
```

### Yeni Bir Filtre Ekleme

1. **FilterState'e Ekle** (`types.ts`):
```typescript
interface FilterState {
  // ... existing filters
  myNewFilter: string[];
}
```

2. **FilterBar'a Ekle** (`components/FilterBar.tsx`):
```typescript
<MultiSelect
  label="My New Filter"
  options={options.myNewFilterOptions}
  selected={filters.myNewFilter}
  onChange={(values) => setFilters({...filters, myNewFilter: values})}
/>
```

3. **filterLeads'e Ekle** (`services/mockData.ts`):
```typescript
if (filters.myNewFilter?.length > 0 && !filters.myNewFilter.includes(l.myField)) {
  return false;
}
```

### Yeni Bir Metrik Ekleme

1. **Hesaplama Fonksiyonu**:
```typescript
const calculateMyMetric = (leads: Lead[]) => {
  // Your calculation logic
  return result;
};
```

2. **useMemo ile Optimize Et**:
```typescript
const myMetric = useMemo(() => calculateMyMetric(leads), [leads]);
```

3. **UI'da Göster**:
```typescript
<TiltCard 
  title="My Metric" 
  val={myMetric} 
  sub="Description" 
  color="text-blue-600" 
  icon={Star}
  onClick={() => onMetricClick(leads, 'My Metric')}
/>
```

### Yeni Bir Grafik Ekleme

1. **Veri Hazırlama**:
```typescript
const chartData = useMemo(() => {
  return leads.map(l => ({
    name: l.customerName,
    value: l.leadScore
  }));
}, [leads]);
```

2. **Recharts Component**:
```typescript
<ResponsiveContainer width="100%" height={400}>
  <BarChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="value" fill="#3b82f6" />
  </BarChart>
</ResponsiveContainer>
```

3. **Copy Feature Ekle**:
```typescript
<div id="my-chart" className="relative group">
  <button 
    onClick={() => copyChart('my-chart')} 
    className="opacity-0 group-hover:opacity-100"
  >
    <Camera size={20} />
  </button>
  {/* Chart */}
</div>
```

### API Entegrasyonu

Şu anda mock data kullanılıyor. Gerçek API'ye geçiş için:

1. **API Service Oluştur**:
```typescript
// services/api.ts
export const fetchLeads = async (): Promise<Lead[]> => {
  const response = await fetch('/api/leads');
  return response.json();
};
```

2. **useEffect ile Fetch**:
```typescript
useEffect(() => {
  fetchLeads().then(setLeads);
}, []);
```

3. **Loading State Ekle**:
```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  setLoading(true);
  fetchLeads()
    .then(setLeads)
    .finally(() => setLoading(false));
}, []);
```

### Yeni Bir Status Ekleme

1. **Status Setlerine Ekle** (`services/mockData.ts`):
```typescript
export const STATUS_ACTIVE = [
  ...existing,
  'My New Status'
];
```

2. **Funnel Setlerine Ekle**:
```typescript
export const INTERESTED_SET = new Set([
  ...existing,
  "My New Status"
].map(s => s.toLowerCase()));
```

3. **Pipeline Bucket Logic'e Ekle**:
```typescript
export const getPipelineBucket = (status: string): PipelineBucket => {
  if (status === 'My New Status') return 'Active';
  // ... existing logic
};
```

---

## 🎨 Styling Guidelines

### Tailwind Classes

**Spacing**:
```typescript
p-4    // padding: 1rem
m-6    // margin: 1.5rem
gap-8  // gap: 2rem
```

**Colors**:
```typescript
bg-blue-500        // Primary blue
bg-slate-800       // Dark backgrounds
text-slate-600     // Secondary text
border-slate-200   // Borders
```

**Dark Mode**:
```typescript
bg-white dark:bg-slate-900
text-slate-800 dark:text-white
border-slate-200 dark:border-slate-700
```

**Responsive**:
```typescript
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
text-sm md:text-base lg:text-lg
p-4 md:p-6 lg:p-8
```

### Custom Animations

**Fade In**:
```css
.animate-fade-in {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**Slide Up**:
```css
.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 🐛 Troubleshooting

### Build Hatası

**Problem**: `npm run build` başarısız oluyor

**Çözüm**:
```bash
# Cache temizle
rm -rf node_modules
rm package-lock.json

# Yeniden yükle
npm install

# Tekrar dene
npm run build
```

### Dark Mode Çalışmıyor

**Problem**: Theme değişmiyor

**Çözüm**:
```typescript
// LocalStorage'ı kontrol et
localStorage.getItem('theme')

// Manuel set et
localStorage.setItem('theme', 'dark')
window.location.reload()
```

### Filtreler Çalışmıyor

**Problem**: Filtre seçildiğinde veri değişmiyor

**Çözüm**:
```typescript
// filterLeads fonksiyonunu kontrol et
console.log('Filters:', filters);
console.log('Filtered Leads:', filteredLeads);

// useMemo dependency array'ini kontrol et
const filteredLeads = useMemo(() => filterLeads(leads, filters), [leads, filters]);
```

---

## 📊 Performance Optimization

### useMemo Kullanımı

Pahalı hesaplamaları cache'leyin:
```typescript
const expensiveCalculation = useMemo(() => {
  return leads.reduce((acc, lead) => {
    // Complex calculation
    return acc + lead.revenue;
  }, 0);
}, [leads]); // Only recalculate when leads change
```

### useCallback Kullanımı

Fonksiyonları memoize edin:
```typescript
const handleClick = useCallback((leadId: string) => {
  // Handler logic
}, [dependencies]);
```

### Lazy Loading

Büyük componentleri lazy load edin:
```typescript
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

### Virtual Scrolling

Uzun listelerde virtual scrolling kullanın:
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={leads.length}
  itemSize={50}
>
  {({ index, style }) => (
    <div style={style}>{leads[index].customerName}</div>
  )}
</FixedSizeList>
```

---

## 🔐 Security Considerations

### XSS Prevention

User input'u sanitize edin:
```typescript
import DOMPurify from 'dompurify';

const sanitized = DOMPurify.sanitize(userInput);
```

### API Keys

Environment variables kullanın:
```typescript
const API_KEY = import.meta.env.VITE_API_KEY;
```

`.env.local`:
```
VITE_API_KEY=your_api_key_here
```

### CORS

Backend'de CORS ayarlarını yapın:
```typescript
app.use(cors({
  origin: 'https://yourdomain.com',
  credentials: true
}));
```

---

## 📝 Best Practices

### TypeScript

1. **Strict Mode Kullanın**:
```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

2. **Type Inference'dan Yararlanın**:
```typescript
// Good
const leads = generateData(1500);

// Unnecessary
const leads: Lead[] = generateData(1500);
```

3. **Interface > Type**:
```typescript
// Preferred
interface Lead { ... }

// Avoid unless necessary
type Lead = { ... }
```

### React

1. **Functional Components**:
```typescript
// Good
const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => { ... }

// Avoid
class MyComponent extends React.Component { ... }
```

2. **Hooks Kuralları**:
- Top level'da çağırın
- Conditional içinde kullanmayın
- Custom hooks oluşturun

3. **Props Destructuring**:
```typescript
// Good
const MyComponent = ({ title, value }) => { ... }

// Avoid
const MyComponent = (props) => {
  const title = props.title;
  ...
}
```

### Performance

1. **useMemo ve useCallback**:
Pahalı hesaplamalar ve event handler'lar için kullanın

2. **Key Props**:
List rendering'de unique key kullanın

3. **Code Splitting**:
Route-based code splitting yapın

---

## 🎯 Sonuç

Bu dokümantasyon, Esvitabi Dashboard projesinin tüm teknik detaylarını içermektedir. Proje, modern React best practices kullanılarak geliştirilmiş, ölçeklenebilir ve bakımı kolay bir yapıya sahiptir.

### Önemli Notuşlar

1. **Mock Data**: Şu anda mock data kullanılıyor, gerçek API entegrasyonu için `services/api.ts` oluşturun
2. **Responsive**: Tüm ekranlar mobil-uyumlu
3. **Dark Mode**: Sistem genelinde dark mode desteği
4. **TypeScript**: Tip güvenliği için TypeScript kullanılıyor
5. **Modüler**: Her component bağımsız çalışabilir

### İletişim

Sorularınız için:
- GitHub: https://github.com/esvweb/esvbi
- Issues: https://github.com/esvweb/esvbi/issues

---

**Son Güncelleme**: 3 Ocak 2026
**Versiyon**: 1.0.0
**Yazar**: Esvita Development Team
