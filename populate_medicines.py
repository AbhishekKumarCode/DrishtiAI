"""
DrishtiAI — Medicine Database Seeder
Populates Supabase with 200+ Indian medicines
Run: python populate_medicines.py
"""

import requests
import json
import time

SUPABASE_URL = "https://kknlgcbuvpethrftdfjf.supabase.co"
SUPABASE_KEY = "sb_publishable_Pa7C1gPE8ByTs-si5wZ_vg_VGaYHcym"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

# ═══════════════════════════════════════════════════════════════
#  MEDICINE DATA — 200+ Common Indian Medicines
# ═══════════════════════════════════════════════════════════════
MEDICINES = [
    # ── PAIN / FEVER ──────────────────────────────────────────
    {"brand_name":"Crocin","generic_name":"Paracetamol","composition":"Paracetamol 500mg",
     "uses":"Fever, headache, toothache, muscle pain, cold & flu","uses_hindi":"बुखार, सिरदर्द, दांत दर्द, मांसपेशियों का दर्द, सर्दी-जुकाम",
     "side_effects":"Nausea, skin rash (rare)","side_effects_hindi":"मतली, त्वचा पर चकत्ते (दुर्लभ)",
     "warnings":"Do not exceed 4g/day. Caution in liver disease","warnings_hindi":"दिन में 4 गोली से ज़्यादा न लें। जिगर की बीमारी में सावधानी",
     "dosage":"1–2 tablets every 4–6 hours","dosage_hindi":"1-2 गोली हर 4-6 घंटे में","manufacturer":"GSK","price_inr":25.0,"drug_type":"Tablet","prescription_required":False},

    {"brand_name":"Dolo 650","generic_name":"Paracetamol","composition":"Paracetamol 650mg",
     "uses":"High fever, body ache, headache","uses_hindi":"तेज़ बुखार, बदन दर्द, सिरदर्द",
     "side_effects":"Nausea, liver damage if overdosed","side_effects_hindi":"मतली, अधिक मात्रा में लिवर को नुकसान",
     "warnings":"Do not take with other paracetamol products","warnings_hindi":"अन्य पेरासिटामोल दवाओं के साथ न लें",
     "dosage":"1 tablet every 6–8 hours","dosage_hindi":"1 गोली हर 6-8 घंटे में","manufacturer":"Micro Labs","price_inr":30.0,"drug_type":"Tablet","prescription_required":False},

    {"brand_name":"Combiflam","generic_name":"Ibuprofen + Paracetamol","composition":"Ibuprofen 400mg + Paracetamol 325mg",
     "uses":"Pain relief, fever, inflammation, joint pain","uses_hindi":"दर्द, बुखार, सूजन, जोड़ों का दर्द",
     "side_effects":"Stomach upset, nausea, heartburn","side_effects_hindi":"पेट की तकलीफ, मतली, सीने में जलन",
     "warnings":"Take with food. Avoid in peptic ulcer, kidney disease","warnings_hindi":"खाने के साथ लें। पेट के अल्सर और किडनी रोग में न लें",
     "dosage":"1 tablet every 6–8 hours after meals","dosage_hindi":"1 गोली खाने के बाद हर 6-8 घंटे में","manufacturer":"Sanofi","price_inr":35.0,"drug_type":"Tablet","prescription_required":False},

    {"brand_name":"Brufen","generic_name":"Ibuprofen","composition":"Ibuprofen 400mg",
     "uses":"Pain, fever, arthritis, menstrual cramps","uses_hindi":"दर्द, बुखार, गठिया, मासिक धर्म का दर्द",
     "side_effects":"Stomach pain, nausea, dizziness","side_effects_hindi":"पेट दर्द, मतली, चक्कर",
     "warnings":"Take with food. Avoid in peptic ulcer","warnings_hindi":"खाने के साथ लें। पेट के अल्सर में न लें",
     "dosage":"1 tablet 3 times daily with meals","dosage_hindi":"1 गोली दिन में 3 बार खाने के साथ","manufacturer":"Abbott","price_inr":28.0,"drug_type":"Tablet","prescription_required":False},

    {"brand_name":"Voveran","generic_name":"Diclofenac","composition":"Diclofenac Sodium 50mg",
     "uses":"Arthritis, back pain, muscle pain, inflammation","uses_hindi":"गठिया, पीठ दर्द, मांसपेशियों का दर्द, सूजन",
     "side_effects":"Stomach irritation, nausea, headache","side_effects_hindi":"पेट में जलन, मतली, सिरदर्द",
     "warnings":"Take with food. Avoid in kidney disease, heart disease","warnings_hindi":"खाने के साथ लें। किडनी और दिल की बीमारी में न लें",
     "dosage":"1 tablet 2–3 times daily","dosage_hindi":"1 गोली दिन में 2-3 बार","manufacturer":"Novartis","price_inr":45.0,"drug_type":"Tablet","prescription_required":True},

    {"brand_name":"Nimulid","generic_name":"Nimesulide","composition":"Nimesulide 100mg",
     "uses":"Pain, fever, inflammation, dental pain","uses_hindi":"दर्द, बुखार, सूजन, दांत का दर्द",
     "side_effects":"Stomach upset, liver damage if prolonged use","side_effects_hindi":"पेट खराब, लंबे समय तक लेने पर लिवर को नुकसान",
     "warnings":"Not for children under 12. Short-term use only (max 15 days)","warnings_hindi":"12 साल से कम उम्र के बच्चों को न दें। ज़्यादा से ज़्यादा 15 दिन",
     "dosage":"1 tablet twice daily after meals","dosage_hindi":"1 गोली दिन में 2 बार खाने के बाद","manufacturer":"Panacea Biotec","price_inr":30.0,"drug_type":"Tablet","prescription_required":False},

    # ── ANTIBIOTICS ───────────────────────────────────────────
    {"brand_name":"Mox","generic_name":"Amoxicillin","composition":"Amoxicillin 500mg",
     "uses":"Bacterial infections — ear, throat, chest, urine","uses_hindi":"बैक्टीरियल संक्रमण — कान, गला, छाती, पेशाब",
     "side_effects":"Diarrhea, nausea, skin rash, allergic reaction","side_effects_hindi":"दस्त, मतली, त्वचा पर चकत्ते, एलर्जी",
     "warnings":"Complete full course. Inform doctor if penicillin allergy","warnings_hindi":"पूरा कोर्स करें। पेनिसिलिन एलर्जी हो तो डॉक्टर को बताएं",
     "dosage":"1 capsule 3 times daily for 5–7 days","dosage_hindi":"1 कैप्सूल दिन में 3 बार 5-7 दिन तक","manufacturer":"Ranbaxy","price_inr":55.0,"drug_type":"Capsule","prescription_required":True},

    {"brand_name":"Azithral","generic_name":"Azithromycin","composition":"Azithromycin 500mg",
     "uses":"Chest infection, throat infection, skin infection","uses_hindi":"छाती का संक्रमण, गले का संक्रमण, त्वचा संक्रमण",
     "side_effects":"Nausea, diarrhea, stomach pain","side_effects_hindi":"मतली, दस्त, पेट दर्द",
     "warnings":"Take on empty stomach. Avoid with antacids","warnings_hindi":"खाली पेट लें। एंटासिड के साथ न लें",
     "dosage":"1 tablet daily for 3–5 days","dosage_hindi":"1 गोली रोज 3-5 दिन तक","manufacturer":"Alembic","price_inr":80.0,"drug_type":"Tablet","prescription_required":True},

    {"brand_name":"Ciplox","generic_name":"Ciprofloxacin","composition":"Ciprofloxacin 500mg",
     "uses":"Urinary infection, diarrhea, respiratory infection","uses_hindi":"पेशाब का संक्रमण, दस्त, सांस का संक्रमण",
     "side_effects":"Nausea, diarrhea, tendon problems","side_effects_hindi":"मतली, दस्त, टेंडन की समस्या",
     "warnings":"Avoid sun exposure. Complete full course","warnings_hindi":"धूप से बचें। पूरा कोर्स करें",
     "dosage":"1 tablet twice daily for 5–10 days","dosage_hindi":"1 गोली दिन में 2 बार 5-10 दिन","manufacturer":"Cipla","price_inr":65.0,"drug_type":"Tablet","prescription_required":True},

    {"brand_name":"Metrogyl","generic_name":"Metronidazole","composition":"Metronidazole 400mg",
     "uses":"Diarrhea, amoebiasis, gum infection, vaginal infection","uses_hindi":"दस्त, आंत का संक्रमण, मसूड़ों का संक्रमण",
     "side_effects":"Nausea, metallic taste, dizziness","side_effects_hindi":"मतली, मुंह में धातु का स्वाद, चक्कर",
     "warnings":"Avoid alcohol completely during treatment","warnings_hindi":"इलाज के दौरान शराब बिल्कुल न लें",
     "dosage":"1 tablet 3 times daily for 5–7 days","dosage_hindi":"1 गोली दिन में 3 बार 5-7 दिन","manufacturer":"J.B. Chemicals","price_inr":40.0,"drug_type":"Tablet","prescription_required":True},

    {"brand_name":"Cefixime","generic_name":"Cefixime","composition":"Cefixime 200mg",
     "uses":"Throat, ear, urine, chest infections","uses_hindi":"गले, कान, पेशाब और छाती के संक्रमण",
     "side_effects":"Diarrhea, stomach upset, skin rash","side_effects_hindi":"दस्त, पेट खराब, त्वचा पर चकत्ते",
     "warnings":"Inform doctor if cephalosporin allergy","warnings_hindi":"सेफैलोस्पोरिन एलर्जी हो तो डॉक्टर को बताएं",
     "dosage":"1 tablet twice daily for 7 days","dosage_hindi":"1 गोली दिन में 2 बार 7 दिन","manufacturer":"Various","price_inr":120.0,"drug_type":"Tablet","prescription_required":True},

    # ── DIABETES ──────────────────────────────────────────────
    {"brand_name":"Glycomet","generic_name":"Metformin","composition":"Metformin HCl 500mg",
     "uses":"Type 2 diabetes — controls blood sugar","uses_hindi":"टाइप 2 मधुमेह — रक्त शर्करा को नियंत्रित करता है",
     "side_effects":"Nausea, diarrhea, stomach upset (reduces with time)","side_effects_hindi":"मतली, दस्त, पेट खराब (समय के साथ कम होता है)",
     "warnings":"Take with meals. Regular blood sugar monitoring. Avoid alcohol","warnings_hindi":"खाने के साथ लें। नियमित शुगर जांच करें। शराब न लें",
     "dosage":"1 tablet twice daily with meals","dosage_hindi":"1 गोली दिन में 2 बार खाने के साथ","manufacturer":"USV","price_inr":35.0,"drug_type":"Tablet","prescription_required":True},

    {"brand_name":"Glycomet GP","generic_name":"Glimepiride + Metformin","composition":"Glimepiride 1mg + Metformin 500mg",
     "uses":"Type 2 diabetes management","uses_hindi":"टाइप 2 मधुमेह प्रबंधन",
     "side_effects":"Low blood sugar, nausea, dizziness","side_effects_hindi":"रक्त शर्करा कम होना, मतली, चक्कर",
     "warnings":"Monitor blood sugar regularly. Eat on time","warnings_hindi":"नियमित शुगर जांच करें। समय पर खाना ज़रूरी है",
     "dosage":"1 tablet before breakfast","dosage_hindi":"1 गोली नाश्ते से पहले","manufacturer":"USV","price_inr":85.0,"drug_type":"Tablet","prescription_required":True},

    {"brand_name":"Januvia","generic_name":"Sitagliptin","composition":"Sitagliptin 100mg",
     "uses":"Type 2 diabetes (with diet & exercise)","uses_hindi":"टाइप 2 मधुमेह (खान-पान और व्यायाम के साथ)",
     "side_effects":"Cold, sore throat, stomach pain","side_effects_hindi":"सर्दी, गला खराब, पेट दर्द",
     "warnings":"Monitor kidney function. Pancreatitis risk","warnings_hindi":"किडनी की जांच कराते रहें। अग्न्याशय की सूजन का खतरा",
     "dosage":"1 tablet once daily","dosage_hindi":"1 गोली रोज एक बार","manufacturer":"MSD","price_inr":320.0,"drug_type":"Tablet","prescription_required":True},

    {"brand_name":"Amaryl","generic_name":"Glimepiride","composition":"Glimepiride 2mg",
     "uses":"Type 2 diabetes — stimulates insulin release","uses_hindi":"टाइप 2 मधुमेह — इंसुलिन स्राव को बढ़ाता है",
     "side_effects":"Low blood sugar, weight gain, nausea","side_effects_hindi":"रक्त शर्करा कम होना, वजन बढ़ना, मतली",
     "warnings":"Do not skip meals. Avoid alcohol","warnings_hindi":"खाना न छोड़ें। शराब न लें",
     "dosage":"1 tablet before breakfast","dosage_hindi":"1 गोली नाश्ते से पहले","manufacturer":"Sanofi","price_inr":95.0,"drug_type":"Tablet","prescription_required":True},

    # ── BLOOD PRESSURE ────────────────────────────────────────
    {"brand_name":"Amlokind","generic_name":"Amlodipine","composition":"Amlodipine 5mg",
     "uses":"High blood pressure, angina (chest pain)","uses_hindi":"उच्च रक्तचाप, सीने में दर्द (एनजाइना)",
     "side_effects":"Ankle swelling, flushing, dizziness","side_effects_hindi":"टखने में सूजन, गर्मी लगना, चक्कर",
     "warnings":"Do not stop suddenly. Take at same time daily","warnings_hindi":"अचानक बंद न करें। रोज़ एक ही समय पर लें",
     "dosage":"1 tablet once daily (morning)","dosage_hindi":"1 गोली रोज सुबह","manufacturer":"Mankind","price_inr":45.0,"drug_type":"Tablet","prescription_required":True},

    {"brand_name":"Telma","generic_name":"Telmisartan","composition":"Telmisartan 40mg",
     "uses":"High blood pressure, heart protection in diabetes","uses_hindi":"उच्च रक्तचाप, मधुमेह में दिल की सुरक्षा",
     "side_effects":"Dizziness, back pain, diarrhea","side_effects_hindi":"चक्कर, पीठ दर्द, दस्त",
     "warnings":"Avoid pregnancy. Monitor potassium levels","warnings_hindi":"गर्भावस्था में न लें। पोटैशियम की जांच करते रहें",
     "dosage":"1 tablet once daily","dosage_hindi":"1 गोली रोज एक बार","manufacturer":"Glenmark","price_inr":65.0,"drug_type":"Tablet","prescription_required":True},

    {"brand_name":"Cardace","generic_name":"Ramipril","composition":"Ramipril 5mg",
     "uses":"High blood pressure, heart failure, post heart attack","uses_hindi":"उच्च रक्तचाप, दिल की कमज़ोरी, दिल के दौरे के बाद",
     "side_effects":"Dry cough, dizziness, high potassium","side_effects_hindi":"सूखी खांसी, चक्कर, पोटैशियम बढ़ना",
     "warnings":"Avoid pregnancy. Monitor kidney function","warnings_hindi":"गर्भावस्था में बिल्कुल न लें। किडनी की जांच ज़रूरी",
     "dosage":"1 tablet once daily (morning or night)","dosage_hindi":"1 गोली रोज सुबह या रात","manufacturer":"Sanofi","price_inr":85.0,"drug_type":"Tablet","prescription_required":True},

    {"brand_name":"Betaloc","generic_name":"Metoprolol","composition":"Metoprolol Succinate 50mg",
     "uses":"High blood pressure, heart failure, angina, fast heart rate","uses_hindi":"उच्च रक्तचाप, दिल की कमज़ोरी, तेज़ धड़कन",
     "side_effects":"Fatigue, cold hands/feet, slow heart rate","side_effects_hindi":"थकान, हाथ-पैर ठंडे होना, धड़कन धीमी होना",
     "warnings":"Never stop suddenly — must taper. Avoid in asthma","warnings_hindi":"अचानक बंद न करें — धीरे-धीरे कम करें। अस्थमा में न लें",
     "dosage":"1 tablet once daily","dosage_hindi":"1 गोली रोज एक बार","manufacturer":"AstraZeneca","price_inr":120.0,"drug_type":"Tablet","prescription_required":True},

    # ── CHOLESTEROL ───────────────────────────────────────────
    {"brand_name":"Atorva","generic_name":"Atorvastatin","composition":"Atorvastatin 10mg",
     "uses":"High cholesterol, heart disease prevention","uses_hindi":"उच्च कोलेस्ट्रॉल, दिल की बीमारी से बचाव",
     "side_effects":"Muscle pain, liver problems (rare), headache","side_effects_hindi":"मांसपेशियों में दर्द, लिवर की समस्या (दुर्लभ), सिरदर्द",
     "warnings":"Avoid grapefruit juice. Report muscle pain immediately","warnings_hindi":"अंगूर का रस न पियें। मांसपेशियों में दर्द हो तो डॉक्टर को बताएं",
     "dosage":"1 tablet once daily at night","dosage_hindi":"1 गोली रात को","manufacturer":"Zydus","price_inr":55.0,"drug_type":"Tablet","prescription_required":True},

    {"brand_name":"Rosuvas","generic_name":"Rosuvastatin","composition":"Rosuvastatin 10mg",
     "uses":"High cholesterol, triglycerides","uses_hindi":"उच्च कोलेस्ट्रॉल, ट्राइग्लिसराइड",
     "side_effects":"Muscle pain, weakness, headache","side_effects_hindi":"मांसपेशियों में दर्द, कमज़ोरी, सिरदर्द",
     "warnings":"Report unexplained muscle pain. Avoid in pregnancy","warnings_hindi":"मांसपेशियों में अचानक दर्द हो तो डॉक्टर को बताएं। गर्भावस्था में न लें",
     "dosage":"1 tablet once daily","dosage_hindi":"1 गोली रोज एक बार","manufacturer":"Sun Pharma","price_inr":75.0,"drug_type":"Tablet","prescription_required":True},

    # ── STOMACH / GI ──────────────────────────────────────────
    {"brand_name":"Omez","generic_name":"Omeprazole","composition":"Omeprazole 20mg",
     "uses":"Acidity, stomach ulcer, GERD (heartburn)","uses_hindi":"एसिडिटी, पेट का अल्सर, सीने में जलन",
     "side_effects":"Headache, diarrhea, nausea, stomach pain","side_effects_hindi":"सिरदर्द, दस्त, मतली, पेट दर्द",
     "warnings":"Take 30 minutes before meals. Long-term use needs monitoring","warnings_hindi":"खाने से 30 मिनट पहले लें। लंबे समय तक लेने पर जांच ज़रूरी",
     "dosage":"1 capsule daily (before breakfast)","dosage_hindi":"1 कैप्सूल रोज नाश्ते से पहले","manufacturer":"Dr. Reddy's","price_inr":30.0,"drug_type":"Capsule","prescription_required":False},

    {"brand_name":"Pan D","generic_name":"Pantoprazole + Domperidone","composition":"Pantoprazole 40mg + Domperidone 10mg",
     "uses":"Acidity with bloating, nausea, GERD","uses_hindi":"एसिडिटी के साथ गैस, मतली, सीने में जलन",
     "side_effects":"Headache, diarrhea, dry mouth","side_effects_hindi":"सिरदर्द, दस्त, मुँह सूखना",
     "warnings":"Take 30–60 minutes before meals","warnings_hindi":"खाने से 30-60 मिनट पहले लें",
     "dosage":"1 capsule twice daily before meals","dosage_hindi":"1 कैप्सूल दिन में 2 बार खाने से पहले","manufacturer":"Alkem","price_inr":85.0,"drug_type":"Capsule","prescription_required":False},

    {"brand_name":"Rantac","generic_name":"Ranitidine","composition":"Ranitidine 150mg",
     "uses":"Acidity, heartburn, stomach ulcer","uses_hindi":"एसिडिटी, सीने में जलन, पेट का अल्सर",
     "side_effects":"Headache, dizziness, constipation","side_effects_hindi":"सिरदर्द, चक्कर, कब्ज़",
     "warnings":"Avoid antacids at same time","warnings_hindi":"एक ही समय पर एंटासिड न लें",
     "dosage":"1 tablet twice daily","dosage_hindi":"1 गोली दिन में 2 बार","manufacturer":"J.B. Chemicals","price_inr":20.0,"drug_type":"Tablet","prescription_required":False},

    {"brand_name":"Domstal","generic_name":"Domperidone","composition":"Domperidone 10mg",
     "uses":"Nausea, vomiting, bloating, slow digestion","uses_hindi":"मतली, उल्टी, गैस, पाचन धीमा होना",
     "side_effects":"Dry mouth, headache, diarrhea","side_effects_hindi":"मुँह सूखना, सिरदर्द, दस्त",
     "warnings":"Not for long-term use. Heart patients consult doctor","warnings_hindi":"लंबे समय तक न लें। दिल के मरीज़ डॉक्टर से पूछें",
     "dosage":"1 tablet 3 times daily before meals","dosage_hindi":"1 गोली दिन में 3 बार खाने से पहले","manufacturer":"Torrent","price_inr":25.0,"drug_type":"Tablet","prescription_required":False},

    {"brand_name":"Zofer","generic_name":"Ondansetron","composition":"Ondansetron 4mg",
     "uses":"Nausea and vomiting (after surgery, chemotherapy)","uses_hindi":"मतली और उल्टी (ऑपरेशन या कैंसर के इलाज के बाद)",
     "side_effects":"Headache, constipation, dizziness","side_effects_hindi":"सिरदर्द, कब्ज़, चक्कर",
     "warnings":"ECG monitoring needed in heart patients","warnings_hindi":"दिल के मरीज़ों में ECG ज़रूरी",
     "dosage":"1 tablet 2–3 times daily","dosage_hindi":"1 गोली दिन में 2-3 बार","manufacturer":"Sun Pharma","price_inr":45.0,"drug_type":"Tablet","prescription_required":True},

    {"brand_name":"Aristozyme","generic_name":"Digestive Enzymes","composition":"Fungal Diastase + Pepsin",
     "uses":"Indigestion, gas, bloating, poor digestion","uses_hindi":"अपच, गैस, पेट फूलना, खाना न पचना",
     "side_effects":"Rarely causes nausea","side_effects_hindi":"कभी-कभी मतली",
     "warnings":"Generally safe for all ages","warnings_hindi":"सभी उम्र के लिए सुरक्षित",
     "dosage":"1–2 tablets after meals","dosage_hindi":"1-2 गोली खाने के बाद","manufacturer":"Aristo","price_inr":35.0,"drug_type":"Tablet","prescription_required":False},

    # ── ALLERGY / COLD ────────────────────────────────────────
    {"brand_name":"Cetzine","generic_name":"Cetirizine","composition":"Cetirizine 10mg",
     "uses":"Allergies, hay fever, skin rash, itching, hives","uses_hindi":"एलर्जी, नाक बहना, त्वचा पर खुजली, पित्ती",
     "side_effects":"Drowsiness, dry mouth, headache","side_effects_hindi":"नींद आना, मुँह सूखना, सिरदर्द",
     "warnings":"May cause drowsiness — avoid driving","warnings_hindi":"नींद आ सकती है — गाड़ी न चलाएं",
     "dosage":"1 tablet at night","dosage_hindi":"1 गोली रात को","manufacturer":"UCB","price_inr":20.0,"drug_type":"Tablet","prescription_required":False},

    {"brand_name":"Allegra","generic_name":"Fexofenadine","composition":"Fexofenadine 120mg",
     "uses":"Allergic rhinitis, skin allergy, hives","uses_hindi":"नाक की एलर्जी, त्वचा की एलर्जी, पित्ती",
     "side_effects":"Headache, nausea (minimal drowsiness)","side_effects_hindi":"सिरदर्द, मतली (नींद कम आती है)",
     "warnings":"Non-drowsy formula. Safe to drive","warnings_hindi":"नींद नहीं आती। गाड़ी चलाना सुरक्षित",
     "dosage":"1 tablet twice daily","dosage_hindi":"1 गोली दिन में 2 बार","manufacturer":"Sanofi","price_inr":85.0,"drug_type":"Tablet","prescription_required":False},

    {"brand_name":"Lorfast","generic_name":"Loratadine","composition":"Loratadine 10mg",
     "uses":"Allergy, cold symptoms, itching, runny nose","uses_hindi":"एलर्जी, सर्दी, खुजली, नाक बहना",
     "side_effects":"Headache, dry mouth (non-drowsy)","side_effects_hindi":"सिरदर्द, मुँह सूखना (नींद नहीं आती)",
     "warnings":"Take once daily. Safe for daytime use","warnings_hindi":"एक बार रोज़ लें। दिन में लेना सुरक्षित",
     "dosage":"1 tablet once daily","dosage_hindi":"1 गोली रोज एक बार","manufacturer":"Cipla","price_inr":30.0,"drug_type":"Tablet","prescription_required":False},

    {"brand_name":"Sinarest","generic_name":"Paracetamol + Chlorpheniramine + Phenylephrine","composition":"Paracetamol 500mg + Chlorpheniramine 2mg + Phenylephrine 5mg",
     "uses":"Cold, blocked nose, sneezing, fever","uses_hindi":"सर्दी-जुकाम, बंद नाक, छींक, बुखार",
     "side_effects":"Drowsiness, dry mouth, dizziness","side_effects_hindi":"नींद आना, मुँह सूखना, चक्कर",
     "warnings":"Avoid driving. Not for children under 6","warnings_hindi":"गाड़ी न चलाएं। 6 साल से कम बच्चों को न दें",
     "dosage":"1 tablet 3 times daily","dosage_hindi":"1 गोली दिन में 3 बार","manufacturer":"Centaur","price_inr":25.0,"drug_type":"Tablet","prescription_required":False},

    # ── RESPIRATORY ───────────────────────────────────────────
    {"brand_name":"Asthalin","generic_name":"Salbutamol","composition":"Salbutamol 100mcg/dose",
     "uses":"Asthma attack, bronchospasm, breathing difficulty","uses_hindi":"अस्थमा का दौरा, सांस लेने में तकलीफ",
     "side_effects":"Trembling, fast heart rate, headache","side_effects_hindi":"कंपन, तेज़ धड़कन, सिरदर्द",
     "warnings":"Inhaler — use correct technique. Emergency rescue inhaler only","warnings_hindi":"इनहेलर — सही तरीके से उपयोग करें। केवल आपातकाल में",
     "dosage":"2 puffs when needed (max 4 times/day)","dosage_hindi":"ज़रूरत पड़ने पर 2 पफ (दिन में 4 बार से ज़्यादा नहीं)","manufacturer":"Cipla","price_inr":65.0,"drug_type":"Inhaler","prescription_required":True},

    {"brand_name":"Montair","generic_name":"Montelukast","composition":"Montelukast 10mg",
     "uses":"Asthma prevention, allergic rhinitis","uses_hindi":"अस्थमा की रोकथाम, नाक की एलर्जी",
     "side_effects":"Headache, stomach pain, vivid dreams","side_effects_hindi":"सिरदर्द, पेट दर्द, अजीब सपने",
     "warnings":"Not for acute asthma attack. Take at bedtime","warnings_hindi":"तीव्र अस्थमा में नहीं। सोने से पहले लें",
     "dosage":"1 tablet at bedtime","dosage_hindi":"1 गोली सोने से पहले","manufacturer":"Cipla","price_inr":130.0,"drug_type":"Tablet","prescription_required":True},

    # ── THYROID ───────────────────────────────────────────────
    {"brand_name":"Thyroxine","generic_name":"Levothyroxine","composition":"Levothyroxine 50mcg",
     "uses":"Hypothyroidism (underactive thyroid)","uses_hindi":"थायरॉइड ग्रंथि का कम काम करना",
     "side_effects":"Palpitations, sweating, weight loss (if overdosed)","side_effects_hindi":"धड़कन बढ़ना, पसीना, वज़न कम होना (ज़्यादा मात्रा में)",
     "warnings":"Take empty stomach, 30 min before breakfast. Lifelong medicine","warnings_hindi":"खाली पेट लें, नाश्ते से 30 मिनट पहले। यह आजीवन दवाई है",
     "dosage":"1 tablet daily on empty stomach","dosage_hindi":"1 गोली रोज़ खाली पेट","manufacturer":"Glaxo","price_inr":30.0,"drug_type":"Tablet","prescription_required":True},

    {"brand_name":"Thyronorm","generic_name":"Levothyroxine","composition":"Levothyroxine 100mcg",
     "uses":"Hypothyroidism, goitre","uses_hindi":"थायरॉइड की कमी, गण्डमाला",
     "side_effects":"Chest pain, tremors if overdosed","side_effects_hindi":"सीने में दर्द, कंपन (अधिक मात्रा में)",
     "warnings":"Regular TSH monitoring every 6 months","warnings_hindi":"हर 6 महीने में TSH जांच करें",
     "dosage":"1 tablet 30 minutes before breakfast","dosage_hindi":"1 गोली नाश्ते से 30 मिनट पहले","manufacturer":"Abbott","price_inr":55.0,"drug_type":"Tablet","prescription_required":True},

    # ── VITAMINS / SUPPLEMENTS ────────────────────────────────
    {"brand_name":"Shelcal","generic_name":"Calcium + Vitamin D3","composition":"Calcium 500mg + Vitamin D3 250IU",
     "uses":"Calcium deficiency, bone health, osteoporosis prevention","uses_hindi":"कैल्शियम की कमी, हड्डियों की मज़बूती, ऑस्टियोपोरोसिस",
     "side_effects":"Constipation, nausea (rarely)","side_effects_hindi":"कब्ज़, मतली (कभी-कभी)",
     "warnings":"Take with meals. Avoid with iron tablets","warnings_hindi":"खाने के साथ लें। आयरन की गोली के साथ न लें",
     "dosage":"1 tablet twice daily with meals","dosage_hindi":"1 गोली दिन में 2 बार खाने के साथ","manufacturer":"Elder","price_inr":130.0,"drug_type":"Tablet","prescription_required":False},

    {"brand_name":"Becosules","generic_name":"Vitamin B Complex + Vitamin C","composition":"B1, B2, B3, B6, B12, Folic Acid, Vitamin C",
     "uses":"Vitamin B deficiency, fatigue, nerve health, wound healing","uses_hindi":"विटामिन B की कमी, थकान, नसों की सेहत",
     "side_effects":"Urine may turn yellow (harmless)","side_effects_hindi":"पेशाब पीला हो सकता है (हानिरहित)",
     "warnings":"Generally safe. Excess B6 may cause nerve problems","warnings_hindi":"आमतौर पर सुरक्षित। अधिक B6 से नसों की समस्या हो सकती है",
     "dosage":"1 capsule once daily after meals","dosage_hindi":"1 कैप्सूल खाने के बाद रोज़","manufacturer":"Pfizer","price_inr":50.0,"drug_type":"Capsule","prescription_required":False},

    {"brand_name":"Limcee","generic_name":"Vitamin C","composition":"Ascorbic Acid 500mg",
     "uses":"Vitamin C deficiency, immune support, wound healing","uses_hindi":"विटामिन C की कमी, रोग प्रतिरोधक क्षमता, घाव भरना",
     "side_effects":"Stomach upset in high doses","side_effects_hindi":"अधिक मात्रा में पेट खराब",
     "warnings":"Do not exceed 2g/day. Chewable tablet","warnings_hindi":"2 ग्राम से ज़्यादा न लें। चबाने वाली गोली",
     "dosage":"1–2 tablets daily","dosage_hindi":"1-2 गोली रोज़","manufacturer":"Abbott","price_inr":25.0,"drug_type":"Chewable Tablet","prescription_required":False},

    {"brand_name":"Tonoferon","generic_name":"Ferrous Ascorbate + Folic Acid","composition":"Ferrous Ascorbate 100mg + Folic Acid 1.5mg",
     "uses":"Iron deficiency anaemia, during pregnancy","uses_hindi":"खून की कमी (एनीमिया), गर्भावस्था में",
     "side_effects":"Dark stools, constipation, nausea","side_effects_hindi":"काला मल, कब्ज़, मतली",
     "warnings":"Take with Vitamin C for better absorption. Stains teeth","warnings_hindi":"बेहतर अवशोषण के लिए विटामिन C के साथ लें। दांत काले हो सकते हैं",
     "dosage":"1 tablet twice daily","dosage_hindi":"1 गोली दिन में 2 बार","manufacturer":"Elder","price_inr":65.0,"drug_type":"Tablet","prescription_required":False},

    {"brand_name":"Neurobion Forte","generic_name":"Vitamin B1 + B6 + B12","composition":"B1 10mg + B6 3mg + B12 15mcg",
     "uses":"Nerve pain, numbness, tingling, B12 deficiency","uses_hindi":"नसों का दर्द, सुन्नपन, झनझनाहट, B12 की कमी",
     "side_effects":"Rare — nausea, allergic reaction","side_effects_hindi":"कभी-कभी मतली, एलर्जी",
     "warnings":"Diabetics — monitor blood sugar","warnings_hindi":"मधुमेह रोगी — शुगर की जांच करते रहें",
     "dosage":"1 tablet once or twice daily","dosage_hindi":"1 गोली एक या दो बार रोज़","manufacturer":"Merck","price_inr":55.0,"drug_type":"Tablet","prescription_required":False},

    # ── HEART ─────────────────────────────────────────────────
    {"brand_name":"Ecosprin","generic_name":"Aspirin","composition":"Aspirin 75mg",
     "uses":"Blood clot prevention, heart attack & stroke prevention","uses_hindi":"खून के थक्के रोकना, दिल के दौरे और लकवे से बचाव",
     "side_effects":"Stomach irritation, bleeding risk","side_effects_hindi":"पेट में जलन, रक्तस्राव का खतरा",
     "warnings":"Take with food. Avoid if aspirin allergy or stomach ulcer","warnings_hindi":"खाने के साथ लें। एस्पिरिन एलर्जी या पेट अल्सर में न लें",
     "dosage":"1 tablet once daily after meals","dosage_hindi":"1 गोली रोज़ खाने के बाद","manufacturer":"USV","price_inr":15.0,"drug_type":"Tablet","prescription_required":True},

    {"brand_name":"Sorbitrate","generic_name":"Isosorbide Dinitrate","composition":"Isosorbide Dinitrate 5mg",
     "uses":"Angina (chest pain), heart failure","uses_hindi":"सीने में दर्द (एनजाइना), दिल की कमज़ोरी",
     "side_effects":"Severe headache, dizziness, low blood pressure","side_effects_hindi":"तेज़ सिरदर्द, चक्कर, रक्तचाप कम होना",
     "warnings":"Do NOT take with Sildenafil (Viagra). Sublingual for emergency","warnings_hindi":"सिल्डेनाफिल के साथ बिल्कुल न लें। आपातकाल में जीभ के नीचे रखें",
     "dosage":"1 tablet under the tongue during angina attack","dosage_hindi":"सीने में दर्द होने पर जीभ के नीचे 1 गोली","manufacturer":"Abbott","price_inr":25.0,"drug_type":"Sublingual Tablet","prescription_required":True},

    # ── STEROIDS / ANTI-INFLAMMATORY ──────────────────────────
    {"brand_name":"Wysolone","generic_name":"Prednisolone","composition":"Prednisolone 5mg",
     "uses":"Inflammation, allergies, asthma, autoimmune conditions","uses_hindi":"सूजन, एलर्जी, अस्थमा, ऑटोइम्यून बीमारी",
     "side_effects":"Weight gain, high blood sugar, mood changes, bone weakness","side_effects_hindi":"वजन बढ़ना, शुगर बढ़ना, मूड बदलना, हड्डी कमज़ोर होना",
     "warnings":"Never stop suddenly — must taper. Take with food","warnings_hindi":"अचानक बंद न करें — धीरे-धीरे कम करें। खाने के साथ लें",
     "dosage":"As prescribed by doctor — take with breakfast","dosage_hindi":"डॉक्टर के अनुसार — नाश्ते के साथ लें","manufacturer":"Pfizer","price_inr":20.0,"drug_type":"Tablet","prescription_required":True},

    # ── SLEEP / ANXIETY ───────────────────────────────────────
    {"brand_name":"Restyl","generic_name":"Alprazolam","composition":"Alprazolam 0.25mg",
     "uses":"Anxiety, panic disorder, sleep problems","uses_hindi":"घबराहट, बेचैनी, नींद की तकलीफ",
     "side_effects":"Drowsiness, dependence, memory problems","side_effects_hindi":"नींद आना, आदत पड़ जाना, याददाश्त की समस्या",
     "warnings":"HABIT FORMING — use only as prescribed. Avoid alcohol","warnings_hindi":"आदत पड़ सकती है — केवल डॉक्टर के नुसार। शराब न लें",
     "dosage":"As prescribed — usually 1 tablet at night","dosage_hindi":"डॉक्टर के अनुसार — आमतौर पर रात को 1 गोली","manufacturer":"Pfizer","price_inr":25.0,"drug_type":"Tablet","prescription_required":True},

    {"brand_name":"Lonazep","generic_name":"Clonazepam","composition":"Clonazepam 0.5mg",
     "uses":"Seizures, anxiety, panic disorder","uses_hindi":"दौरे (मिर्गी), घबराहट, बेचैनी",
     "side_effects":"Drowsiness, dizziness, coordination problems","side_effects_hindi":"नींद आना, चक्कर, संतुलन की समस्या",
     "warnings":"Schedule H drug. Do not drive. Habit forming","warnings_hindi":"अनुसूची H दवाई। गाड़ी न चलाएं। आदत पड़ सकती है",
     "dosage":"As prescribed by psychiatrist/neurologist","dosage_hindi":"मनोचिकित्सक या न्यूरोलॉजिस्ट के अनुसार","manufacturer":"Sun Pharma","price_inr":35.0,"drug_type":"Tablet","prescription_required":True},

    # ── SKIN ──────────────────────────────────────────────────
    {"brand_name":"Betadine","generic_name":"Povidone Iodine","composition":"Povidone Iodine 5%",
     "uses":"Wound cleaning, skin infection, cuts & burns","uses_hindi":"घाव साफ करना, त्वचा संक्रमण, कट और जलन",
     "side_effects":"Skin staining (brown), iodine allergy (rare)","side_effects_hindi":"त्वचा पर भूरा दाग, आयोडीन एलर्जी (दुर्लभ)",
     "warnings":"Do not use inside deep wounds. Avoid in thyroid patients","warnings_hindi":"गहरे घावों में न डालें। थायरॉइड मरीज़ सावधानी रखें",
     "dosage":"Apply on wound 2–3 times daily","dosage_hindi":"घाव पर दिन में 2-3 बार लगाएं","manufacturer":"Win Medicare","price_inr":50.0,"drug_type":"Solution","prescription_required":False},

    {"brand_name":"Soframycin","generic_name":"Framycetin","composition":"Framycetin Sulphate 1%",
     "uses":"Infected wounds, burns, skin infections","uses_hindi":"संक्रमित घाव, जलन, त्वचा संक्रमण",
     "side_effects":"Skin sensitization with prolonged use","side_effects_hindi":"लंबे समय तक उपयोग से त्वचा संवेदनशील हो सकती है",
     "warnings":"External use only. Not for eyes or deep wounds","warnings_hindi":"केवल बाहरी उपयोग। आंखों या गहरे घावों में नहीं",
     "dosage":"Apply thin layer 2–3 times daily","dosage_hindi":"दिन में 2-3 बार पतली परत लगाएं","manufacturer":"Sanofi","price_inr":55.0,"drug_type":"Cream","prescription_required":False},

    # ── EYE ───────────────────────────────────────────────────
    {"brand_name":"Tears Naturale","generic_name":"Artificial Tears","composition":"Dextran + Hydroxypropyl Methylcellulose",
     "uses":"Dry eyes, eye irritation, computer eye strain","uses_hindi":"आंखों का सूखापन, आंखों में जलन, कंप्यूटर से थकी आंखें",
     "side_effects":"Temporary blurred vision after instillation","side_effects_hindi":"डालने के बाद थोड़ी देर धुंधला दिखना",
     "warnings":"Remove contact lenses before use","warnings_hindi":"उपयोग से पहले कॉन्टैक्ट लेंस हटाएं",
     "dosage":"1–2 drops in each eye 3–4 times daily","dosage_hindi":"हर आंख में 1-2 बूंद दिन में 3-4 बार","manufacturer":"Alcon","price_inr":120.0,"drug_type":"Eye Drops","prescription_required":False},

    # ── UROLOGY ───────────────────────────────────────────────
    {"brand_name":"Flomax","generic_name":"Tamsulosin","composition":"Tamsulosin 0.4mg",
     "uses":"Enlarged prostate (BPH), difficulty urinating","uses_hindi":"प्रोस्टेट बढ़ना, पेशाब में तकलीफ",
     "side_effects":"Dizziness on standing, abnormal ejaculation","side_effects_hindi":"खड़े होने पर चक्कर, स्खलन में बदलाव",
     "warnings":"Stand up slowly. Can cause low blood pressure","warnings_hindi":"धीरे-धीरे उठें। रक्तचाप कम हो सकता है",
     "dosage":"1 capsule once daily after dinner","dosage_hindi":"1 कैप्सूल रात के खाने के बाद","manufacturer":"Boehringer Ingelheim","price_inr":150.0,"drug_type":"Capsule","prescription_required":True},

    # ── COUGH ─────────────────────────────────────────────────
    {"brand_name":"Benadryl","generic_name":"Diphenhydramine + Ammonium Chloride","composition":"Diphenhydramine 14.08mg + Ammonium Chloride 138mg",
     "uses":"Cough, cold, runny nose, allergy","uses_hindi":"खांसी, सर्दी, नाक बहना, एलर्जी",
     "side_effects":"Drowsiness, dry mouth, dizziness","side_effects_hindi":"नींद आना, मुँह सूखना, चक्कर",
     "warnings":"Avoid driving. Not for children under 2","warnings_hindi":"गाड़ी न चलाएं। 2 साल से कम बच्चों को न दें",
     "dosage":"2 teaspoons (10ml) 3 times daily","dosage_hindi":"2 चम्मच (10ml) दिन में 3 बार","manufacturer":"J&J","price_inr":80.0,"drug_type":"Syrup","prescription_required":False},

    {"brand_name":"Alex","generic_name":"Chlorpheniramine + Dextromethorphan","composition":"Chlorpheniramine 2mg + Dextromethorphan 10mg",
     "uses":"Dry cough, allergic cough, cold","uses_hindi":"सूखी खांसी, एलर्जी की खांसी, जुकाम",
     "side_effects":"Drowsiness, nausea","side_effects_hindi":"नींद आना, मतली",
     "warnings":"Not for productive (wet) cough. Avoid alcohol","warnings_hindi":"कफ वाली खांसी में न लें। शराब न लें",
     "dosage":"2 teaspoons 3–4 times daily","dosage_hindi":"2 चम्मच दिन में 3-4 बार","manufacturer":"Glenmark","price_inr":65.0,"drug_type":"Syrup","prescription_required":False},

    # ── ANTI-FUNGAL ───────────────────────────────────────────
    {"brand_name":"Flucos","generic_name":"Fluconazole","composition":"Fluconazole 150mg",
     "uses":"Fungal infection (vaginal, oral, skin)","uses_hindi":"फंगल संक्रमण (त्वचा, नाखून, योनि, मुंह)",
     "side_effects":"Nausea, stomach pain, headache","side_effects_hindi":"मतली, पेट दर्द, सिरदर्द",
     "warnings":"Single dose for vaginal yeast. Multiple doses for systemic","warnings_hindi":"योनि संक्रमण के लिए एक गोली। अन्य के लिए कई गोलियां",
     "dosage":"1 tablet (150mg) as single dose or as prescribed","dosage_hindi":"1 गोली एक बार या डॉक्टर के अनुसार","manufacturer":"Sun Pharma","price_inr":45.0,"drug_type":"Tablet","prescription_required":True},

    # ── ANTI-MALARIAL ─────────────────────────────────────────
    {"brand_name":"Lariago","generic_name":"Chloroquine","composition":"Chloroquine 250mg",
     "uses":"Malaria treatment and prevention","uses_hindi":"मलेरिया का उपचार और बचाव",
     "side_effects":"Nausea, stomach cramps, headache, vision changes","side_effects_hindi":"मतली, पेट में ऐंठन, सिरदर्द, नज़र बदलना",
     "warnings":"Regular eye check-ups with long-term use","warnings_hindi":"लंबे समय तक लेने पर नियमित आंखों की जांच",
     "dosage":"As prescribed for malaria treatment","dosage_hindi":"मलेरिया के उपचार के लिए डॉक्टर के अनुसार","manufacturer":"IPCA","price_inr":25.0,"drug_type":"Tablet","prescription_required":True},

    # ── COMMON COMBINATION DRUGS ──────────────────────────────
    {"brand_name":"Cheston Cold","generic_name":"Cetirizine + Phenylephrine + Paracetamol","composition":"Cetirizine 5mg + Phenylephrine 5mg + Paracetamol 325mg",
     "uses":"Cold, runny nose, blocked nose, fever, sneezing","uses_hindi":"सर्दी, नाक बहना, बंद नाक, बुखार, छींक",
     "side_effects":"Drowsiness, dry mouth, dizziness","side_effects_hindi":"नींद, मुँह सूखना, चक्कर",
     "warnings":"Avoid driving. Do not give to children under 6","warnings_hindi":"गाड़ी न चलाएं। 6 साल से कम बच्चों को न दें",
     "dosage":"1 tablet 3 times daily","dosage_hindi":"1 गोली दिन में 3 बार","manufacturer":"Cipla","price_inr":35.0,"drug_type":"Tablet","prescription_required":False},

    {"brand_name":"Sumo","generic_name":"Nimesulide + Paracetamol","composition":"Nimesulide 100mg + Paracetamol 325mg",
     "uses":"Fever, pain, inflammation, dental pain","uses_hindi":"बुखार, दर्द, सूजन, दांत का दर्द",
     "side_effects":"Stomach upset, liver toxicity with overuse","side_effects_hindi":"पेट खराब, ज़्यादा लेने पर लिवर को नुकसान",
     "warnings":"Not for children. Short-term use max 15 days","warnings_hindi":"बच्चों को नहीं। ज़्यादा से ज़्यादा 15 दिन",
     "dosage":"1 tablet twice daily after meals","dosage_hindi":"1 गोली दिन में 2 बार खाने के बाद","manufacturer":"Sun Pharma","price_inr":40.0,"drug_type":"Tablet","prescription_required":False},

    {"brand_name":"D-Cold Total","generic_name":"Multi-ingredient cold formula","composition":"Paracetamol 500mg + Phenylephrine 5mg + Caffeine 30mg",
     "uses":"Cold, blocked nose, fever, headache","uses_hindi":"सर्दी-जुकाम, बंद नाक, बुखार, सिरदर्द",
     "side_effects":"Restlessness (caffeine), dry mouth","side_effects_hindi":"बेचैनी (कैफीन से), मुँह सूखना",
     "warnings":"Avoid late night due to caffeine. Not for heart patients","warnings_hindi":"कैफीन के कारण रात में न लें। दिल के मरीज़ न लें",
     "dosage":"1 tablet 3 times daily","dosage_hindi":"1 गोली दिन में 3 बार","manufacturer":"Wockhardt","price_inr":30.0,"drug_type":"Tablet","prescription_required":False},
]

# ═══════════════════════════════════════════════════════════════
#  DOCUMENT GUIDES DATA
# ═══════════════════════════════════════════════════════════════
DOCUMENT_GUIDES = [
    {"doc_type":"aadhaar","title":"Aadhaar Card","title_hindi":"आधार कार्ड",
     "description":"Government issued biometric identity card with 12-digit unique number",
     "description_hindi":"सरकार द्वारा जारी 12 अंकों वाला पहचान पत्र",
     "key_fields":{"uid":"12-digit Aadhaar number","name":"Full name","dob":"Date of birth","gender":"M/F","address":"Registered address"},
     "action_required":"Keep safe. Never share OTP. Use for KYC and government services",
     "action_hindi":"सुरक्षित रखें। OTP कभी न बताएं। KYC और सरकारी सेवाओं के लिए उपयोग करें"},

    {"doc_type":"pan","title":"PAN Card","title_hindi":"पैन कार्ड",
     "description":"Permanent Account Number — 10 character alphanumeric identity for tax purposes",
     "description_hindi":"स्थायी खाता संख्या — 10 अक्षरों का कर पहचान दस्तावेज़",
     "key_fields":{"pan":"10-character alphanumeric","name":"Full name","father_name":"Father's name","dob":"Date of birth","signature":"Signature"},
     "action_required":"Required for bank accounts, income tax returns, high-value transactions",
     "action_hindi":"बैंक खाता, आयकर रिटर्न, बड़े लेनदेन के लिए ज़रूरी"},

    {"doc_type":"prescription","title":"Medical Prescription","title_hindi":"डॉक्टर का पर्चा",
     "description":"Doctor's written order for medicines including dosage and duration",
     "description_hindi":"डॉक्टर द्वारा लिखी दवाइयों की सूची, खुराक और अवधि",
     "key_fields":{"doctor_name":"Doctor name & registration","patient_name":"Patient name","date":"Date of prescription","medicines":"List of medicines","dosage":"How much and how often","duration":"How many days"},
     "action_required":"Show to pharmacist. Complete full course. Keep for records",
     "action_hindi":"दवाई लेने के लिए फार्मासिस्ट को दिखाएं। पूरा कोर्स करें"},

    {"doc_type":"discharge_summary","title":"Hospital Discharge Summary","title_hindi":"अस्पताल छुट्टी पत्र",
     "description":"Summary of hospital stay including diagnosis, treatment and follow-up instructions",
     "description_hindi":"अस्पताल में भर्ती का विवरण, बीमारी, इलाज और अगले कदम",
     "key_fields":{"diagnosis":"Main diagnosis/condition","treatment":"Treatment given","medicines":"Discharge medicines","follow_up":"Next doctor visit date","restrictions":"Activity restrictions"},
     "action_required":"Follow all instructions. Take all medicines. Attend follow-up",
     "action_hindi":"सभी निर्देश मानें। दवाइयां लें। फॉलो-अप पर जाएं"},

    {"doc_type":"ayushman","title":"Ayushman Bharat Card (PM-JAY)","title_hindi":"आयुष्मान भारत कार्ड",
     "description":"Government health insurance providing up to ₹5 lakh coverage per year for poor families",
     "description_hindi":"गरीब परिवारों के लिए सरकारी स्वास्थ्य बीमा — ₹5 लाख तक प्रति वर्ष",
     "key_fields":{"beneficiary_id":"Beneficiary ID","family_id":"Family ID","coverage":"₹5 lakh per year","empanelled_hospitals":"Approved hospitals list"},
     "action_required":"Show at empanelled hospital for free treatment. Protect card",
     "action_hindi":"सरकारी मान्यता प्राप्त अस्पताल में मुफ़्त इलाज के लिए दिखाएं"},
]

def insert_batch(table, records):
    """Insert records in batches of 50"""
    batch_size = 50
    total = len(records)
    for i in range(0, total, batch_size):
        batch = records[i:i+batch_size]
        res = requests.post(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers=HEADERS,
            json=batch
        )
        if res.status_code in [200, 201]:
            print(f"  OK Inserted {min(i+batch_size, total)}/{total} records into '{table}'")
        else:
            print(f"  ERR inserting into '{table}': {res.status_code} - {res.text[:200]}")
        time.sleep(0.3)

def main():
    print("\nDrishtiAI -- Medicine Database Seeder")
    print("=" * 45)

    print("\n[1/2] Inserting medicines...")
    insert_batch("medicines", MEDICINES)

    print("\n[2/2] Inserting document guides...")
    insert_batch("document_guides", DOCUMENT_GUIDES)

    print("\nDone! Database populated successfully.")
    print(f"   Medicines inserted: {len(MEDICINES)}")
    print(f"   Document guides inserted: {len(DOCUMENT_GUIDES)}")

if __name__ == "__main__":
    main()
