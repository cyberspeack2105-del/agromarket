"use client";

import { useEffect, useRef, useState } from "react";

type Lang = "ta" | "ml" | "en";
type SoilMsg = { sender: "user" | "ai"; text: string };

const KERALA_LABS = [
  { id: 1,  name: "State Soil Testing Laboratory",   district: "Thiruvananthapuram", address: "Vellayambalam, TVM - 695033",    phone: "0471-2738005", type: "State"    },
  { id: 2,  name: "Regional Soil Testing Lab",        district: "Ernakulam",          address: "Kalamassery, EKM - 683104",      phone: "0484-2540415", type: "Regional" },
  { id: 3,  name: "Soil Testing Laboratory",          district: "Thrissur",           address: "Peringavu, Thrissur - 680004",   phone: "0487-2360540", type: "District" },
  { id: 4,  name: "Soil Testing Laboratory",          district: "Kozhikode",          address: "Chevayur, Kozhikode - 673017",   phone: "0495-2380225", type: "District" },
  { id: 5,  name: "Soil Testing Laboratory",          district: "Palakkad",           address: "Kalmandapam, PKD - 678001",      phone: "0491-2505510", type: "District" },
  { id: 6,  name: "Soil Testing Laboratory",          district: "Malappuram",         address: "Manjeri, Malappuram - 676121",   phone: "0483-2762540", type: "District" },
  { id: 7,  name: "Soil Testing Laboratory",          district: "Kannur",             address: "Thana, Kannur - 670001",         phone: "0497-2706540", type: "District" },
  { id: 8,  name: "Soil Testing Laboratory",          district: "Kasaragod",          address: "Vidyanagar, KSD - 671123",       phone: "0499-4255540", type: "District" },
  { id: 9,  name: "Soil Testing Laboratory",          district: "Kollam",             address: "Polayathode, Kollam - 691010",   phone: "0474-2742540", type: "District" },
  { id: 10, name: "Soil Testing Laboratory",          district: "Pathanamthitta",     address: "Pathanamthitta - 689645",        phone: "0468-2222540", type: "District" },
  { id: 11, name: "Soil Testing Laboratory",          district: "Alappuzha",          address: "Alappuzha - 688001",             phone: "0477-2252540", type: "District" },
  { id: 12, name: "Soil Testing Laboratory",          district: "Kottayam",           address: "Kottayam - 686001",              phone: "0481-2562540", type: "District" },
  { id: 13, name: "Soil Testing Laboratory",          district: "Idukki",             address: "Painavu, Idukki - 685603",       phone: "04862-232540", type: "District" },
  { id: 14, name: "Soil Testing Laboratory",          district: "Wayanad",            address: "Kalpetta, Wayanad - 673121",     phone: "04936-202540", type: "District" },
];

const SOIL_TYPES = [
  { id:"laterite", icon:"🟫", ph:"5.0–6.5", color:"bg-orange-50 border-orange-300",
    name:  { en:"Laterite Soil",       ta:"லேட்டரைட் மண்",      ml:"ലാറ്ററൈറ്റ് മണ്ണ്" },
    crops: { en:"Coconut, Rubber, Cashew, Pepper", ta:"தேங்காய், ரப்பர், முந்திரி, மிளகு", ml:"തേങ്ങ, റബ്ബർ, കശുവണ്ടി, കുരുമുളക്" },
    desc:  { en:"Most common in Kerala. Acidic, iron-rich, well-drained.", ta:"கேரளாவில் மிகவும் பொதுவானது. அமிலத்தன்மை, இரும்பு நிறைந்தது.", ml:"കേരളത്തിൽ ഏറ്റവും സാധാരണം. അമ്ലം, ഇരുമ്പ് സമ്പന്നം." },
    tips:  { en:"Apply lime to raise pH. Add compost. Avoid waterlogging.", ta:"pH அதிகரிக்க சுண்ணாம்பு சேர்க்கவும். உரம் சேர்க்கவும்.", ml:"pH ഉയർത്താൻ ചുണ്ണാമ്പ് ചേർക്കുക. കമ്പോസ്റ്റ് ഉപയോഗിക്കുക." } },
  { id:"alluvial", icon:"🟡", ph:"6.5–7.5", color:"bg-yellow-50 border-yellow-300",
    name:  { en:"Alluvial Soil",        ta:"வண்டல் மண்",          ml:"എക്കൽ മണ്ണ്" },
    crops: { en:"Rice, Banana, Vegetables", ta:"நெல், வாழை, காய்கறிகள்", ml:"നെല്ല്, വാഴ, പച്ചക്കറി" },
    desc:  { en:"Found in river valleys. Fertile, moisture-retaining, ideal for paddy.", ta:"ஆற்றுப் பள்ளத்தாக்குகளில் காணப்படுகிறது. வளமான மண்.", ml:"നദീതടങ്ങളിൽ. ഫലഭൂയിഷ്ഠം, ഈർപ്പം നിലനിർത്തുന്നു." },
    tips:  { en:"Maintain drainage. Rotate crops. Add potassium for banana.", ta:"வடிகால் பராமரிக்கவும். பயிர் சுழற்சி செய்யவும்.", ml:"ഡ്രെയിനേജ് നിലനിർത്തുക. വിള ഭ്രമണം ചെയ്യുക." } },
  { id:"forest", icon:"🟢", ph:"4.5–6.0", color:"bg-green-50 border-green-300",
    name:  { en:"Forest / Hill Soil",   ta:"காட்டு / மலை மண்",   ml:"വനം / കുന്നൻ മണ്ണ്" },
    crops: { en:"Tea, Coffee, Cardamom, Ginger", ta:"தேயிலை, காபி, ஏலக்காய், இஞ்சி", ml:"ചായ, കാപ്പി, ഏലം, ഇഞ്ചി" },
    desc:  { en:"Found in Wayanad, Idukki hills. Rich in humus, acidic.", ta:"வயநாடு, இடுக்கி மலைகளில். ஹ்யூமஸ் நிறைந்தது.", ml:"വയനാട്, ഇടുക്കി കുന്നുകളിൽ. ഹ്യൂമസ് സമ്പന്നം." },
    tips:  { en:"Avoid over-tilling. Use mulching. Maintain shade cover.", ta:"அதிகமாக உழவு செய்யாதீர்கள். மல்ச்சிங் பயன்படுத்தவும்.", ml:"അമിതമായി ഉഴുതുമറിക്കരുത്. മൾച്ചിംഗ് ഉപയോഗിക്കുക." } },
  { id:"coastal", icon:"🔵", ph:"6.0–7.0", color:"bg-blue-50 border-blue-200",
    name:  { en:"Coastal Sandy Soil",   ta:"கடலோர மணல் மண்",     ml:"തീരദേശ മണൽ മണ്ണ്" },
    crops: { en:"Coconut, Cashew, Groundnut", ta:"தேங்காய், முந்திரி, நிலக்கடலை", ml:"തേങ്ങ, കശുവണ്ടി, നിലക്കടല" },
    desc:  { en:"Found along Kerala coast. Sandy, low nutrients, fast-draining.", ta:"கேரளா கடற்கரையோரம். மணல் நிறைந்தது, குறைந்த ஊட்டச்சத்து.", ml:"കേരള തീരത്ത്. മണൽ, കുറഞ്ഞ പോഷകം." },
    tips:  { en:"Add heavy compost. Use drip irrigation. Plant windbreaks.", ta:"அதிக உரம் சேர்க்கவும். சொட்டு நீர்ப்பாசனம் பயன்படுத்தவும்.", ml:"ധാരാളം കമ്പോസ്റ്റ് ചേർക്കുക. ഡ്രിപ്പ് ഇറിഗേഷൻ ഉപയോഗിക്കുക." } },
  { id:"black", icon:"⚫", ph:"7.0–8.5", color:"bg-gray-100 border-gray-400",
    name:  { en:"Black Cotton Soil",    ta:"கருப்பு மண்",          ml:"കറുത്ത മണ്ണ്" },
    crops: { en:"Cotton, Sorghum, Pulses", ta:"பருத்தி, சோளம், பருப்பு வகைகள்", ml:"പരുത്തി, ജോവർ, പയർ" },
    desc:  { en:"Rare in Kerala, found in Palakkad. Alkaline, clay-heavy.", ta:"கேரளாவில் அரிதாக காணப்படுகிறது. காரத்தன்மை, களிமண்.", ml:"കേരളത്തിൽ അപൂർവം, പാലക്കാട്ടിൽ. ക്ഷാരം, കളിമണ്ണ്." },
    tips:  { en:"Improve drainage. Add gypsum to reduce alkalinity.", ta:"வடிகால் மேம்படுத்தவும். காரத்தன்மை குறைக்க ஜிப்சம் சேர்க்கவும்.", ml:"ഡ്രെയിനേജ് മെച്ചപ്പെടുത്തുക. ജിപ്സം ചേർക്കുക." } },
  { id:"red", icon:"🔴", ph:"5.5–7.0", color:"bg-red-50 border-red-300",
    name:  { en:"Red Loamy Soil",       ta:"சிவப்பு மண்",          ml:"ചുവന്ന മണ്ണ്" },
    crops: { en:"Groundnut, Millets, Vegetables", ta:"நிலக்கடலை, சிறுதானியங்கள், காய்கறிகள்", ml:"നിലക്കടല, ചെറുധാന്യം, പച്ചക്കറി" },
    desc:  { en:"Found in Palakkad and Thrissur. Iron-rich, porous, moderate fertility.", ta:"பாலக்காடு, திருச்சூரில். இரும்பு நிறைந்தது.", ml:"പാലക്കാട്, തൃശ്ശൂരിൽ. ഇരുമ്പ് സമ്പന്നം." },
    tips:  { en:"Add organic matter. Mulch to retain moisture. Use balanced NPK.", ta:"கரிம பொருட்கள் சேர்க்கவும். மல்ச்சிங் செய்யவும்.", ml:"ജൈവ വസ്തുക്കൾ ചേർക്കുക. മൾച്ചിംഗ് ഉപയോഗിക്കുക." } },
];

const COLLECTION_METHODS = [
  { id:"surface", icon:"layers",
    title: { en:"Surface Soil (0–15 cm)", ta:"மேற்பரப்பு மண் (0–15 செ.மீ)", ml:"ഉപരിതല മണ്ണ് (0–15 സെ.മീ)" },
    desc:  { en:"Best for annual crops and vegetables.", ta:"ஆண்டு பயிர்களுக்கு சிறந்தது.", ml:"വാർഷിക വിളകൾക്ക് അനുയോജ്യം." },
    steps: {
      en: ["Clear surface debris","Dig 15 cm deep","Collect 500g sample","Mix 5 spots per acre","Air dry before sending"],
      ta: ["மேற்பரப்பு குப்பைகளை அகற்றவும்","15 செ.மீ ஆழம் தோண்டவும்","500 கிராம் மாதிரி சேகரிக்கவும்","ஒரு ஏக்கருக்கு 5 இடங்களில் கலக்கவும்","அனுப்பும் முன் காற்றில் உலர்த்தவும்"],
      ml: ["ഉപരിതല അവശിഷ്ടങ്ങൾ നീക്കുക","15 സെ.മീ ആഴം കുഴിക്കുക","500 ഗ്രാം സാമ്പിൾ ശേഖരിക്കുക","ഒരു ഏക്കറിൽ 5 സ്ഥലങ്ങൾ മിക്സ് ചെയ്യുക","അയക്കുന്നതിന് മുൻപ് ഉണക്കുക"],
    },
  },
  { id:"deep", icon:"vertical_align_bottom",
    title: { en:"Deep Soil (15–30 cm)", ta:"ஆழமான மண் (15–30 செ.மீ)", ml:"ആഴത്തിലുള്ള മണ്ണ് (15–30 സെ.മീ)" },
    desc:  { en:"Best for perennial crops like coconut and rubber.", ta:"தேங்காய், ரப்பர் போன்ற நீண்டகால பயிர்களுக்கு.", ml:"തേങ്ങ, റബ്ബർ പോലുള്ള ദീർഘകാല വിളകൾക്ക്." },
    steps: {
      en: ["Use soil auger or spade","Dig 30 cm deep","Collect sub-soil sample","Label depth clearly","Keep separate from surface sample"],
      ta: ["மண் ஆகர் அல்லது மண்வெட்டி பயன்படுத்தவும்","30 செ.மீ ஆழம் தோண்டவும்","துணை மண் மாதிரி சேகரிக்கவும்","ஆழத்தை தெளிவாக குறிக்கவும்","மேற்பரப்பு மாதிரியிலிருந்து தனியாக வைக்கவும்"],
      ml: ["ഓഗർ അല്ലെങ്കിൽ കൊട്ടാരം ഉപയോഗിക്കുക","30 സെ.മീ ആഴം കുഴിക്കുക","ഉപ-മണ്ണ് സാമ്പിൾ ശേഖരിക്കുക","ആഴം വ്യക്തമായി ലേബൽ ചെയ്യുക","ഉപരിതല സാമ്പിളിൽ നിന്ന് വേർതിരിക്കുക"],
    },
  },
];

const LANG_LABELS: Record<Lang, string> = { en:"English", ta:"தமிழ்", ml:"മലയാളം" };

const WELCOME_MSG: Record<Lang, string> = {
  en: "Hello! I am NexGro Soil AI 🌱 Ask me anything about soil types, pH, fertilizers, or crop suitability.",
  ta: "வணக்கம்! நான் NexGro மண் AI 🌱 மண் வகைகள், pH, உரங்கள் அல்லது பயிர் பொருத்தம் பற்றி கேளுங்கள்.",
  ml: "നമസ്കാരം! ഞാൻ NexGro Soil AI 🌱 മണ്ണ് തരങ്ങൾ, pH, വളങ്ങൾ, വിള അനുയോജ്യത എന്നിവ ചോദിക്കൂ.",
};

/* ══════════════════════════════════════════
   MAIN SECTION COMPONENT
══════════════════════════════════════════ */
export default function SoilTestSection() {
  const [tab, setTab] = useState<"labs"|"soils"|"collection">("labs");
  const [lang, setLang] = useState<Lang>("en");
  const [selectedSoil, setSelectedSoil] = useState<typeof SOIL_TYPES[0]|null>(null);
  const [selectedMethod, setSelectedMethod] = useState<typeof COLLECTION_METHODS[0]|null>(null);
  const [districtFilter, setDistrictFilter] = useState("");

  const filteredLabs = KERALA_LABS.filter(
    (l) => !districtFilter || l.district.toLowerCase().includes(districtFilter.toLowerCase())
  );

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {lang==="ta" ? "கேரளா மண் சோதனை மையங்கள்" : lang==="ml" ? "കേരള മണ്ണ് പരിശോധനാ കേന്ദ്രങ്ങൾ" : "Kerala Soil Testing Centers"}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {lang==="ta" ? "ஆய்வகங்கள், மண் வகைகள் மற்றும் AI ஆலோசனை" : lang==="ml" ? "ലാബുകൾ, മണ്ണ് തരങ്ങൾ, AI ഉപദേശം" : "Labs, soil types & AI advice in your language"}
          </p>
        </div>
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
          {(["en","ta","ml"] as Lang[]).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${lang===l ? "bg-green-700 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}>
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
        {([
          { id:"labs",       icon:"location_on",           label:{ en:"Testing Labs",  ta:"சோதனை ஆய்வகங்கள்", ml:"ടെസ്റ്റിംഗ് ലാബ്" } },
          { id:"soils",      icon:"layers",                label:{ en:"Soil Types",    ta:"மண் வகைகள்",        ml:"മണ്ണ് തരങ്ങൾ" } },
          { id:"collection", icon:"vertical_align_bottom", label:{ en:"Collection",    ta:"சேகரிப்பு",         ml:"ശേഖരണം" } },
        ] as const).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${tab===t.id ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <span className="material-symbols-outlined text-sm">{t.icon}</span>
            <span className="hidden sm:inline">{t.label[lang]}</span>
          </button>
        ))}
      </div>

      {/* ── Labs Tab ── */}
      {tab==="labs" && (
        <div className="space-y-4">
          <input value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)}
            placeholder={lang==="ta" ? "மாவட்டம் தேடுங்கள்..." : lang==="ml" ? "ജില്ല തിരയുക..." : "Filter by district..."}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 shadow-sm" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredLabs.map((lab) => (
              <div key={lab.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-green-300 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`badge text-[10px] mb-1.5 ${lab.type==="State" ? "badge-green" : lab.type==="Regional" ? "badge-blue" : "badge-gray"}`}>{lab.type}</span>
                    <h3 className="text-sm font-bold text-gray-900">{lab.name}</h3>
                    <p className="mt-0.5 text-xs font-semibold text-green-700">{lab.district}</p>
                  </div>
                  <span className="material-symbols-outlined text-2xl text-green-200" style={{ fontVariationSettings:"'FILL' 1" }}>science</span>
                </div>
                <p className="mt-2 text-xs text-gray-500 flex items-start gap-1">
                  <span className="material-symbols-outlined text-xs mt-0.5 shrink-0">location_on</span>{lab.address}
                </p>
                <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs shrink-0">phone</span>{lab.phone}
                </p>
                <a href={`tel:${lab.phone}`}
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-green-700 py-2 text-xs font-bold text-white hover:bg-green-800 transition-colors">
                  <span className="material-symbols-outlined text-sm">call</span>
                  {lang==="ta" ? "அழைக்கவும்" : lang==="ml" ? "വിളിക്കുക" : "Call Lab"}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Soils Tab ── */}
      {tab==="soils" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {SOIL_TYPES.map((soil) => (
              <div key={soil.id}
                onClick={() => setSelectedSoil(selectedSoil?.id===soil.id ? null : soil)}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${soil.color} ${selectedSoil?.id===soil.id ? "ring-2 ring-green-600 shadow-md" : ""}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{soil.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{soil.name[lang]}</h3>
                    <span className="text-[10px] font-semibold text-gray-500">pH: {soil.ph}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">{soil.desc[lang]}</p>
                <div className="mt-3 rounded-lg bg-white/70 p-2">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    {lang==="ta" ? "பொருத்தமான பயிர்கள்" : lang==="ml" ? "അനുയോജ്യ വിളകൾ" : "Suitable Crops"}
                  </p>
                  <p className="text-xs text-green-800 font-medium">{soil.crops[lang]}</p>
                </div>
                <button className="mt-3 w-full rounded-lg bg-green-700 py-1.5 text-xs font-bold text-white hover:bg-green-800 transition-colors flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-sm">smart_toy</span>
                  {lang==="ta" ? "AI-யிடம் கேளுங்கள்" : lang==="ml" ? "AI-യോട് ചോദിക്കുക" : "Ask AI About This Soil"}
                </button>
              </div>
            ))}
          </div>
          {selectedSoil && <SoilAIChat soil={selectedSoil} lang={lang} />}
        </div>
      )}

      {/* ── Collection Tab ── */}
      {tab==="collection" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {COLLECTION_METHODS.map((method) => (
              <div key={method.id}
                onClick={() => setSelectedMethod(selectedMethod?.id===method.id ? null : method)}
                className={`cursor-pointer rounded-xl border-2 border-gray-200 bg-white p-5 transition-all hover:border-green-400 hover:shadow-md ${selectedMethod?.id===method.id ? "border-green-600 ring-2 ring-green-200 shadow-md" : ""}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                    <span className="material-symbols-outlined text-2xl text-green-700" style={{ fontVariationSettings:"'FILL' 1" }}>{method.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{method.title[lang]}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{method.desc[lang]}</p>
                  </div>
                </div>
                {selectedMethod?.id===method.id && (
                  <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {lang==="ta" ? "படிகள்" : lang==="ml" ? "ഘട്ടങ്ങൾ" : "Steps"}
                    </p>
                    {method.steps[lang].map((step, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-700 text-[10px] font-bold text-white">{i+1}</span>
                        <p className="text-xs text-gray-700">{step}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-base text-yellow-700" style={{ fontVariationSettings:"'FILL' 1" }}>tips_and_updates</span>
              <p className="text-sm font-bold text-yellow-800">
                {lang==="ta" ? "முக்கிய குறிப்புகள்" : lang==="ml" ? "പ്രധാന നുറുങ്ങുകൾ" : "Important Tips"}
              </p>
            </div>
            <ul className="space-y-1 text-xs text-yellow-800">
              {(lang==="ta"
                ? ["மழைக்கு பிறகு உடனே மண் சேகரிக்காதீர்கள்","உரம் இட்ட 30 நாட்களுக்கு பிறகு சேகரிக்கவும்","சுத்தமான பிளாஸ்டிக் பையில் வைக்கவும்","மாதிரியை 48 மணி நேரத்திற்குள் ஆய்வகத்திற்கு அனுப்பவும்"]
                : lang==="ml"
                ? ["മഴ കഴിഞ്ഞ ഉടൻ മണ്ണ് ശേഖരിക്കരുത്","വളം ഇട്ട് 30 ദിവസം കഴിഞ്ഞ് ശേഖരിക്കുക","ശുദ്ധമായ പ്ലാസ്റ്റിക് ബാഗിൽ സൂക്ഷിക്കുക","48 മണിക്കൂറിനുള്ളിൽ ലാബിലേക്ക് അയക്കുക"]
                : ["Do not collect immediately after rain","Collect 30 days after fertilizer application","Store in clean plastic bag","Send to lab within 48 hours"]
              ).map((tip, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-xs mt-0.5 shrink-0 text-yellow-600">check_circle</span>{tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   SOIL AI CHAT SUB-COMPONENT
══════════════════════════════════════════ */
function SoilAIChat({ soil, lang }: { soil: typeof SOIL_TYPES[0]; lang: Lang }) {
  const [messages, setMessages] = useState<SoilMsg[]>([{ sender:"ai", text:WELCOME_MSG[lang] }]);
  const [input, setInput]       = useState("");
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);
  useEffect(() => { setMessages([{ sender:"ai", text:WELCOME_MSG[lang] }]); }, [soil.id, lang]);

  function toggleVoice() {
    if (listening) { setListening(false); return; }
    const SR = (window as unknown as Record<string,unknown>)["SpeechRecognition"] as (new () => { lang: string; interimResults: boolean; onresult: ((e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void }) | undefined
            || (window as unknown as Record<string,unknown>)["webkitSpeechRecognition"] as (new () => { lang: string; interimResults: boolean; onresult: ((e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void }) | undefined;
    if (!SR) { alert("Voice input not supported. Please use Chrome."); return; }
    const recognition = new SR();
    recognition.lang = lang==="ta" ? "ta-IN" : lang==="ml" ? "ml-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.onresult = (event: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => {
      setInput(event.results[0][0].transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend   = () => setListening(false);
    recognition.start();
    setListening(true);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || thinking) return;

    const soilCtx = `Soil: ${soil.name.en}. pH: ${soil.ph}. Crops: ${soil.crops.en}. Desc: ${soil.desc.en}. Tips: ${soil.tips.en}.`;
    const sysHint = lang==="ta"
      ? `நீங்கள் ஒரு மண் நிபுணர். தமிழில் பதில் சொல்லுங்கள். Context: ${soilCtx}`
      : lang==="ml"
      ? `നിങ്ങൾ ഒരു മണ്ണ് വിദഗ്ദ്ധൻ. മലയാളത്തിൽ ഉത്തരം നൽകുക. Context: ${soilCtx}`
      : `You are a soil expert. Answer in English. Context: ${soilCtx}`;

    const updated: SoilMsg[] = [...messages, { sender:"user", text }];
    setMessages(updated);
    setInput("");
    setThinking(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("nexgro_token") : null;
      const res = await fetch("/api/ai/chat", {
        method:"POST",
        headers:{ "Content-Type":"application/json", ...(token ? { Authorization:`Bearer ${token}` } : {}) },
        body: JSON.stringify({ messages:[{ sender:"ai", text:sysHint }, ...updated] }),
      });
      const data = await res.json() as { text?: string };
      setMessages((prev) => [...prev, { sender:"ai", text: data.text ?? "Sorry, could not process that." }]);
    } catch {
      const errMsg = lang==="ta" ? "இணைப்பு பிழை. மீண்டும் முயற்சிக்கவும்." : lang==="ml" ? "കണക്ഷൻ പിശക്. വീണ്ടും ശ്രമിക്കുക." : "Connection error. Please try again.";
      setMessages((prev) => [...prev, { sender:"ai", text:errMsg }]);
    } finally {
      setThinking(false);
    }
  }

  const placeholder = lang==="ta" ? "மண் பற்றி கேளுங்கள்..." : lang==="ml" ? "മണ്ണിനെ കുറിച്ച് ചോദിക്കൂ..." : "Ask about this soil...";
  const quickPrompts = lang==="ta"
    ? ["pH சரிசெய்வது எப்படி?","எந்த உரம் சிறந்தது?","நீர்ப்பாசன குறிப்புகள்"]
    : lang==="ml"
    ? ["pH ശരിയാക്കുന്നത് എങ്ങനെ?","ഏത് വളം നല്ലത്?","ജലസേചന നുറുങ്ങുകൾ"]
    : ["How to fix pH?","Best fertilizer?","Irrigation tips"];

  return (
    <div className="rounded-2xl border border-green-200 bg-white shadow-md overflow-hidden">
      <div className="flex items-center gap-3 border-b border-green-100 bg-green-700 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
          <span className="material-symbols-outlined text-sm text-white" style={{ fontVariationSettings:"'FILL' 1" }}>smart_toy</span>
        </div>
        <div>
          <p className="text-xs font-bold text-white">
            {lang==="ta" ? "மண் AI உதவியாளர்" : lang==="ml" ? "മണ്ണ് AI സഹായി" : "Soil AI Assistant"}
          </p>
          <p className="text-[10px] text-green-200">{soil.name[lang]} · pH {soil.ph}</p>
        </div>
        <span className="ml-auto flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] text-white font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-green-300 animate-pulse" />{LANG_LABELS[lang]}
        </span>
      </div>

      <div className="h-64 overflow-y-auto bg-gray-50 p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.sender==="user" ? "flex-row-reverse" : "flex-row"}`}>
            {msg.sender==="ai" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-700 mt-0.5">
                <span className="material-symbols-outlined text-xs text-white" style={{ fontVariationSettings:"'FILL' 1" }}>eco</span>
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${msg.sender==="user" ? "bg-green-700 text-white rounded-tr-sm" : "bg-white text-gray-800 rounded-tl-sm border border-gray-200 shadow-sm"}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-700">
              <span className="material-symbols-outlined text-xs text-white" style={{ fontVariationSettings:"'FILL' 1" }}>eco</span>
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white px-3 py-2.5 border border-gray-200 shadow-sm">
              {[0,1,2].map((i) => <span key={i} className="h-1.5 w-1.5 rounded-full bg-green-500" style={{ animation:`pulseDot 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-1.5 overflow-x-auto bg-white px-4 py-2 border-t border-gray-100">
        {quickPrompts.map((q) => (
          <button key={q} onClick={() => setInput(q)}
            className="shrink-0 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[10px] font-medium text-green-700 hover:bg-green-100 transition-colors whitespace-nowrap">
            {q}
          </button>
        ))}
      </div>

      <form onSubmit={sendMessage} className="border-t border-gray-100 bg-white p-3">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder}
            className="flex-1 bg-transparent text-xs text-gray-800 placeholder-gray-400 outline-none" disabled={thinking} />
          <button type="button" onClick={toggleVoice}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${listening ? "bg-red-500 text-white animate-pulse" : "bg-gray-200 text-gray-600 hover:bg-green-100 hover:text-green-700"}`}>
            <span className="material-symbols-outlined text-sm">{listening ? "mic_off" : "mic"}</span>
          </button>
          <button type="submit" disabled={!input.trim()||thinking}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-700 text-white transition hover:bg-green-800 disabled:opacity-40">
            <span className="material-symbols-outlined text-sm">send</span>
          </button>
        </div>
        {listening && (
          <p className="mt-1.5 text-center text-[10px] text-red-500 font-medium animate-pulse">
            {lang==="ta" ? "🎤 கேட்கிறது..." : lang==="ml" ? "🎤 ശ്രദ്ധിക്കുന്നു..." : "🎤 Listening..."}
          </p>
        )}
      </form>
    </div>
  );
}
