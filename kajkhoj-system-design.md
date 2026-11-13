# 🛠️ কাজখোঁজ (KajKhoj) — কাজের লোক খোঁজার প্ল্যাটফর্ম
### সম্পূর্ণ সিস্টেম ডিজাইন ডকুমেন্ট (Angular + PrimeNG + Firebase + Vector Map)

> **এক লাইনে আইডিয়া:** Uber-এ যেমন মানুষ গাড়ি খোঁজে, ঠিক তেমনি এখানে মানুষ ম্যাপে কাজের লোক খুঁজবে — প্লাম্বার, ইলেকট্রিশিয়ান, টেকনিশিয়ান, দিনমজুর, ক্লিনার, পেইন্টার, যেকোনো সার্ভিস। কাছের ওয়ার্কাররা রিকোয়েস্ট পাবে, যে আগে নেবে সে কাজ পাবে। প্ল্যাটফর্ম প্রতিটি কাজ থেকে কমিশন আয় করবে।

---

## 📑 সূচিপত্র

1. [প্রজেক্ট ওভারভিউ](#১-প্রজেক্ট-ওভারভিউ)
2. [ইউজার রোল ও পারমিশন](#২-ইউজার-রোল-ও-পারমিশন)
3. [মূল ফিচার লিস্ট](#৩-মূল-ফিচার-লিস্ট)
4. [ম্যাপ সিস্টেম (Vector Map — ফ্রি)](#৪-ম্যাপ-সিস্টেম-vector-map--ফ্রি)
5. [লোকেশন সিস্টেম (অনলাইন/অফলাইন)](#৫-লোকেশন-সিস্টেম-অনলাইনঅফলাইন)
6. [এরিয়া-ভিত্তিক সিস্টেম](#৬-এরিয়া-ভিত্তিক-সিস্টেম)
7. [Uber-এর মতো জব ডিসপ্যাচ সিস্টেম](#৭-uber-এর-মতো-জব-ডিসপ্যাচ-সিস্টেম)
8. [প্রাইসিং সিস্টেম — দাম কে সেট করবে?](#৮-প্রাইসিং-সিস্টেম--দাম-কে-সেট-করবে)
9. [আয়ের মডেল (Revenue Model)](#৯-আয়ের-মডেল-revenue-model)
10. [রেটিং, রিভিউ ও ব্যান সিস্টেম](#১০-রেটিং-রিভিউ-ও-ব্যান-সিস্টেম)
11. [সিকিউরিটি সিস্টেম](#১১-সিকিউরিটি-সিস্টেম)
12. [Firebase ডেটাবেস স্ট্রাকচার](#১২-firebase-ডেটাবেস-স্ট্রাকচার)
13. [Firebase Security Rules](#১৩-firebase-security-rules)
14. [Cloud Functions লিস্ট](#১৪-cloud-functions-লিস্ট)
15. [Angular প্রজেক্ট স্ট্রাকচার](#১৫-angular-প্রজেক্ট-স্ট্রাকচার)
16. [Admin ও Super Admin প্যানেল](#১৬-admin-ও-super-admin-প্যানেল)
17. [পেমেন্ট সিস্টেম](#১৭-পেমেন্ট-সিস্টেম)
18. [নোটিফিকেশন সিস্টেম](#১৮-নোটিফিকেশন-সিস্টেম)
19. [অতিরিক্ত ফিচার সাজেশন](#১৯-অতিরিক্ত-ফিচার-সাজেশন)
20. [ডেভেলপমেন্ট রোডম্যাপ](#২০-ডেভেলপমেন্ট-রোডম্যাপ)

---

## ১. প্রজেক্ট ওভারভিউ

### টেক স্ট্যাক

| অংশ | টেকনোলজি |
|------|-----------|
| ফ্রন্টএন্ড | Angular (Standalone Components, প্রতিটা কম্পোনেন্টে আলাদা `.html`, `.scss`, `.ts` ফাইল) |
| UI লাইব্রেরি | PrimeNG + PrimeIcons + PrimeFlex |
| ডেটাবেস | Firebase Firestore (মূল ডেটা) + Firebase Realtime Database (লাইভ লোকেশন) |
| অথেনটিকেশন | Firebase Auth (ফোন OTP + Email/Password) |
| ফাইল স্টোরেজ | Firebase Storage (প্রোফাইল ছবি, NID, কাজের ছবি) |
| ব্যাকএন্ড লজিক | Firebase Cloud Functions (জব ডিসপ্যাচ, কমিশন হিসাব, অটো-ব্যান) |
| নোটিফিকেশন | Firebase Cloud Messaging (FCM) |
| ম্যাপ | MapLibre GL JS + OpenFreeMap (সম্পূর্ণ ফ্রি Vector Tiles, API key লাগে না) |
| জিও কুয়েরি | `geofire-common` (Geohash দিয়ে কাছের ওয়ার্কার খোঁজা) |
| অ্যাপ | PWA (প্রথমে), পরে Capacitor দিয়ে Android/iOS অ্যাপ |

> ⚠️ **নোট:** Cloud Functions চালাতে Firebase-এর **Blaze (Pay as you go)** প্ল্যান লাগে। তবে ছোট স্কেলে খরচ খুবই কম, ফ্রি কোটার মধ্যেই অনেক কিছু চলে যায়।

### কেন দুইটা ডেটাবেস?
- **Firestore** → ইউজার, জব, রিভিউ, পেমেন্ট — স্ট্রাকচার্ড ডেটা ও জটিল কুয়েরির জন্য।
- **Realtime Database** → ওয়ার্কারের লাইভ লোকেশন প্রতি ১০–৩০ সেকেন্ডে আপডেট হয়। Firestore-এ প্রতিটা write-এর চার্জ আছে, Realtime DB-তে ব্যান্ডউইথ অনুযায়ী — তাই ঘন ঘন লোকেশন আপডেটে এটা অনেক সস্তা ও দ্রুত।

---

## ২. ইউজার রোল ও পারমিশন

সিস্টেমে মোট ৪টি রোল থাকবে। রোল সংরক্ষণ করা হবে **Firebase Custom Claims**-এ (যাতে কেউ নিজে রোল পরিবর্তন করতে না পারে)।

| রোল | কাজ |
|------|------|
| 👑 **Super Admin** | পুরো সিস্টেমের মালিক। Admin তৈরি/মুছে ফেলা, কমিশন রেট সেট, ক্যাটাগরি ও এরিয়া ম্যানেজ, সব আয়ের রিপোর্ট, Admin-কেও ব্যান করতে পারে |
| 🛡️ **Admin** | দৈনন্দিন অপারেশন। ওয়ার্কার ভেরিফাই, কমপ্লেইন সমাধান, ইউজার/ওয়ার্কার সাসপেন্ড, জব মনিটর। (নির্দিষ্ট এরিয়ার Admin-ও করা যাবে) |
| 🔧 **Worker** | সার্ভিস দেয়। প্রোফাইল, স্কিল, লোকেশন, অনলাইন/অফলাইন, জব গ্রহণ, আয় দেখা |
| 👤 **Customer (User)** | সার্ভিস নেয়। ম্যাপে ওয়ার্কার খোঁজা, বুকিং, পেমেন্ট, রেটিং দেওয়া |

### পারমিশন ম্যাট্রিক্স

| কাজ | Super Admin | Admin | Worker | Customer |
|------|:---:|:---:|:---:|:---:|
| Admin তৈরি/ডিলিট | ✅ | ❌ | ❌ | ❌ |
| কমিশন রেট পরিবর্তন | ✅ | ❌ | ❌ | ❌ |
| ক্যাটাগরি ও বেস প্রাইস সেট | ✅ | 👁️ দেখতে পারবে | ❌ | ❌ |
| এরিয়া/জোন তৈরি | ✅ | ✅ (নিজের এরিয়ায়) | ❌ | ❌ |
| ওয়ার্কার ভেরিফাই | ✅ | ✅ | ❌ | ❌ |
| ইউজার/ওয়ার্কার ব্যান | ✅ | ✅ (সাময়িক) | ❌ | ❌ |
| পার্মানেন্ট ব্যান / আনব্যান | ✅ | ❌ | ❌ | ❌ |
| সব আয়ের রিপোর্ট | ✅ | আংশিক | নিজের | ❌ |
| জব রিকোয়েস্ট | ❌ | ❌ | ❌ | ✅ |
| জব গ্রহণ | ❌ | ❌ | ✅ | ❌ |
| রেটিং দেওয়া | ❌ | ❌ | ✅ (কাস্টমারকে) | ✅ (ওয়ার্কারকে) |

> 💡 **দুই দিকের রেটিং:** Uber-এর মতো ওয়ার্কারও কাস্টমারকে রেটিং দেবে। খারাপ আচরণের কাস্টমারও ব্যান হতে পারবে।

---

## ৩. মূল ফিচার লিস্ট

### 👤 কাস্টমার
- ফোন নম্বর + OTP দিয়ে সাইন আপ
- ম্যাপে কাছের সব ওয়ার্কার দেখা (ছবিসহ মার্কার)
- ক্যাটাগরি ফিল্টার (প্লাম্বার, ইলেকট্রিশিয়ান, এসি টেকনিশিয়ান, দিনমজুর, রাজমিস্ত্রি, পেইন্টার, ক্লিনার, কার্পেন্টার ইত্যাদি)
- ওয়ার্কারের মার্কারে ক্লিক → পপআপে ছবি, নাম, রেটিং, দাম → প্রোফাইল দেখা
- **দুই রকম বুকিং:**
  - ⚡ **Instant Request** — Uber-এর মতো, কাছের ওয়ার্কাররা রিকোয়েস্ট পাবে
  - 📌 **Direct Booking** — নির্দিষ্ট ওয়ার্কার বেছে নিয়ে বুক করা
  - 📅 **Scheduled Booking** — ভবিষ্যতের তারিখ ও সময়ে বুকিং
- কাজের বিবরণ, ছবি আপলোড (যেমন: লিক হওয়া পাইপের ছবি)
- ওয়ার্কার আসার সময় লাইভ ট্র্যাকিং
- কাজ শুরুর OTP
- পেমেন্ট (ক্যাশ / bKash / Nagad / কার্ড)
- রেটিং ও রিভিউ
- প্রিয় ওয়ার্কার সেভ রাখা
- বুকিং হিস্ট্রি, কমপ্লেইন করা
- SOS বাটন

### 🔧 ওয়ার্কার
- সাইন আপ → প্রোফাইল → NID ও সেলফি আপলোড → Admin ভেরিফিকেশন
- **প্রথমবারেই হোম/বেস লোকেশন সেট করা বাধ্যতামূলক** (ম্যাপে পিন বসিয়ে)
- একাধিক স্কিল/ক্যাটাগরি সিলেক্ট
- নিজের রেট সেট (Admin-এর নির্ধারিত সীমার মধ্যে)
- কাজের এরিয়া/রেডিয়াস সেট (যেমন: ৫ কিমি পর্যন্ত যাব)
- অনলাইন/অফলাইন টগল
- জব রিকোয়েস্ট পপআপ (Accept/Reject, ৩০ সেকেন্ড টাইমার)
- কাছের ওপেন জব বোর্ড দেখা ও নিজের ক্যাটাগরির কাজ Grab করা
- আয়ের ড্যাশবোর্ড (দৈনিক/সাপ্তাহিক/মাসিক)
- ওয়ালেট — কমিশন বাকি থাকলে পরিশোধ
- কাস্টমারকে রেটিং দেওয়া

### 🛡️ Admin / 👑 Super Admin
- সম্পূর্ণ CRUD — ইউজার, ওয়ার্কার, ক্যাটাগরি, এরিয়া, জব, রিভিউ, পেমেন্ট
- ভেরিফিকেশন কিউ
- ব্যান/সাসপেন্ড/ওয়ার্নিং
- লাইভ ম্যাপ — সব অনলাইন ওয়ার্কার ও চলমান জব
- রিপোর্ট ও অ্যানালিটিক্স (বিস্তারিত সেকশন ১৬-তে)

---

## ৪. ম্যাপ সিস্টেম (Vector Map — ফ্রি)

### কোন ম্যাপ ব্যবহার করব?

**✅ সাজেশন: MapLibre GL JS + OpenFreeMap**

| বিষয় | বিস্তারিত |
|-------|-----------|
| লাইব্রেরি | `maplibre-gl` (ওপেন সোর্স, Mapbox GL-এর ফ্রি ফর্ক) |
| টাইল | OpenFreeMap — ফ্রি Vector Tiles, কোনো API key লাগে না, কোনো লিমিট নেই |
| স্টাইল URL | `https://tiles.openfreemap.org/styles/liberty` (অন্য স্টাইল: `bright`, `positron`) |
| বিকল্প | MapTiler (ফ্রি টিয়ারে API key লাগে), বাংলাদেশি সার্ভিস Barikoi (লোকাল ঠিকানা ভালো) |
| ঠিকানা খোঁজা (Geocoding) | Nominatim (ফ্রি, তবে রেট লিমিট আছে) অথবা Barikoi API |

> যেহেতু OpenFreeMap-এ API key নেই, তাই key লিক হওয়ার ঝুঁকিও নেই। পরে যদি MapTiler/Barikoi নেন, তাহলে key টা `environment.ts`-এ রাখবেন এবং ঐ সার্ভিসের ড্যাশবোর্ডে **ডোমেইন রেস্ট্রিকশন** অবশ্যই চালু করবেন।

### ইনস্টল
```bash
npm install maplibre-gl geofire-common
```

`angular.json` → styles-এ যোগ করুন:
```json
"styles": [
  "node_modules/maplibre-gl/dist/maplibre-gl.css",
  "src/styles.scss"
]
```

### ছবিসহ মার্কার (ম্যাপে ওয়ার্কারের ছবি পপ হবে)

প্রতিটা ওয়ার্কার ম্যাপে একটা **গোল ছবির মার্কার** হিসেবে দেখাবে:
- 🟢 সবুজ বর্ডার = অনলাইন ও ফ্রি
- 🟠 কমলা বর্ডার = অনলাইন কিন্তু কাজে ব্যস্ত
- ⚪ ধূসর বর্ডার (ছবি হালকা) = অফলাইন (হোম লোকেশনে দেখাবে)
- ছবির নিচে ছোট ক্যাটাগরি আইকন (🔧 ⚡ 🧹)
- ✔️ ভেরিফায়েড ব্যাজ

```typescript
// map.service.ts (সংক্ষিপ্ত উদাহরণ)
import maplibregl from 'maplibre-gl';

createWorkerMarker(worker: Worker, map: maplibregl.Map) {
  const el = document.createElement('div');
  el.className = `worker-marker ${worker.isOnline ? (worker.isBusy ? 'busy' : 'online') : 'offline'}`;
  el.innerHTML = `
    <img src="${worker.photoURL}" alt="${worker.name}" />
    <span class="cat-icon">${worker.categoryIcon}</span>
  `;

  const popup = new maplibregl.Popup({ offset: 30 }).setHTML(`
    <div class="worker-popup">
      <img src="${worker.photoURL}" />
      <h4>${worker.name} ${worker.verified ? '✔️' : ''}</h4>
      <p>${worker.categoryName} • ⭐ ${worker.rating.toFixed(1)} (${worker.totalJobs} কাজ)</p>
      <p>৳${worker.rate} / ${worker.rateUnit}</p>
      <p>${worker.isOnline ? '🟢 অনলাইন' : '⚪ অফলাইন'} • ${worker.distanceKm} কিমি দূরে</p>
      <button data-id="${worker.uid}" class="view-profile-btn">প্রোফাইল দেখুন</button>
    </div>
  `);

  const pos = worker.isOnline ? worker.liveLocation : worker.homeLocation;
  return new maplibregl.Marker({ element: el })
    .setLngLat([pos.lng, pos.lat])
    .setPopup(popup)
    .addTo(map);
}
```

```scss
// worker-marker.scss
.worker-marker {
  width: 48px; height: 48px; border-radius: 50%;
  border: 3px solid #9ca3af; overflow: hidden; cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,.3); position: relative;
  transition: transform .2s;
  img { width: 100%; height: 100%; object-fit: cover; }
  &.online { border-color: #22c55e; }
  &.busy   { border-color: #f97316; }
  &.offline { img { filter: grayscale(80%); opacity: .7; } }
  &:hover { transform: scale(1.15); }
}
```

### ম্যাপের অতিরিক্ত ফিচার
- **Clustering:** অনেক ওয়ার্কার একসাথে থাকলে "২৫" লেখা একটা গোল গ্রুপ দেখাবে, জুম করলে আলাদা হবে।
- **"আমার কাছে" বাটন:** কাস্টমারের বর্তমান লোকেশনে ম্যাপ চলে যাবে।
- **রেডিয়াস সার্কেল:** কাস্টমারের চারপাশে ৩/৫/১০ কিমি সার্কেল।
- **রুট লাইন:** ওয়ার্কার আসার সময় ওয়ার্কার→কাস্টমার পথ দেখাবে (OSRM ফ্রি রাউটিং দিয়ে)।
- **Admin হিটম্যাপ:** কোন এলাকায় চাহিদা বেশি তা দেখাবে।

### প্রোফাইলে ক্লিক করলে কী দেখাবে
- বড় প্রোফাইল ছবি, নাম, ভেরিফায়েড ব্যাজ
- স্কিল ও ক্যাটাগরি, অভিজ্ঞতা (বছর)
- রেটিং (PrimeNG `p-rating`), মোট কাজ, কাজ সম্পন্নের হার
- রেট / দাম
- কাজের এরিয়া
- পূর্বের কাজের ছবি (পোর্টফোলিও গ্যালারি)
- সাম্প্রতিক রিভিউ
- **ফোন নম্বর** — নিরাপত্তার জন্য সাজেশন:
  - বুকিংয়ের আগে: মাস্ক করা `017XX-XXX-890`
  - বুকিং কনফার্ম হলে: পুরো নম্বর + "কল করুন" বাটন
  - (চাইলে Super Admin সেটিংস থেকে এটা অন/অফ করতে পারবে)
- "এখনই বুক করুন" ও "প্রিয়তে রাখুন" বাটন

---

## ৫. লোকেশন সিস্টেম (অনলাইন/অফলাইন)

### নিয়ম

| অবস্থা | ম্যাপে কোথায় দেখাবে | কীভাবে |
|---------|---------------------|--------|
| **নতুন অ্যাকাউন্ট** | — | রেজিস্ট্রেশনে হোম/বেস লোকেশন পিন করা বাধ্যতামূলক, না দিলে পরের ধাপে যেতে পারবে না |
| **অফলাইন** | হোম লোকেশনে (ধূসর মার্কার) | Firestore `workers/{uid}.homeLocation` |
| **অনলাইন** | আসল বর্তমান লোকেশনে (সবুজ মার্কার) | Realtime DB `liveLocations/{uid}` |
| **কাজে ব্যস্ত** | বর্তমান লোকেশনে (কমলা মার্কার), নতুন রিকোয়েস্ট পাবে না | `isBusy = true` |

> 🔐 **প্রাইভেসি সাজেশন:** অফলাইন অবস্থায় হোম লোকেশন হুবহু না দেখিয়ে ~২০০ মিটার এদিক-ওদিক করে (Fuzzing) দেখান, যাতে কেউ ওয়ার্কারের বাসার সঠিক ঠিকানা না পায়।

### লাইভ লোকেশন আপডেটের লজিক
```
ওয়ার্কার "অনলাইন" চাপলো
   ↓
ব্রাউজার/অ্যাপ লোকেশন পারমিশন চাইবে
   ↓
navigator.geolocation.watchPosition() চালু
   ↓
প্রতিবার নতুন পজিশন এলে:
   যদি আগের থেকে ৫০ মিটারের বেশি সরে  অথবা ৩০ সেকেন্ড পার হয়
      → Realtime DB-তে {lat, lng, geohash, updatedAt} আপডেট
   ↓
onDisconnect() সেট করা থাকবে → অ্যাপ বন্ধ / নেট গেলে অটো "অফলাইন"
   ↓
৫ মিনিট কোনো আপডেট না এলে Cloud Function অটো অফলাইন করে দেবে
```

```typescript
// location.service.ts (মূল অংশ)
goOnline(uid: string) {
  const ref = rtdbRef(this.rtdb, `liveLocations/${uid}`);
  onDisconnect(ref).remove();                 // নেট গেলে লোকেশন মুছে যাবে
  this.watchId = navigator.geolocation.watchPosition(
    pos => this.pushIfMoved(uid, pos.coords.latitude, pos.coords.longitude),
    err => this.toast.error('লোকেশন পাওয়া যাচ্ছে না'),
    { enableHighAccuracy: true, maximumAge: 10000 }
  );
}
```

### ফেক GPS প্রতিরোধ
- পরপর দুই আপডেটের মধ্যে অসম্ভব দূরত্ব (যেমন ১০ সেকেন্ডে ৫০ কিমি) → ফ্ল্যাগ
- `accuracy` খুব খারাপ হলে আপডেট গ্রহণ না করা
- মোবাইল অ্যাপে (Capacitor) Mock Location ডিটেকশন

---

## ৬. এরিয়া-ভিত্তিক সিস্টেম

### এরিয়া হায়ারার্কি (বাংলাদেশের প্রশাসনিক কাঠামো অনুযায়ী)
```
বিভাগ (Division)  →  জেলা (District)  →  উপজেলা/থানা  →  জোন (Zone)
   ঢাকা               ঢাকা                 সাভার           সাভার বাজার, আশুলিয়া, হেমায়েতপুর
```

### এরিয়া দিয়ে কী কী হবে
1. **সার্ভিস চালু/বন্ধ:** Super Admin শুধু নির্দিষ্ট এরিয়ায় সার্ভিস চালু করবে (যেমন প্রথমে শুধু ঢাকা ও সাভার)। অন্য এলাকার ইউজার "শীঘ্রই আসছে" দেখবে।
2. **এরিয়া-ভিত্তিক দাম:** গুলশানে প্লাম্বারের রেট আর সাভারে রেট আলাদা হতে পারে।
3. **এরিয়া-ভিত্তিক কমিশন:** নতুন এলাকায় কম কমিশন দিয়ে ওয়ার্কার আকর্ষণ।
4. **এরিয়া Admin:** প্রতিটা জোনের জন্য আলাদা Admin নিয়োগ করা যাবে, সে শুধু নিজের এলাকার ডেটা দেখবে।
5. **সার্জ প্রাইসিং:** কোনো এলাকায় চাহিদা বেশি কিন্তু ওয়ার্কার কম হলে দাম ১.২x–১.৫x।
6. **এরিয়া রিপোর্ট:** কোন এলাকায় কত জব, কত আয়, কোন ক্যাটাগরির চাহিদা বেশি।

### এরিয়া কীভাবে নির্ধারণ হবে
- প্রতিটা জোনের একটা **কেন্দ্রবিন্দু + রেডিয়াস** অথবা **পলিগন** (Admin ম্যাপে এঁকে দেবে)।
- কাস্টমার/ওয়ার্কারের লোকেশন কোন পলিগনের ভেতরে পড়ে তা Cloud Function-এ `@turf/boolean-point-in-polygon` দিয়ে বের করে `areaId` সেভ হবে।

---

## ৭. Uber-এর মতো জব ডিসপ্যাচ সিস্টেম

এটাই অ্যাপের হৃদয়। দুইটা মোড থাকবে:

### মোড ১: ⚡ Instant Request (Uber স্টাইল — "লাইনে আসা")

```
কাস্টমার রিকোয়েস্ট করলো (ক্যাটাগরি: প্লাম্বার, লোকেশন, বিবরণ, ছবি)
        ↓
Cloud Function: onJobCreated
        ↓
ধাপ ১: খোঁজো — অনলাইন ✔ ফ্রি ✔ ভেরিফায়েড ✔ ব্যান নয় ✔ একই ক্যাটাগরি ✔ 
        ৩ কিমির মধ্যে ✔ কমিশন বাকি সীমার নিচে ✔
        ↓
ধাপ ২: স্কোর করো (কে আগে পাবে)
        ↓
ধাপ ৩: সেরা ৩–৫ জনকে একসাথে পুশ নোটিফিকেশন + সাউন্ড + পপআপ (৩০ সেকেন্ড টাইমার)
        ↓
        ├─ কেউ Accept করলো → Firestore Transaction দিয়ে লক 
        │     (যে আগে চাপবে সে পাবে, বাকিদের রিকোয়েস্ট সাথে সাথে বাতিল)
        │
        └─ ৩০ সেকেন্ডে কেউ নিলো না →
              রেডিয়াস বাড়াও: ৩ → ৫ → ১০ কিমি, পরের ব্যাচকে পাঠাও
              ↓
              তবুও কেউ না নিলে → কাস্টমারকে জানাও "এই মুহূর্তে কেউ ফ্রি নেই, 
              শিডিউল করবেন?" + জব বোর্ডে পোস্ট করে দাও
```

#### স্কোরিং ফর্মুলা (কাকে আগে রিকোয়েস্ট দেবে)
```
score = (দূরত্ব স্কোর × ০.৪০)
      + (রেটিং স্কোর × ০.২৫)
      + (Accept রেট × ০.১৫)
      + (কতক্ষণ কাজ ছাড়া বসে আছে × ০.১০)   ← সবাই যেন কাজ পায়
      + (প্রিমিয়াম/ফিচার্ড বোনাস × ০.১০)
```
> ওজনগুলো Super Admin সেটিংস থেকে পরিবর্তন করতে পারবে।

### মোড ২: 📋 জব বোর্ড (ওয়ার্কার নিজে কাজ Grab করবে)

- কাস্টমার কাজ পোস্ট করবে (বিশেষ করে বড়/শিডিউলড কাজ, যেমন "পুরো বাসা রং করতে হবে, আগামী শুক্রবার")।
- ওয়ার্কাররা নিজের **ক্যাটাগরি ও এরিয়া অনুযায়ী** লিস্ট দেখবে, দূরত্ব অনুযায়ী সাজানো।
- দুই অপশন:
  - **Fixed Price জব** → প্রথমে যে "Grab" চাপবে সে পাবে
  - **Bidding জব** → ওয়ার্কাররা দাম প্রস্তাব (Quote) দেবে, কাস্টমার রেটিং ও দাম দেখে বেছে নেবে

### জব স্ট্যাটাস ফ্লো
```
pending → searching → accepted → on_the_way → arrived → in_progress → completed → paid → reviewed
                ↘ no_worker_found
         (যেকোনো ধাপে) → cancelled_by_customer / cancelled_by_worker / disputed
```

### কাজ শুরু ও শেষের নিরাপত্তা
- ওয়ার্কার পৌঁছে **কাস্টমারের ফোনে দেখানো ৪ সংখ্যার OTP** দিলে তবেই কাজ শুরু হবে (ভুয়া "কাজ শুরু" প্রতিরোধ)।
- কাজ শেষে ওয়ার্কার "সম্পন্ন" চাপবে + ঐচ্ছিকভাবে কাজের পরের ছবি আপলোড, কাস্টমার কনফার্ম করবে।

### ক্যান্সেলেশন নিয়ম
| কে | কখন | ফলাফল |
|----|------|--------|
| কাস্টমার | Accept-এর ২ মিনিটের মধ্যে | ফ্রি |
| কাস্টমার | ওয়ার্কার রওনা দেওয়ার পর | ক্যান্সেলেশন ফি (যেমন ৳৫০, ওয়ার্কার পাবে) |
| ওয়ার্কার | Accept-এর পর | Cancellation rate বাড়বে, বেশি হলে সাময়িক ব্লক |

---

## ৮. প্রাইসিং সিস্টেম — দাম কে সেট করবে?

এটা আপনার বড় প্রশ্ন ছিল। **আমার সাজেশন: হাইব্রিড মডেল** — প্ল্যাটফর্ম সীমা ঠিক করবে, ওয়ার্কার সেই সীমার মধ্যে নিজের দাম রাখবে।

### স্তর ১: Super Admin সেট করবে (প্রতিটা ক্যাটাগরি × এরিয়া)
| ক্যাটাগরি | দামের ধরন | বেস প্রাইস | সর্বনিম্ন | সর্বোচ্চ | ভিজিট চার্জ | কমিশন |
|-----------|-----------|-----------|----------|---------|-----------|--------|
| প্লাম্বার | প্রতি কাজ/ঘণ্টা | ৳৩০০ | ৳২০০ | ৳৮০০ | ৳১০০ | ১৫% |
| ইলেকট্রিশিয়ান | প্রতি কাজ/ঘণ্টা | ৳৩৫০ | ৳২৫০ | ৳১০০০ | ৳১০০ | ১৫% |
| দিনমজুর | প্রতি দিন | ৳৭০০ | ৳৫০০ | ৳১২০০ | — | ১০% |
| রাজমিস্ত্রি | প্রতি দিন | ৳১০০০ | ৳৮০০ | ৳১৬০০ | — | ১০% |
| এসি টেকনিশিয়ান | প্রতি কাজ | ৳৮০০ | ৳৫০০ | ৳২৫০০ | ৳১৫০ | ১৮% |
| ক্লিনার | প্রতি ঘণ্টা | ৳২৫০ | ৳১৫০ | ৳৫০০ | — | ১৫% |

> ⚠️ উপরের সংখ্যাগুলো শুধু উদাহরণ। বাস্তবে সাভার/ঢাকার বাজার যাচাই করে Super Admin সেট করবেন।

### স্তর ২: Worker সেট করবে
- নিজের রেট **সর্বনিম্ন–সর্বোচ্চ সীমার মধ্যে** বেছে নেবে।
- অভিজ্ঞ, উচ্চ রেটিংয়ের ওয়ার্কার বেশি দাম রাখতে পারবে — বাজার নিজেই ব্যালান্স করবে।
- ঐচ্ছিক: রেটিং ৪.৫+ ও ৫০+ কাজ হলে সর্বোচ্চ সীমা ২০% বেশি রাখার অনুমতি (রিওয়ার্ড)।

### স্তর ৩: চূড়ান্ত বিল
```
মোট বিল = ভিজিট চার্জ
        + (ওয়ার্কারের রেট × ঘণ্টা/দিন)  অথবা  নির্দিষ্ট কাজের দাম
        + মালামালের খরচ (ওয়ার্কার রসিদ/ছবিসহ যোগ করবে, কাস্টমার অনুমোদন করবে)
        × সার্জ মাল্টিপ্লায়ার (যদি থাকে)
        + প্ল্যাটফর্ম ফি (কাস্টমার থেকে, ঐচ্ছিক, যেমন ৳২০)
        − কুপন ডিসকাউন্ট
```

- বুকিংয়ের আগে কাস্টমার **আনুমানিক দাম (Estimate)** দেখবে।
- কাজ দেখে দাম বেশি হলে ওয়ার্কার নতুন Quote পাঠাবে, কাস্টমার অ্যাপে অনুমোদন দেবে — মুখে মুখে দরকষাকষির ঝামেলা কমবে।

---

## ৯. আয়ের মডেল (Revenue Model)

Uber যেভাবে আয় করে, সেভাবেই একাধিক উৎস থেকে আয়:

### ১. 💰 কমিশন (প্রধান আয়)
- প্রতিটা সম্পন্ন কাজ থেকে ১০–২০% (ক্যাটাগরি ও এরিয়া অনুযায়ী Super Admin সেট করবে)।
- **অনলাইন পেমেন্ট হলে:** টাকা প্রথমে প্ল্যাটফর্মে আসবে → কমিশন কেটে বাকিটা ওয়ার্কারের ওয়ালেটে → ওয়ার্কার bKash/Nagad-এ Withdraw করবে।
- **ক্যাশ পেমেন্ট হলে:** ওয়ার্কার পুরো টাকা নেবে → কমিশন ওয়ার্কারের ওয়ালেটে "বাকি (Due)" হিসেবে জমা হবে।

### ২. 🚫 Due লিমিট (Pathao/Uber বাংলাদেশের মতো)
- কমিশন বাকি নির্দিষ্ট সীমা (যেমন ৳৫০০) পার হলে ওয়ার্কার নতুন জব পাবে না যতক্ষণ না bKash/Nagad দিয়ে পরিশোধ করে।
- এতে ক্যাশ পেমেন্টেও কমিশন নিশ্চিত হয়।

### ৩. ⭐ ওয়ার্কার প্রিমিয়াম সাবস্ক্রিপশন
- মাসিক ফি (যেমন ৳২৯৯) → কম কমিশন, ম্যাপে হাইলাইটেড মার্কার, ডিসপ্যাচে অগ্রাধিকার, "Pro" ব্যাজ।

### ৪. 📢 ফিচার্ড লিস্টিং
- ওয়ার্কার নির্দিষ্ট এরিয়ায় সার্চের উপরে থাকতে টাকা দেবে (দৈনিক/সাপ্তাহিক)।

### ৫. 🧾 কাস্টমার প্ল্যাটফর্ম ফি
- প্রতি বুকিংয়ে ছোট সার্ভিস চার্জ (৳১০–৳৩০)।

### ৬. ⚡ সার্জ প্রাইসিং
- চাহিদা বেশি হলে বাড়তি দামের একটা অংশ প্ল্যাটফর্ম পাবে।

### ৭. 🛡️ ভেরিফাইড ব্যাজ / ট্রেনিং ফি
- পুলিশ ক্লিয়ারেন্স/স্কিল টেস্টসহ "Trusted" ব্যাজ, স্কিল ট্রেনিং কোর্স।

### ৮. 🏢 কর্পোরেট/B2B প্ল্যান
- অফিস, অ্যাপার্টমেন্ট সোসাইটি, বাড়িওয়ালাদের জন্য মাসিক মেইনটেন্যান্স প্যাকেজ।

### ৯. 🧰 মালামাল বিক্রি (পরবর্তীতে)
- পার্টনার দোকান থেকে পাইপ, তার, সুইচ ইত্যাদি সরবরাহ করে লাভ।

### আয়ের হিসাব (Transaction ফ্লো)
```
কাস্টমার পেমেন্ট ৳১০০০
   ├─ প্ল্যাটফর্ম ফি          ৳২০   → প্ল্যাটফর্ম
   ├─ কমিশন (১৫% of ৳৯৮০)   ৳১৪৭  → প্ল্যাটফর্ম
   └─ ওয়ার্কারের আয়          ৳৮৩৩  → ওয়ার্কার ওয়ালেট
```
প্রতিটা লেনদেন `transactions` কালেকশনে সেভ হবে — Super Admin ড্যাশবোর্ডে দৈনিক/মাসিক মোট আয়, এরিয়া ও ক্যাটাগরি অনুযায়ী দেখা যাবে।

---

## ১০. রেটিং, রিভিউ ও ব্যান সিস্টেম

### রেটিং
- কাজ শেষে কাস্টমার ১–৫ স্টার + লিখিত রিভিউ + ট্যাগ (যেমন: "সময়মতো এসেছে", "ভদ্র", "কাজ ভালো", "দাম বেশি চেয়েছে")।
- ওয়ার্কারও কাস্টমারকে রেটিং দেবে।
- শুধু **সম্পন্ন জবের** কাস্টমারই রিভিউ দিতে পারবে (ভুয়া রিভিউ প্রতিরোধ)।
- রেটিং গড় হিসাব হবে Cloud Function-এ (ক্লায়েন্ট থেকে নয়)।
- সাম্প্রতিক রিভিউ বেশি ওজন পাবে (শেষ ৫০ কাজের ভিত্তিতে)।

### অটো-ফ্ল্যাগ ও ব্যান নিয়ম (সব সংখ্যা Super Admin পরিবর্তনযোগ্য)

| অবস্থা | অ্যাকশন |
|--------|---------|
| ১০+ কাজের পর গড় রেটিং < ৩.৫ | ⚠️ অটো ওয়ার্নিং নোটিফিকেশন |
| গড় রেটিং < ৩.০ | 🔍 Admin রিভিউ কিউতে যাবে, ডিসপ্যাচে অগ্রাধিকার কমবে |
| গড় রেটিং < ২.৫ | ⏸️ অটো সাময়িক সাসপেন্ড (Admin সিদ্ধান্ত নেবে) |
| ৩০ দিনে ৩টি গুরুতর কমপ্লেইন (চুরি, হয়রানি, দুর্ব্যবহার) | ⏸️ সাথে সাথে সাসপেন্ড + তদন্ত |
| ক্যান্সেলেশন রেট > ২০% | ⏸️ ২৪ ঘণ্টা ব্লক |
| ভুয়া NID / ফেক GPS ধরা পড়লে | 🚫 পার্মানেন্ট ব্যান |
| SOS/নিরাপত্তা ঘটনা প্রমাণিত | 🚫 পার্মানেন্ট ব্যান + প্রয়োজনে আইনি ব্যবস্থা |

### ব্যানের ধাপ
```
ওয়ার্নিং → সাময়িক সাসপেন্ড (১/৭/৩০ দিন) → পার্মানেন্ট ব্যান
```
- **Admin:** ওয়ার্নিং ও সাময়িক সাসপেন্ড দিতে পারবে।
- **Super Admin:** পার্মানেন্ট ব্যান ও আনব্যান করতে পারবে।
- ব্যান হলে ফোন নম্বর + NID + ডিভাইস ID ব্ল্যাকলিস্টে যাবে → নতুন অ্যাকাউন্ট খুলে ফিরতে পারবে না।
- ওয়ার্কার/কাস্টমার **আপিল (Appeal)** করতে পারবে।
- প্রতিটা ব্যান/আনব্যান অ্যাকশন `auditLogs`-এ সেভ হবে (কে, কখন, কেন)।

### Dispute (বিরোধ) সমাধান
- কাস্টমার বা ওয়ার্কার "সমস্যা রিপোর্ট" করবে → ছবি/প্রমাণ সংযুক্ত → Admin দুই পক্ষের তথ্য দেখে সিদ্ধান্ত → রিফান্ড/জরিমানা/ব্যান।

---

## ১১. সিকিউরিটি সিস্টেম

### 🔐 অ্যাকাউন্ট সিকিউরিটি
- ফোন OTP দিয়ে রেজিস্ট্রেশন (Firebase Phone Auth) — এক নম্বরে এক অ্যাকাউন্ট।
- Admin/Super Admin-এর জন্য Email + Password + **2FA (Multi-Factor Auth)** বাধ্যতামূলক।
- রোল **Custom Claims**-এ — শুধু Cloud Function (Super Admin-এর অনুরোধে) রোল দিতে পারবে।
- **Firebase App Check** চালু — শুধু আপনার অ্যাপ থেকেই ডেটাবেস অ্যাক্সেস হবে, বট/স্ক্রিপ্ট ব্লক।

### 🪪 ওয়ার্কার ভেরিফিকেশন (KYC)
1. ফোন OTP
2. NID সামনে ও পেছনের ছবি
3. লাইভ সেলফি (NID-এর ছবির সাথে মিলিয়ে দেখা)
4. ঠিকানা
5. (ঐচ্ছিক/প্রিমিয়াম) পুলিশ ক্লিয়ারেন্স, স্কিল সার্টিফিকেট
6. Admin ম্যানুয়ালি অনুমোদন দেওয়ার পরই ম্যাপে দেখাবে ও জব পাবে
7. NID ছবি **Storage-এ প্রাইভেট** থাকবে, শুধু Admin দেখতে পারবে

### 🧍 কাস্টমার ও ওয়ার্কারের শারীরিক নিরাপত্তা
- **SOS বাটন:** চাপলে Admin প্যানেলে অ্যালার্ট + জরুরি কন্টাক্টকে লোকেশনসহ SMS।
- **লাইভ ট্রিপ শেয়ার:** কাস্টমার পরিবারের কাউকে লিংক পাঠাতে পারবে — কে আসছে, কোথায় আছে।
- **কাজ শুরুর OTP** (সেকশন ৭)।
- **মাস্কড ফোন নম্বর** — বুকিংয়ের আগে পুরো নম্বর দেখাবে না।
- **ইন-অ্যাপ চ্যাট** — নম্বর না দিয়েও কথা বলা যাবে, প্রমাণ হিসেবে সংরক্ষিত।
- **নারী কাস্টমারের অপশন:** চাইলে শুধু নারী ওয়ার্কার/ভেরিফায়েড "Trusted" ওয়ার্কার ফিল্টার।
- কাজ শেষে বা অস্বাভাবিক দীর্ঘ সময় হলে "আপনি নিরাপদ আছেন?" চেক।

### 🧱 টেকনিক্যাল সিকিউরিটি
- কঠোর **Firestore Security Rules** (সেকশন ১৩)।
- সব টাকা-পয়সা, রেটিং, কমিশন হিসাব **শুধু Cloud Functions-এ** — ক্লায়েন্ট কখনো এসব সরাসরি লিখতে পারবে না।
- Rate limiting — একজন কাস্টমার মিনিটে বেশি রিকোয়েস্ট পাঠাতে পারবে না।
- ইনপুট ভ্যালিডেশন (Angular Reactive Forms + Functions দুই জায়গাতেই)।
- ফাইল আপলোডে টাইপ ও সাইজ লিমিট (ছবি সর্বোচ্চ ৫MB, শুধু jpg/png/webp)।
- `auditLogs` — Admin-দের প্রতিটা সংবেদনশীল কাজ রেকর্ড।
- নিয়মিত Firestore ব্যাকআপ (Scheduled Export)।
- HTTPS (Firebase Hosting-এ ডিফল্ট)।

---

## ১২. Firebase ডেটাবেস স্ট্রাকচার

### Firestore কালেকশন

```
📁 users/{uid}
   uid, role: 'superadmin' | 'admin' | 'worker' | 'customer'
   name, phone, email, photoURL
   status: 'active' | 'warned' | 'suspended' | 'banned'
   suspendedUntil, banReason
   areaId, fcmTokens: []
   emergencyContact
   rating, ratingCount          // কাস্টমারের রেটিং (ওয়ার্কার দেয়)
   favoriteWorkers: []
   createdAt, lastLoginAt

📁 workers/{uid}                 // ওয়ার্কারের অতিরিক্ত তথ্য
   uid, name, photoURL, phone (মাস্কড কপি: phoneMasked)
   categoryIds: []
   skills: [], experienceYears, bio
   rate, rateUnit: 'hour' | 'day' | 'job'
   serviceRadiusKm
   homeLocation: { lat, lng, geohash, address }   // বাধ্যতামূলক
   areaId
   isOnline, isBusy
   verificationStatus: 'pending' | 'approved' | 'rejected'
   verified, trustedBadge, isPremium, premiumUntil
   rating, ratingCount, totalJobs, completionRate
   acceptRate, cancelRate
   walletBalance, commissionDue
   portfolio: [imageURL]
   lastJobAt, createdAt

📁 workerPrivate/{uid}           // শুধু Admin ও নিজে দেখবে
   nidNumber, nidFrontURL, nidBackURL, selfieURL
   fullAddress, policeClearanceURL
   bankInfo: { bkash, nagad }

📁 categories/{categoryId}
   nameBn, nameEn, icon, imageURL
   pricingType: 'hour' | 'day' | 'job'
   isActive, order

📁 areas/{areaId}
   division, district, upazila, zoneName
   center: { lat, lng }, radiusKm  অথবা  polygon: [...]
   isActive, surgeMultiplier
   adminIds: []

📁 pricing/{areaId_categoryId}   // এরিয়া × ক্যাটাগরি অনুযায়ী দাম
   areaId, categoryId
   basePrice, minPrice, maxPrice, visitCharge
   commissionRate, platformFee

📁 jobs/{jobId}
   customerId, workerId (null যতক্ষণ না কেউ নেয়)
   categoryId, areaId
   type: 'instant' | 'direct' | 'scheduled' | 'board_fixed' | 'board_bid'
   description, photos: []
   location: { lat, lng, geohash, address }
   scheduledAt
   status: (সেকশন ৭-এর ফ্লো)
   estimatedPrice, finalPrice, materialCost
   commission, platformFee, workerEarning
   paymentMethod: 'cash' | 'bkash' | 'nagad' | 'card'
   paymentStatus: 'unpaid' | 'paid' | 'refunded'
   startOtp (শুধু কাস্টমার দেখবে)
   searchRadiusKm, dispatchRound
   timeline: { createdAt, acceptedAt, arrivedAt, startedAt, completedAt }
   cancelledBy, cancelReason

📁 jobs/{jobId}/offers/{workerId}  // কাকে কাকে রিকোয়েস্ট গেছে
   workerId, sentAt, expiresAt, status: 'sent' | 'accepted' | 'rejected' | 'expired'
   distanceKm, score

📁 jobs/{jobId}/bids/{workerId}    // বিডিং জবের জন্য
   workerId, amount, message, createdAt

📁 jobs/{jobId}/messages/{msgId}   // ইন-অ্যাপ চ্যাট
   senderId, text, imageURL, createdAt

📁 reviews/{reviewId}
   jobId, fromUid, toUid, toRole
   stars, comment, tags: []
   isHidden (Admin লুকাতে পারবে), createdAt

📁 transactions/{txId}
   jobId, workerId, customerId
   type: 'job_payment' | 'commission' | 'withdraw' | 'due_payment' | 'subscription' | 'refund' | 'featured'
   amount, method, status, gatewayRef
   createdAt

📁 reports/{reportId}             // কমপ্লেইন/ডিসপিউট
   jobId, reporterId, againstId
   type: 'behavior' | 'theft' | 'harassment' | 'overcharge' | 'no_show' | 'quality' | 'other'
   severity: 'low' | 'medium' | 'high'
   description, evidence: []
   status: 'open' | 'investigating' | 'resolved' | 'rejected'
   assignedAdmin, resolution

📁 sosAlerts/{alertId}
   uid, jobId, location, createdAt, status, handledBy

📁 notifications/{uid}/items/{id}
   title, body, type, data, read, createdAt

📁 blacklist/{hash}               // ব্যান হওয়া ফোন/NID/ডিভাইস
   type: 'phone' | 'nid' | 'device', reason, bannedAt

📁 auditLogs/{logId}
   actorId, actorRole, action, targetId, before, after, reason, createdAt

📁 settings/platform              // শুধু Super Admin লিখবে
   defaultCommission, dueLimit
   dispatch: { initialRadius, maxRadius, offerTimeoutSec, batchSize, weights }
   ban: { warnRating, suspendRating, minJobsForRating, maxCancelRate }
   showFullPhoneBeforeBooking: false
   supportPhone, maintenanceMode

📁 coupons/{code}
   discountType, value, maxUses, usedCount, validUntil, areaIds
```

### Realtime Database (লাইভ লোকেশন)
```
liveLocations/
   {workerUid}/
      lat, lng, geohash, heading, accuracy
      categoryIds, isBusy
      updatedAt

jobTracking/
   {jobId}/
      workerLat, workerLng, etaMin, updatedAt
```

### প্রয়োজনীয় Firestore Index
- `workers`: `categoryIds (array-contains) + isOnline + verified + geohash`
- `jobs`: `status + categoryId + areaId + createdAt`
- `jobs`: `customerId + createdAt (desc)`, `workerId + createdAt (desc)`
- `reviews`: `toUid + createdAt (desc)`
- `transactions`: `workerId + createdAt`, `type + createdAt`

---

## ১৩. Firebase Security Rules

### Firestore (মূল অংশ)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn()    { return request.auth != null; }
    function role()        { return request.auth.token.role; }
    function isSuper()     { return signedIn() && role() == 'superadmin'; }
    function isAdmin()     { return signedIn() && (role() == 'admin' || role() == 'superadmin'); }
    function isOwner(uid)  { return signedIn() && request.auth.uid == uid; }
    function notBanned()   { return request.auth.token.banned != true; }

    // ইউজার
    match /users/{uid} {
      allow read: if isOwner(uid) || isAdmin();
      allow create: if isOwner(uid) && request.resource.data.role == 'customer';
      allow update: if isAdmin() ||
        (isOwner(uid) && !request.resource.data.diff(resource.data).affectedKeys()
          .hasAny(['role', 'status', 'rating', 'ratingCount', 'banReason']));
      allow delete: if isSuper();
    }

    // ওয়ার্কার পাবলিক প্রোফাইল — লগইন করা সবাই দেখবে
    match /workers/{uid} {
      allow read: if signedIn();
      allow create: if isOwner(uid);
      allow update: if isAdmin() ||
        (isOwner(uid) && notBanned() && !request.resource.data.diff(resource.data).affectedKeys()
          .hasAny(['verified', 'verificationStatus', 'rating', 'ratingCount', 'totalJobs',
                   'walletBalance', 'commissionDue', 'trustedBadge', 'isPremium']));
    }

    // ওয়ার্কারের গোপন তথ্য (NID ইত্যাদি)
    match /workerPrivate/{uid} {
      allow read, write: if isOwner(uid) || isAdmin();
    }

    // জব
    match /jobs/{jobId} {
      allow read: if isAdmin() ||
        (signedIn() && (resource.data.customerId == request.auth.uid ||
                        resource.data.workerId == request.auth.uid)) ||
        (role() == 'worker' && resource.data.status == 'searching');
      allow create: if role() == 'customer' && notBanned()
                    && request.resource.data.customerId == request.auth.uid
                    && request.resource.data.status == 'pending';
      // Accept, দাম, কমিশন — সব Cloud Function করবে
      allow update: if isAdmin();
    }

    // রিভিউ — শুধু Cloud Function লিখবে (জব সম্পন্ন কিনা যাচাই করে)
    match /reviews/{id} {
      allow read: if signedIn();
      allow write: if false;
    }

    // টাকাপয়সা — ক্লায়েন্ট কখনো লিখবে না
    match /transactions/{id} {
      allow read: if isAdmin() || (signedIn() && resource.data.workerId == request.auth.uid);
      allow write: if false;
    }

    match /settings/{doc} {
      allow read: if signedIn();
      allow write: if isSuper();
    }

    match /categories/{id} { allow read: if true;     allow write: if isSuper(); }
    match /areas/{id}      { allow read: if true;     allow write: if isAdmin(); }
    match /pricing/{id}    { allow read: if true;     allow write: if isSuper(); }
    match /auditLogs/{id}  { allow read: if isSuper(); allow write: if false; }
    match /blacklist/{id}  { allow read, write: if isSuper(); }
  }
}
```

### Realtime Database
```json
{
  "rules": {
    "liveLocations": {
      ".read": "auth != null",
      "$uid": {
        ".write": "auth != null && auth.uid === $uid && auth.token.role === 'worker' && auth.token.banned !== true",
        ".validate": "newData.hasChildren(['lat', 'lng', 'geohash', 'updatedAt'])"
      }
    },
    "jobTracking": {
      "$jobId": {
        ".read": "auth != null",
        ".write": "auth != null && auth.token.role === 'worker'"
      }
    }
  }
}
```

### Storage
- `profile/{uid}/*` → নিজে লিখবে, সবাই পড়বে, শুধু ছবি, সর্বোচ্চ ৫MB
- `kyc/{uid}/*` → নিজে লিখবে, শুধু নিজে ও Admin পড়বে
- `jobs/{jobId}/*` → জবের কাস্টমার/ওয়ার্কার লিখবে ও পড়বে

---

## ১৪. Cloud Functions লিস্ট

| Function | ট্রিগার | কাজ |
|----------|---------|------|
| `onUserCreate` | Auth onCreate | ব্ল্যাকলিস্ট চেক, ডিফল্ট রোল `customer` সেট |
| `registerAsWorker` | Callable | ওয়ার্কার প্রোফাইল তৈরি, রোল `worker`, স্ট্যাটাস `pending` |
| `setUserRole` | Callable (শুধু Super Admin) | Admin তৈরি/রোল পরিবর্তন (Custom Claims) |
| `approveWorker` / `rejectWorker` | Callable (Admin) | ভেরিফিকেশন অনুমোদন + নোটিফিকেশন |
| `onJobCreated` | Firestore onCreate | এরিয়া বের করা, দাম হিসাব, ডিসপ্যাচ শুরু |
| `dispatchNextRound` | Cloud Tasks/Scheduler | ৩০ সেকেন্ড পর কেউ না নিলে রেডিয়াস বাড়ানো |
| `acceptJob` | Callable (Worker) | **Transaction** দিয়ে জব লক, বাকি অফার বাতিল |
| `grabBoardJob` / `submitBid` / `chooseBid` | Callable | জব বোর্ড লজিক |
| `updateJobStatus` | Callable | on_the_way → arrived → in_progress (OTP যাচাই) → completed |
| `completeJob` | Callable | চূড়ান্ত বিল, কমিশন হিসাব, transaction তৈরি, ওয়ালেট আপডেট |
| `cancelJob` | Callable | ক্যান্সেলেশন নিয়ম ও ফি প্রয়োগ |
| `submitReview` | Callable | জব যাচাই, রিভিউ সেভ, গড় রেটিং আপডেট, অটো-ফ্ল্যাগ চেক |
| `checkAutoBan` | রিভিউ/রিপোর্টের পর | ব্যান নিয়ম প্রয়োগ (সেকশন ১০) |
| `banUser` / `unbanUser` | Callable (Admin/Super) | স্ট্যাটাস, Custom Claim `banned`, ব্ল্যাকলিস্ট, অডিট লগ |
| `autoOfflineStaleWorkers` | প্রতি ৫ মিনিটে Scheduler | যাদের লোকেশন অনেকক্ষণ আপডেট হয়নি তাদের অফলাইন |
| `liftExpiredSuspensions` | প্রতি ঘণ্টায় Scheduler | সাসপেন্ডের মেয়াদ শেষ হলে অ্যাক্টিভ |
| `paymentWebhook` | HTTPS | bKash/Nagad/SSLCommerz পেমেন্ট কনফার্মেশন |
| `requestWithdraw` | Callable | ওয়ার্কারের টাকা তোলার অনুরোধ |
| `triggerSOS` | Callable | Admin অ্যালার্ট + জরুরি কন্টাক্টে SMS |
| `dailyReport` | প্রতিদিন রাত ১২টায় | দৈনিক আয়, জব, নতুন ইউজারের সারসংক্ষেপ |

---

## ১৫. Angular প্রজেক্ট স্ট্রাকচার

> প্রতিটা কম্পোনেন্ট **Standalone** এবং আলাদা তিনটা ফাইলে: `*.component.html`, `*.component.scss`, `*.component.ts`

### সেটআপ কমান্ড
```bash
ng new kajkhoj --style=scss --routing
cd kajkhoj
npm install primeng @primeng/themes primeicons primeflex
npm install @angular/fire firebase
npm install maplibre-gl geofire-common
```

### ফোল্ডার স্ট্রাকচার
```
src/app/
├── core/
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   ├── role.guard.ts              // data: { roles: ['admin','superadmin'] }
│   │   ├── worker-onboarding.guard.ts // হোম লোকেশন না দিলে আটকে দেবে
│   │   └── not-banned.guard.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── worker.service.ts
│   │   ├── job.service.ts
│   │   ├── dispatch.service.ts       // জব রিকোয়েস্ট শোনা ও Accept
│   │   ├── location.service.ts       // লাইভ লোকেশন
│   │   ├── map.service.ts            // MapLibre হেল্পার
│   │   ├── geo.service.ts            // geohash, দূরত্ব হিসাব
│   │   ├── category.service.ts
│   │   ├── area.service.ts
│   │   ├── pricing.service.ts
│   │   ├── review.service.ts
│   │   ├── payment.service.ts
│   │   ├── report.service.ts
│   │   ├── notification.service.ts   // FCM
│   │   └── settings.service.ts
│   ├── interceptors/
│   │   └── error.interceptor.ts
│   └── models/
│       ├── user.model.ts
│       ├── worker.model.ts
│       ├── job.model.ts
│       ├── category.model.ts
│       ├── area.model.ts
│       ├── review.model.ts
│       └── transaction.model.ts
│
├── shared/
│   ├── components/
│   │   ├── worker-card/              (.html .scss .ts)
│   │   ├── worker-profile-dialog/    (.html .scss .ts)
│   │   ├── rating-stars/
│   │   ├── status-badge/
│   │   ├── map-view/                 // রিইউজেবল ম্যাপ কম্পোনেন্ট
│   │   ├── location-picker/          // পিন বসিয়ে লোকেশন বাছাই
│   │   ├── image-uploader/
│   │   ├── confirm-dialog/
│   │   └── empty-state/
│   ├── pipes/
│   │   ├── bn-number.pipe.ts         // 123 → ১২৩
│   │   ├── taka.pipe.ts              // ৳১,২০০
│   │   ├── mask-phone.pipe.ts
│   │   └── time-ago.pipe.ts          // "৫ মিনিট আগে"
│   └── directives/
│
├── layouts/
│   ├── public-layout/
│   ├── customer-layout/
│   ├── worker-layout/
│   └── admin-layout/                 // সাইডবার + টপবার
│
├── features/
│   ├── auth/
│   │   ├── login/
│   │   ├── otp-verify/
│   │   ├── register-customer/
│   │   └── register-worker/          // মাল্টি-স্টেপ (p-stepper)
│   │       ├── step-basic-info/
│   │       ├── step-skills/
│   │       ├── step-home-location/   // বাধ্যতামূলক
│   │       ├── step-kyc/
│   │       └── step-rate/
│   │
│   ├── customer/
│   │   ├── home-map/                 // মূল ম্যাপ স্ক্রিন
│   │   ├── worker-profile/
│   │   ├── create-job/
│   │   ├── searching-worker/         // "ওয়ার্কার খোঁজা হচ্ছে..." অ্যানিমেশন
│   │   ├── job-tracking/             // লাইভ ট্র্যাকিং
│   │   ├── my-bookings/
│   │   ├── job-detail/
│   │   ├── payment/
│   │   ├── review-worker/
│   │   ├── favorites/
│   │   └── profile/
│   │
│   ├── worker/
│   │   ├── dashboard/                // অনলাইন টগল + আজকের আয়
│   │   ├── incoming-request/         // ৩০ সেকেন্ড টাইমার পপআপ
│   │   ├── job-board/                // ওপেন জব Grab
│   │   ├── active-job/
│   │   ├── job-history/
│   │   ├── earnings/
│   │   ├── wallet/
│   │   ├── reviews/
│   │   ├── edit-profile/
│   │   └── premium/
│   │
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── live-map/
│   │   ├── users/                    // CRUD
│   │   │   ├── user-list/
│   │   │   └── user-form/
│   │   ├── workers/
│   │   │   ├── worker-list/
│   │   │   ├── worker-form/
│   │   │   └── worker-verification/
│   │   ├── jobs/
│   │   ├── reviews/
│   │   ├── reports/
│   │   ├── sos-alerts/
│   │   ├── areas/
│   │   └── transactions/
│   │
│   └── superadmin/
│       ├── dashboard/                // আয়ের পূর্ণ চিত্র
│       ├── admins/                   // Admin CRUD
│       ├── categories/
│       ├── pricing/                  // এরিয়া × ক্যাটাগরি দাম ও কমিশন
│       ├── commission-settings/
│       ├── dispatch-settings/
│       ├── ban-rules/
│       ├── blacklist/
│       ├── coupons/
│       ├── audit-logs/
│       └── platform-settings/
│
├── app.routes.ts
├── app.config.ts
├── app.component.html
├── app.component.scss
└── app.component.ts
```

### রাউটিং উদাহরণ
```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', loadChildren: () => import('./features/auth/auth.routes') },
  {
    path: 'customer', component: CustomerLayoutComponent,
    canActivate: [authGuard, notBannedGuard, roleGuard], data: { roles: ['customer'] },
    loadChildren: () => import('./features/customer/customer.routes')
  },
  {
    path: 'worker', component: WorkerLayoutComponent,
    canActivate: [authGuard, notBannedGuard, roleGuard, workerOnboardingGuard], data: { roles: ['worker'] },
    loadChildren: () => import('./features/worker/worker.routes')
  },
  {
    path: 'admin', component: AdminLayoutComponent,
    canActivate: [authGuard, roleGuard], data: { roles: ['admin', 'superadmin'] },
    loadChildren: () => import('./features/admin/admin.routes')
  },
  {
    path: 'superadmin', component: AdminLayoutComponent,
    canActivate: [authGuard, roleGuard], data: { roles: ['superadmin'] },
    loadChildren: () => import('./features/superadmin/superadmin.routes')
  },
  { path: '**', redirectTo: '' }
];
```

### ব্যবহৃত PrimeNG কম্পোনেন্ট
| কাজ | কম্পোনেন্ট |
|------|-----------|
| CRUD টেবিল (সার্চ, ফিল্টার, পেজিনেশন, এক্সপোর্ট) | `p-table` |
| ফর্ম ডায়ালগ | `p-dialog` |
| ড্রপডাউন | `p-select` / `p-multiselect` |
| রেটিং | `p-rating` |
| নোটিফিকেশন | `p-toast` |
| মুছে ফেলার আগে নিশ্চিতকরণ | `p-confirmdialog` |
| স্ট্যাটাস | `p-tag`, `p-badge` |
| মাল্টি-স্টেপ রেজিস্ট্রেশন | `p-stepper` |
| ফাইল আপলোড | `p-fileupload` |
| চার্ট (আয়, জব) | `p-chart` |
| সাইডবার/মোবাইল মেনু | `p-drawer`, `p-menu`, `p-panelmenu` |
| ওয়ার্কার কার্ড লিস্ট | `p-dataview`, `p-card` |
| অনলাইন টগল | `p-toggleswitch` |
| টাইমার প্রগ্রেস | `p-progressbar`, `p-knob` |
| গ্যালারি | `p-galleria`, `p-image` |
| টাইমলাইন (জব স্ট্যাটাস) | `p-timeline` |

> PrimeNG-এর নতুন ভার্সনে কিছু কম্পোনেন্টের নাম বদলেছে (যেমন Dropdown → Select, Sidebar → Drawer)। ইনস্টল করা ভার্সনের ডকুমেন্টেশন মিলিয়ে নেবেন।

### ডিজাইন গাইডলাইন (টপ লেভেল লুকের জন্য)
- **থিম:** PrimeNG Aura প্রিসেট + নিজস্ব ব্র্যান্ড কালার (যেমন গাঢ় সবুজ `#0f766e` + কমলা অ্যাকসেন্ট `#f97316`)।
- **ফন্ট:** বাংলার জন্য `Hind Siliguri` বা `Noto Sans Bengali` (Google Fonts)।
- **মোবাইল-ফার্স্ট:** কাস্টমার ও ওয়ার্কার অংশ মূলত মোবাইলে চলবে — ম্যাপ ফুল স্ক্রিন, নিচে স্লাইড-আপ বটম শিট (Uber স্টাইল)।
- **ডার্ক মোড** সাপোর্ট।
- **স্কেলিটন লোডার** (`p-skeleton`) — ডেটা লোডের সময় খালি স্ক্রিন নয়।
- বাংলা/ইংরেজি দুই ভাষা (`@ngx-translate/core` বা Angular i18n)।
- সংখ্যা বাংলায় দেখানো (`bn-number` পাইপ)।

### Customer হোম স্ক্রিনের লেআউট (Uber স্টাইল)
```
┌─────────────────────────────┐
│ ☰  📍 সাভার, ঢাকা       🔔  │  ← টপবার
├─────────────────────────────┤
│ [🔧প্লাম্বার][⚡ইলেকট্রিক][🧹..]│  ← ক্যাটাগরি চিপ (স্ক্রলযোগ্য)
│                             │
│        🗺️  ম্যাপ            │
│    🟢👷   ⚪👷              │
│         📍আপনি    🟢👷     │
│   🟠👷                     │
│                       [◎]  │  ← আমার লোকেশন
├─────────────────────────────┤
│ ▔▔▔                         │  ← বটম শিট (টেনে বড় করা যাবে)
│ কাছাকাছি ১২ জন প্লাম্বার      │
│ ┌──┐ রহিম মিয়া ✔️ ⭐৪.৮      │
│ └──┘ ১.২ কিমি • ৳৩০০/কাজ    │
│ [   ⚡ এখনই ডাকুন   ]        │
└─────────────────────────────┘
```

---

## ১৬. Admin ও Super Admin প্যানেল

### 📊 ড্যাশবোর্ড (KPI কার্ড + চার্ট)
- আজকের মোট জব / সম্পন্ন / চলমান / বাতিল
- এই মুহূর্তে অনলাইন ওয়ার্কার
- আজকের, এই সপ্তাহের, এই মাসের প্ল্যাটফর্ম আয় (শুধু Super Admin পুরোটা দেখবে)
- মোট বাকি কমিশন (Due)
- নতুন রেজিস্ট্রেশন, ভেরিফিকেশন পেন্ডিং
- খোলা কমপ্লেইন ও SOS অ্যালার্ট (লাল হাইলাইট)
- চার্ট: দৈনিক জব ট্রেন্ড, ক্যাটাগরি অনুযায়ী আয় (পাই চার্ট), এরিয়া অনুযায়ী জব
- টপ ওয়ার্কার ও সবচেয়ে কম রেটিংয়ের ওয়ার্কার

### 🗺️ লাইভ ম্যাপ
- সব অনলাইন ওয়ার্কার (রঙ অনুযায়ী স্ট্যাটাস)
- চলমান জবগুলো (কাস্টমার ↔ ওয়ার্কার লাইন)
- চাহিদার হিটম্যাপ
- এরিয়া পলিগন আঁকা/এডিট

### 🗂️ সম্পূর্ণ CRUD মডিউল
প্রতিটা মডিউলে: লিস্ট (সার্চ, ফিল্টার, সর্ট, পেজিনেশন, CSV/Excel এক্সপোর্ট) → দেখা → তৈরি → এডিট → ডিলিট/আর্কাইভ

| মডিউল | বিশেষ অ্যাকশন |
|--------|---------------|
| কাস্টমার | ওয়ার্নিং, সাসপেন্ড, ব্যান, বুকিং হিস্ট্রি, রিসেট |
| ওয়ার্কার | ভেরিফাই, ব্যাজ দেওয়া, প্রিমিয়াম চালু, Due মাফ/অ্যাডজাস্ট, ব্যান |
| জব | ম্যানুয়ালি ওয়ার্কার অ্যাসাইন, বাতিল, রিফান্ড |
| রিভিউ | অশালীন রিভিউ লুকানো/মুছে ফেলা |
| কমপ্লেইন | Admin অ্যাসাইন, প্রমাণ দেখা, সমাধান লেখা |
| ক্যাটাগরি (Super) | আইকন, নাম, চালু/বন্ধ, সাজানো |
| এরিয়া | ম্যাপে আঁকা, চালু/বন্ধ, সার্জ |
| প্রাইসিং (Super) | এরিয়া × ক্যাটাগরি ম্যাট্রিক্স এডিট |
| Admin (Super) | তৈরি, এরিয়া অ্যাসাইন, নিষ্ক্রিয়, ব্যান |
| কুপন (Super) | তৈরি, সীমা, মেয়াদ |
| সেটিংস (Super) | কমিশন, Due লিমিট, ডিসপ্যাচ, ব্যান রুল |
| অডিট লগ (Super) | শুধু দেখা, কেউ মুছতে পারবে না |

---

## ১৭. পেমেন্ট সিস্টেম

| পদ্ধতি | বিস্তারিত |
|--------|-----------|
| 💵 ক্যাশ | কাজ শেষে হাতে, কমিশন ওয়ার্কারের Due-তে যাবে |
| 📱 bKash | bKash Payment Gateway (মার্চেন্ট অ্যাকাউন্ট লাগবে) |
| 📱 Nagad | Nagad Payment Gateway |
| 💳 কার্ড ও সব একসাথে | SSLCommerz / aamarPay / ShurjoPay (একটা গেটওয়েতে bKash, Nagad, কার্ড সব) |

- সব পেমেন্ট কনফার্মেশন **Webhook → Cloud Function**-এ যাচাই হবে, ক্লায়েন্টের "পেমেন্ট সফল" কথায় বিশ্বাস নয়।
- ওয়ার্কার Withdraw: সাপ্তাহিক বা ন্যূনতম ৳৫০০ হলে, Admin অনুমোদনের পর bKash/Nagad-এ।
- প্রতিটা পেমেন্টের রসিদ (Invoice) অ্যাপে ও SMS-এ।

> প্রথম ভার্সনে শুধু ক্যাশ + bKash/Nagad-এ Due পরিশোধ দিয়ে শুরু করা সহজ। পরে পুরো অনলাইন পেমেন্ট যোগ করবেন। গেটওয়ের জন্য ট্রেড লাইসেন্স ও মার্চেন্ট অ্যাকাউন্ট প্রয়োজন হয়।

---

## ১৮. নোটিফিকেশন সিস্টেম

| ঘটনা | কে পাবে | মাধ্যম |
|------|--------|--------|
| নতুন জব রিকোয়েস্ট | ওয়ার্কার | পুশ + জোরে সাউন্ড + ফুলস্ক্রিন পপআপ |
| জব Accept হয়েছে | কাস্টমার | পুশ + ইন-অ্যাপ |
| ওয়ার্কার রওনা দিয়েছে / পৌঁছেছে | কাস্টমার | পুশ |
| কাজ সম্পন্ন, রিভিউ দিন | দুজনেই | পুশ |
| ভেরিফিকেশন অনুমোদিত/বাতিল | ওয়ার্কার | পুশ + SMS |
| ওয়ার্নিং/সাসপেন্ড/ব্যান | সংশ্লিষ্ট ব্যক্তি | পুশ + SMS |
| Due লিমিটের কাছাকাছি | ওয়ার্কার | পুশ |
| SOS | Admin + জরুরি কন্টাক্ট | প্যানেল অ্যালার্ট + SMS |
| নতুন কমপ্লেইন | Admin | প্যানেল |

- FCM দিয়ে পুশ, SMS-এর জন্য বাংলাদেশি SMS গেটওয়ে (যেমন SSL Wireless, BulkSMSBD ইত্যাদি)।
- ওয়ার্কারের অ্যাপ ব্যাকগ্রাউন্ডে থাকলেও রিকোয়েস্ট যেন মিস না হয় — তাই পরবর্তীতে নেটিভ অ্যাপ (Capacitor) জরুরি।

---

## ১৯. অতিরিক্ত ফিচার সাজেশন

আপনার আইডিয়াকে আরও শক্তিশালী করতে যা যোগ করা যায়:

### 🌟 ইউজার অভিজ্ঞতা
1. **ইন-অ্যাপ চ্যাট + ভয়েস নোট** — অনেক ওয়ার্কার লিখতে স্বচ্ছন্দ নন, ভয়েস নোট খুব কাজে দেবে।
2. **ভয়েস দিয়ে কাজ খোঁজা** — "আমার বাথরুমের পাইপ লিক করছে" বললে অ্যাপ বুঝে প্লাম্বার দেখাবে।
3. **ছবি দেখে ক্যাটাগরি সাজেশন** — নষ্ট জিনিসের ছবি দিলে কোন ধরনের ওয়ার্কার লাগবে বলে দেবে।
4. **প্রিয় ওয়ার্কার ও আবার বুক** — এক ক্লিকে পরিচিত ওয়ার্কারকে আবার ডাকা।
5. **রিকারিং বুকিং** — প্রতি সপ্তাহে ক্লিনার, প্রতি মাসে এসি সার্ভিসিং।
6. **সার্ভিস প্যাকেজ** — "এসি সার্ভিসিং ফুল প্যাকেজ ৳১২০০" এরকম নির্দিষ্ট দামের প্যাকেজ।
7. **ওয়ার্কারের ইংরেজি না জানলেও সমস্যা নেই** — পুরো ওয়ার্কার অ্যাপ বড় আইকন ও বাংলা ভয়েস গাইডসহ।

### 🛡️ আস্থা ও মান
8. **কাজের ওয়ারেন্টি** — ৭ দিনের মধ্যে একই সমস্যা হলে ফ্রি পুনরায় ঠিক করা।
9. **স্কিল টেস্ট** — অ্যাপের ভেতর ছোট কুইজ/ভিডিও টেস্ট দিয়ে স্কিল লেভেল (Beginner/Expert)।
10. **আগে-পরের ছবি** — প্রতিটা কাজের, যা পোর্টফোলিওতে জমা হবে।
11. **ইন্স্যুরেন্স** (দীর্ঘমেয়াদে) — কাজের সময় দুর্ঘটনা বা ক্ষতির জন্য।

### 💼 ওয়ার্কারের জন্য
12. **রেফারেল বোনাস** — নতুন ওয়ার্কার/কাস্টমার আনলে বোনাস।
13. **দৈনিক টার্গেট বোনাস** — "আজ ৫টা কাজ করলে ৳১০০ বোনাস" (Uber-এর Quest-এর মতো)।
14. **আয়ের সার্টিফিকেট** — লোন বা ভিসার জন্য আয়ের প্রমাণপত্র।
15. **টিম/এজেন্সি অ্যাকাউন্ট** — একজন ঠিকাদার তার দলের ৫ জন মিস্ত্রিকে ম্যানেজ করবে।

### 🏢 ব্যবসা
16. **কর্পোরেট অ্যাকাউন্ট** — অফিস/ফ্যাক্টরির জন্য মাসিক বিল (সাভার-আশুলিয়ায় অনেক ফ্যাক্টরি — বড় সুযোগ!)।
17. **দিনমজুরের বাল্ক বুকিং** — "আগামীকাল ১০ জন শ্রমিক লাগবে" একসাথে বুক।
18. **ইমার্জেন্সি সার্ভিস** — ২৪/৭ বাড়তি চার্জে (রাতে পাইপ ফাটলে)।
19. **জরুরি মেরামতের জন্য "Express" অপশন** — বেশি দাম, ১৫ মিনিটে পৌঁছানোর চেষ্টা।

### 📈 Admin-এর জন্য
20. **চাহিদা পূর্বাভাস** — কোন এলাকায় কোন সময় কোন সার্ভিসের চাহিদা বেশি।
21. **ওয়ার্কার রিক্রুটমেন্ট অ্যালার্ট** — "আশুলিয়ায় ইলেকট্রিশিয়ানের ঘাটতি"।
22. **ফ্রড ডিটেকশন** — একই ওয়ার্কার-কাস্টমার জোড়া বারবার বাতিল করে বাইরে কাজ করছে কিনা (প্ল্যাটফর্ম বাইপাস)।

---

## ২০. ডেভেলপমেন্ট রোডম্যাপ

### 🚀 ফেজ ১ — MVP (৬–৮ সপ্তাহ)
- [ ] Angular + PrimeNG + Firebase সেটআপ, থিম, বাংলা ফন্ট
- [ ] Auth (ফোন OTP), রোল (Custom Claims), Guards
- [ ] কাস্টমার ও ওয়ার্কার রেজিস্ট্রেশন (হোম লোকেশনসহ)
- [ ] MapLibre + OpenFreeMap ম্যাপ, ছবিসহ মার্কার, পপআপ, প্রোফাইল
- [ ] অনলাইন/অফলাইন ও লাইভ লোকেশন
- [ ] ক্যাটাগরি ও বেসিক প্রাইসিং
- [ ] Direct Booking + Instant Request (ডিসপ্যাচ)
- [ ] জব স্ট্যাটাস ফ্লো + OTP
- [ ] রেটিং ও রিভিউ
- [ ] ক্যাশ পেমেন্ট + কমিশন Due
- [ ] Admin: ওয়ার্কার ভেরিফিকেশন, ইউজার/ওয়ার্কার CRUD, ব্যান
- [ ] Super Admin: Admin তৈরি, ক্যাটাগরি, কমিশন সেটিং
- [ ] Security Rules
- [ ] একটা এলাকায় (যেমন সাভার) পাইলট লঞ্চ

### 📦 ফেজ ২ — গ্রোথ (৪–৬ সপ্তাহ)
- [ ] জব বোর্ড + বিডিং
- [ ] এরিয়া সিস্টেম (পলিগন, এরিয়া Admin, এরিয়া-ভিত্তিক দাম)
- [ ] bKash/Nagad অনলাইন পেমেন্ট, ওয়ালেট, Withdraw
- [ ] ইন-অ্যাপ চ্যাট
- [ ] অটো-ব্যান রুল, কমপ্লেইন/ডিসপিউট সিস্টেম
- [ ] SOS ও লাইভ ট্রিপ শেয়ার
- [ ] Admin অ্যানালিটিক্স ড্যাশবোর্ড ও লাইভ ম্যাপ
- [ ] PWA (হোম স্ক্রিনে ইনস্টল)

### 🏆 ফেজ ৩ — স্কেল (চলমান)
- [ ] Capacitor দিয়ে Android অ্যাপ (ব্যাকগ্রাউন্ড লোকেশন ও নোটিফিকেশনের জন্য জরুরি)
- [ ] প্রিমিয়াম সাবস্ক্রিপশন, ফিচার্ড লিস্টিং
- [ ] সার্জ প্রাইসিং, কুপন, রেফারেল
- [ ] কর্পোরেট অ্যাকাউন্ট, বাল্ক বুকিং
- [ ] ভয়েস সার্চ, স্কিল টেস্ট, ওয়ারেন্টি
- [ ] নতুন শহরে সম্প্রসারণ

---

## ✅ শেষ কথা

আপনার আইডিয়ার শক্তি হলো — বাংলাদেশে প্লাম্বার, ইলেকট্রিশিয়ান বা দিনমজুর খুঁজতে এখনো মানুষ পরিচিতজনের নম্বর বা দোকানের উপর নির্ভর করে। দাম নিয়ে অনিশ্চয়তা আর নিরাপত্তা নিয়ে ভয় — এই দুইটা সমস্যা সমাধান করতে পারলেই প্ল্যাটফর্ম সফল হবে। তাই সবচেয়ে বেশি মনোযোগ দিন:

1. **ভেরিফিকেশন ও নিরাপত্তা** → কাস্টমারের আস্থা
2. **স্বচ্ছ দাম** → দরকষাকষির ঝামেলা দূর
3. **দ্রুত ডিসপ্যাচ** → Uber-এর মতো "এখনই পাওয়া যায়" অনুভূতি
4. **ওয়ার্কারের আয় নিশ্চিত** → ভালো ওয়ার্কার প্ল্যাটফর্মে থাকবে

প্রথমে একটা ছোট এলাকায় (যেমন সাভার) ৩–৪টি ক্যাটাগরি দিয়ে শুরু করুন, সেখানে সফল হলে বাকি এলাকায় ছড়িয়ে দিন। 🚀
