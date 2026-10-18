import os
import logging
import base64
from io import BytesIO
from PIL import Image
import requests

try:
    from ultralytics import YOLO
    from ultralytics.utils.plotting import Annotator, colors
    ULTRALYTICS_AVAILABLE = True
except ImportError:
    ULTRALYTICS_AVAILABLE = False
    logging.warning("ultralytics package not found. Models will not be loaded.")


try:
    import torch
    import torchvision.models as models
    import torch.nn as nn
    from torchvision import transforms
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    logging.warning("torch / torchvision not found.")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DAMAGE_DETECT_PATH = os.path.join(BASE_DIR, "cardetection1.pt")
DAMAGE_SEG_PATH = os.path.join(BASE_DIR, "segmentation1.pt")
PARTS_SEG_PATH = os.path.join(BASE_DIR, "exp.pt")
CAR_DAMAGE_CLASSIFIER_PATH = os.path.join(BASE_DIR, "car_damage_classifier_pt_best.pt")

# Auto-load .env file if present
def _load_env_file():
    candidates = [
        os.path.join(BASE_DIR, ".env"),
        os.path.join(BASE_DIR, "..", ".env"),
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            os.environ.setdefault(k.strip(), v.strip())
            except Exception:
                pass

_load_env_file()

# RapidAPI Car Damage Assessment AI API configuration
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "")
RAPIDAPI_CAR_DAMAGE_HOST = os.getenv(
    "RAPIDAPI_CAR_DAMAGE_HOST",
    "car-damage-assessment-ai-api-repair-cost-fraud-detection.p.rapidapi.com"
)
RAPIDAPI_CAR_DAMAGE_URL = f"https://{RAPIDAPI_CAR_DAMAGE_HOST}/analyze"

# Dataset Categorical Constants
BRANDS = [
    'Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Toyota', 'Honda', 'Kia',
    'Renault', 'Nissan', 'Skoda', 'Volkswagen', 'MG', 'Jeep', 'Citroen', 'BYD',
    'Isuzu', 'Force', 'BMW', 'Mercedes-Benz', 'Audi', 'Volvo', 'Lexus', 'Jaguar',
    'Land Rover', 'Porsche'
]

CAR_MODELS = [
    'Alto K10', 'S-Presso', 'Celerio', 'Wagon R', 'Swift', 'Dzire', 'Baleno',
    'Fronx', 'Brezza', 'Ertiga', 'XL6', 'Grand Vitara', 'Jimny', 'Invicto',
    'e Vitara', 'Eeco', 'Ignis', 'Ciaz', 'S-Cross', 'Alto 800', 'Ritz', 'Celerio X',
    'Grand i10 Nios', 'i20', 'i20 N Line', 'Aura', 'Exter', 'Venue', 'Venue N Line',
    'Verna', 'Creta', 'Creta N Line', 'Alcazar', 'Tucson', 'IONIQ 5',
    'Creta Electric', 'Kona Electric', 'Elantra', 'Santro', 'Xcent', 'Eon',
    'Grand i10', 'Tiago', 'Tigor', 'Altroz', 'Punch', 'Nexon', 'Harrier', 'Safari',
    'Curvv', 'Curvv EV', 'Punch EV', 'Nexon EV', 'Tiago EV', 'Tigor EV', 'Indica',
    'Indigo', 'Bolt', 'Zest', 'Hexa', 'Aria', 'Nano', 'Manza', 'Bolero', 'Bolero Neo',
    'Scorpio Classic', 'Scorpio N', 'Thar', 'Thar Roxx', 'XUV 3XO', 'XUV700',
    'XUV400', 'XUV500', 'XUV300', 'KUV100', 'Marazzo', 'Alturas G4', 'TUV300',
    'Quanto', 'eVerito', 'BE 6', 'XEV 9e', 'Glanza', 'Urban Cruiser Taisor',
    'Urban Cruiser Hyryder', 'Innova Crysta', 'Innova Hycross', 'Fortuner',
    'Hilux', 'Camry', 'Vellfire', 'Land Cruiser 300', 'Rumion', 'Etios', 'Yaris',
    'Corolla Altis', 'Urban Cruiser', 'Prius', 'Corolla Cross', 'Amaze', 'City',
    'City e:HEV', 'Elevate', 'WR-V', 'Jazz', 'BR-V', 'Mobilio', 'Civic', 'Accord',
    'Brio', 'CR-V', 'CR-Z', 'Sonet', 'Seltos', 'Carens', 'Carnival', 'EV6', 'EV9',
    'Sorento', 'Kwid', 'Triber', 'Kiger', 'Duster', 'Captur', 'Lodgy', 'Fluence',
    'Pulse', 'Scala', 'Magnite', 'X-Trail', 'Kicks', 'Terrano', 'Sunny', 'Micra',
    'Evalia', 'Kushaq', 'Slavia', 'Kodiaq', 'Superb', 'Octavia', 'Rapid', 'Fabia',
    'Yeti', 'Laura', 'Taigun', 'Virtus', 'Tiguan', 'T-Roc', 'Vento', 'Polo', 'Ameo',
    'Passat', 'Jetta', 'Beetle', 'Hector', 'Hector Plus', 'Astor', 'ZS EV',
    'Comet EV', 'Windsor EV', 'Gloster', 'Marvel X', 'Compass', 'Meridian',
    'Wrangler', 'Grand Cherokee', 'Avenger', 'C3', 'eC3', 'C3 Aircross',
    'C5 Aircross', 'Basalt', 'C5', 'Atto 3', 'e6', 'Seal', 'Sealion 7', 'Dolphin',
    'D-Max', 'V-Cross', 'MU-X', 'Gurkha', 'Gurkha 5-Door', 'Trax Cruiser',
    'Urbania', '2 Series', '3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X7',
    'iX1', 'i4', 'i5', 'i7', 'iX', 'XM', '8 Series', 'A-Class', 'C-Class', 'E-Class',
    'S-Class', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'EQB', 'EQE', 'EQS', 'G-Class',
    'Maybach GLS', 'A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron', 'Q4 e-tron',
    'S5', 'RS5', 'S60', 'S90', 'XC40', 'XC60', 'XC90', 'C40', 'EX30', 'EX40', 'EC40',
    'ES', 'NX', 'RX', 'LX', 'LM', 'LC', 'XE', 'XF', 'F-Pace', 'E-Pace', 'F-Type',
    'I-Pace', 'Evoque', 'Velar', 'Defender', 'Discovery Sport', 'Discovery',
    'Range Rover Sport', 'Range Rover', 'Macan', 'Cayenne', '911', 'Taycan',
    'Panamera', '718 Cayman'
]

VARIANTS = ['Base (synthetic)', 'Mid (synthetic)', 'Top (synthetic)']
FUEL_TYPES = ['Petrol', 'Hybrid', 'Electric', 'Diesel']
YEARS = [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]
PART_PRICE_TYPES = ['NOT Applicable', 'OEM', 'AFTERMARKET']

def is_duplicate_box(box1, box2, iou_thresh=0.30, iosma_thresh=0.40):
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    if inter == 0:
        return False
    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union = area1 + area2 - inter
    iou = inter / union if union > 0 else 0
    min_area = min(area1, area2)
    iosma = inter / min_area if min_area > 0 else 0
    return iou > iou_thresh or iosma > iosma_thresh

def crop_masks_to_boxes(res, margin=8):
    """Crop segmentation masks so they strictly stay inside bounding box bounds."""
    if res is None or res.masks is None or len(res.masks) == 0:
        return res
    try:
        masks_data = res.masks.data.clone()
        m_h, m_w = masks_data.shape[1:]
        img_h, img_w = res.orig_shape if hasattr(res, 'orig_shape') and res.orig_shape is not None else (m_h, m_w)
        
        scale_x = m_w / float(img_w)
        scale_y = m_h / float(img_h)
        
        for i, b in enumerate(res.boxes):
            x1, y1, x2, y2 = b.xyxy[0].tolist()
            mx1 = max(0, int(x1 * scale_x) - margin)
            my1 = max(0, int(y1 * scale_y) - margin)
            mx2 = min(m_w, int(x2 * scale_x) + margin)
            my2 = min(m_h, int(y2 * scale_y) + margin)
            
            masks_data[i, :my1, :] = 0
            masks_data[i, my2:, :] = 0
            masks_data[i, :, :mx1] = 0
            masks_data[i, :, mx2:] = 0
            
        res.masks.data = masks_data
    except Exception as e:
        logging.warning(f"Mask crop error: {e}")
    return res

def apply_nms_to_results(res, iou_thresh=0.35, iosma_thresh=0.60):
    if res is None or len(res.boxes) <= 1:
        return res

    boxes = res.boxes
    confidences = boxes.conf.tolist()
    sorted_indices = sorted(range(len(confidences)), key=lambda k: confidences[k], reverse=True)
    
    keep = []
    kept_boxes = []
    for idx in sorted_indices:
        b = boxes[idx].xyxy[0].tolist()
        cls = int(boxes[idx].cls.item())
        is_dup = False
        for k_b, k_cls in kept_boxes:
            if is_duplicate_box(b, k_b, iou_thresh, iosma_thresh):
                is_dup = True
                break
        if not is_dup:
            keep.append(idx)
            kept_boxes.append((b, cls))
            
    return res[sorted(keep)]

def is_box_overlapping(box1, box2):
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    return inter > 0

def get_best_overlapping_part(damage_box, parts_res):
    """Find the car part predicted by exp.pt model that has maximum spatial overlap with damage_box."""
    if parts_res is None or len(parts_res.boxes) == 0:
        return None, 0
    
    x1_d, y1_d, x2_d, y2_d = damage_box
    area_d = max(0, x2_d - x1_d) * max(0, y2_d - y1_d)
    if area_d == 0:
        return None, 0

    best_part_name = None
    best_part_cls = 0
    best_overlap = 0.0

    for pb in parts_res.boxes:
        p_box = pb.xyxy[0].tolist()
        p_cls = int(pb.cls.item())
        p_name = parts_res.names.get(p_cls, f"part_{p_cls}")
        
        ix1 = max(x1_d, p_box[0])
        iy1 = max(y1_d, p_box[1])
        ix2 = min(x2_d, p_box[2])
        iy2 = min(y2_d, p_box[3])
        iarea = max(0, ix2 - ix1) * max(0, iy2 - iy1)

        overlap_ratio = iarea / area_d
        if overlap_ratio > best_overlap and iarea > 0:
            best_overlap = overlap_ratio
            best_part_name = p_name
            best_part_cls = p_cls

    if best_overlap > 0.05:
        return best_part_name, best_part_cls
    return None, 0

def annotate_damage_results(base_bgr, res, parts_res=None, is_seg=False):
    """Draw model results with dynamic labels strictly using model predictions."""
    if res is None or len(res.boxes) == 0:
        return base_bgr

    img_array = base_bgr.copy()
    if is_seg and hasattr(res, 'masks') and res.masks is not None and len(res.masks) > 0:
        img_array = res.plot(line_width=2)

    annotator = Annotator(img_array, line_width=2)

    for b in res.boxes:
        box = b.xyxy[0].tolist()
        cls_id = int(b.cls.item())
        conf = float(b.conf.item())
        dmg_name = res.names.get(cls_id, f"damage_{cls_id}")

        matched_part, _ = get_best_overlapping_part(box, parts_res)
        if matched_part:
            label = f"{matched_part}: {dmg_name} {conf:.2f}"
        else:
            label = f"{dmg_name} {conf:.2f}"

        annotator.box_label(box, label, color=colors(cls_id, True))

    return annotator.result()

class ModelService:
    def __init__(self):
        self.damage_detect = None
        self.damage_seg = None
        self.parts_seg = None
        self.car_damage_classifier_model = None
        self.transform = None

    def _ensure_models_loaded(self):
        if TORCH_AVAILABLE and self.transform is None:
            self.transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])



        if TORCH_AVAILABLE and self.car_damage_classifier_model is None and os.path.exists(CAR_DAMAGE_CLASSIFIER_PATH):
            try:
                m2 = models.resnet101()
                m2.fc = nn.Sequential(nn.Linear(2048, 1))
                m2.load_state_dict(torch.load(CAR_DAMAGE_CLASSIFIER_PATH, map_location='cpu'))
                m2.eval()
                self.car_damage_classifier_model = m2
                logging.info("PyTorch car_damage_classifier_pt_best.pt model loaded successfully.")
            except Exception as e:
                logging.error(f"Error loading car_damage_classifier_pt_best.pt model: {e}")

        if self.damage_detect is None:
            if ULTRALYTICS_AVAILABLE:
                try:
                    if os.path.exists(DAMAGE_DETECT_PATH):
                        self.damage_detect = YOLO(DAMAGE_DETECT_PATH)
                    if os.path.exists(DAMAGE_SEG_PATH):
                        self.damage_seg = YOLO(DAMAGE_SEG_PATH)
                    if os.path.exists(PARTS_SEG_PATH):
                        self.parts_seg = YOLO(PARTS_SEG_PATH)
                    logging.info("YOLO models loaded successfully.")
                except Exception as e:
                    logging.error(f"Error loading YOLO models: {e}")

    def predict_combined_price(
        self,
        car_brand,
        car_model,
        car_variant,
        car_type,
        year,
        detections_raw,
        image_bytes=None,
        currency="INR",
        country="IN",
        additional_image_urls=None,
        reference_image_url=None,
    ):
        """
        Calculates damage repair costs using RapidAPI Car Damage Assessment AI API:
        https://car-damage-assessment-ai-api-repair-cost-fraud-detection.p.rapidapi.com/analyze
        Falls back to rule-based automotive cost calculation if RAPIDAPI_KEY is not set or API fails.
        """
        # 1. Try RapidAPI if image_bytes and RAPIDAPI_KEY are provided
        api_key = os.getenv("RAPIDAPI_KEY", "").strip()
        if image_bytes and api_key:
            api_res = self._call_rapidapi_damage_assessment(
                image_bytes=image_bytes,
                filename=f"{car_brand}_{car_model}.jpg" if car_brand or car_model else "car.jpg",
                make=car_brand,
                model=car_model,
                year=str(year) if year else "",
                currency=currency or "INR",
                country=country or "IN",
                additional_image_urls=additional_image_urls,
                reference_image_url=reference_image_url,
            )
            if api_res:
                parsed = self._parse_rapidapi_response(api_res, detections_raw)
                if parsed:
                    return parsed

        # 2. Heuristic fallback when RapidAPI is not configured or fails
        if detections_raw:
            return self._calculate_fallback_price(
                detections_raw=detections_raw,
                car_brand=car_brand,
                car_model=car_model,
                year=year,
            )
        return None

    def _call_rapidapi_damage_assessment(
        self,
        image_bytes: bytes,
        filename: str = "car.jpg",
        make: str = "",
        model: str = "",
        year: str = "",
        currency: str = "INR",
        country: str = "IN",
        language: str = "en",
        additional_image_urls: list = None,
        reference_image_url: str = None,
    ):
        api_key = os.getenv("RAPIDAPI_KEY", "").strip()
        if not api_key:
            return None

        headers = {
            "X-RapidAPI-Key": api_key,
            "X-RapidAPI-Host": RAPIDAPI_CAR_DAMAGE_HOST,
        }
        files = {
            "image": (filename or "car.jpg", image_bytes, "image/jpeg")
        }
        data = {
            "currency": currency or "INR",
            "country": country or "IN",
            "language": language or "en",
        }
        if make and make.strip():
            data["make"] = make.strip()
        if model and model.strip():
            data["model"] = model.strip()
        if year and str(year).strip():
            data["year"] = str(year).strip()
        if additional_image_urls:
            if isinstance(additional_image_urls, list):
                valid_urls = [str(u).strip() for u in additional_image_urls if u and str(u).strip()]
                if valid_urls:
                    data["additionalImageUrls"] = ",".join(valid_urls[:5])
            elif isinstance(additional_image_urls, str) and additional_image_urls.strip():
                data["additionalImageUrls"] = additional_image_urls.strip()
        if reference_image_url and str(reference_image_url).strip():
            data["referenceImageUrl"] = str(reference_image_url).strip()

        try:
            logging.info(f"Calling RapidAPI Car Damage Assessment ({RAPIDAPI_CAR_DAMAGE_HOST}) [country={data.get('country')}, currency={data.get('currency')}, extra_angles={bool(additional_image_urls)}]...")
            resp = requests.post(RAPIDAPI_CAR_DAMAGE_URL, headers=headers, files=files, data=data, timeout=60)
            if resp.status_code == 200:
                logging.info("RapidAPI car damage assessment succeeded.")
                return resp.json()
            else:
                logging.warning(f"RapidAPI call returned status {resp.status_code}: {resp.text[:300]}")
                return None
        except Exception as e:
            logging.error(f"Error calling RapidAPI car damage assessment: {e}")
            return None

    def _parse_rapidapi_response(self, api_res, detections_raw):
        if not isinstance(api_res, dict):
            return None

        # The documentation schema wraps data in result: { vehicle, damages, costSummary, safety, fraudRiskScore, recommendation }
        res_data = api_res.get("result") if isinstance(api_res.get("result"), dict) else api_res

        cost_summary = (
            res_data.get("costSummary")
            or res_data.get("repair_cost")
            or res_data.get("cost_estimate")
            or res_data.get("costs")
            or {}
        )

        # Parts: { "min": 260, "max": 480 }
        parts_obj = cost_summary.get("parts")
        if isinstance(parts_obj, dict):
            parts_max = float(parts_obj.get("max", 0.0) or parts_obj.get("estimate", 0.0))
            parts_min = float(parts_obj.get("min", 0.0))
        elif isinstance(parts_obj, (int, float)):
            parts_max = float(parts_obj)
            parts_min = parts_max * 0.72
        else:
            parts_max = float(cost_summary.get("parts_max", cost_summary.get("parts_estimate", 0.0)))
            parts_min = float(cost_summary.get("parts_min", parts_max * 0.72))

        # Labor: { "min": 300, "max": 450 }
        labor_obj = cost_summary.get("labor") or cost_summary.get("labour")
        if isinstance(labor_obj, dict):
            labour_val = float(labor_obj.get("max", 0.0) or labor_obj.get("estimate", 0.0))
        elif isinstance(labor_obj, (int, float)):
            labour_val = float(labor_obj)
        else:
            labour_val = float(cost_summary.get("labor_max", cost_summary.get("labor_estimate", 0.0)))

        # Paint: { "min": 110, "max": 230 }
        paint_obj = cost_summary.get("paint")
        if isinstance(paint_obj, dict):
            paint_val = float(paint_obj.get("max", 0.0) or paint_obj.get("estimate", 0.0))
        elif isinstance(paint_obj, (int, float)):
            paint_val = float(paint_obj)
        else:
            paint_val = float(cost_summary.get("paint_max", cost_summary.get("paint_estimate", 0.0)))

        # Total: { "min": 670, "max": 1160 }
        total_obj = cost_summary.get("total")
        if isinstance(total_obj, dict):
            total_max = float(total_obj.get("max", 0.0))
            total_min = float(total_obj.get("min", 0.0))
        elif isinstance(total_obj, (int, float)):
            total_max = float(total_obj)
            total_min = total_max * 0.75
        else:
            total_max = float(cost_summary.get("total_max", cost_summary.get("total_estimate", 0.0)))
            total_min = float(cost_summary.get("total_min", total_max * 0.75))

        # Damages list: [ { id, part, type, severity, repairAction, laborHours, costEstimate } ]
        damages_list = res_data.get("damages", [])
        replace_count = 0
        repair_count = 0
        total_labor_hours = 0.0

        if isinstance(damages_list, list) and damages_list:
            for dmg in damages_list:
                act = str(dmg.get("repairAction", "") or dmg.get("action", "")).lower()
                if "replace" in act:
                    replace_count += 1
                else:
                    repair_count += 1
                total_labor_hours += float(dmg.get("laborHours", 0.0) or 0.0)
        else:
            replacement_classes = {3, 4, 5}
            for d in detections_raw:
                if d.get("damage_cls_id", 0) in replacement_classes or (d.get("damage_cls_id", 0) == 2 and d.get("confidence", 0) >= 0.75):
                    replace_count += 1
                else:
                    repair_count += 1

        if repair_count == 0 and replace_count == 0 and len(detections_raw) > 0:
            repair_count = len(detections_raw)

        # Installation for replaced parts
        install_val = float(cost_summary.get("installation", 800 * replace_count if replace_count > 0 else 0))

        oem_part = max(0, int(round(parts_max)))
        afm_part = max(0, int(round(parts_min if parts_min > 0 else parts_max * 0.72)))
        labour = max(0, int(round(labour_val)))
        paint = max(0, int(round(paint_val)))
        install = max(0, int(round(install_val)))
        gst_rate = 0.18

        oem_subtotal = oem_part + labour + install + paint
        # If parts/labor breakdown was 0 but total range was given
        if oem_subtotal == 0 and total_max > 0:
            oem_subtotal = int(round(total_max / 1.18))
            oem_part = int(round(oem_subtotal * 0.45))
            afm_part = int(round(oem_part * 0.72))
            labour = int(round(oem_subtotal * 0.30))
            paint = int(round(oem_subtotal * 0.25))

        oem_gst = int(round(oem_subtotal * gst_rate))
        oem_total = oem_subtotal + oem_gst

        afm_subtotal = afm_part + labour + install + paint
        afm_gst = int(round(afm_subtotal * gst_rate))
        afm_total = afm_subtotal + afm_gst

        # Fraud & Safety info directly matching schema
        fraud_score = res_data.get("fraudRiskScore")
        fraud_indicators = res_data.get("fraudIndicators", [])

        safety_obj = res_data.get("safety") or {}
        drivable = safety_obj.get("drivable", True)
        airbags_deployed = safety_obj.get("airbagsDeployed", False)
        structural_concerns = res_data.get("structuralConcerns", [])

        recommendation = res_data.get("recommendation") or {}
        needs_inspection = recommendation.get("needsPhysicalInspection", False)
        next_step = recommendation.get("nextStep", "")

        vehicle_info = res_data.get("vehicle") or {}

        return {
            "total_oem_part_price": oem_part,
            "total_aftermarket_part_price": afm_part,
            "total_damage_labour": labour,
            "total_damage_installation": install,
            "total_damage_paint": paint,
            "gst_rate": gst_rate,
            "oem_subtotal_before_gst": oem_subtotal,
            "oem_gst_amount": oem_gst,
            "oem_total_estimate": oem_total,
            "aftermarket_subtotal_before_gst": afm_subtotal,
            "aftermarket_gst_amount": afm_gst,
            "aftermarket_total_estimate": afm_total,
            "repair_item_count": repair_count,
            "replacement_item_count": replace_count,
            "currency": cost_summary.get("currency", "INR"),
            "fraud_risk_score": fraud_score,
            "fraud_indicators": fraud_indicators,
            "drivable": drivable,
            "airbags_deployed": airbags_deployed,
            "structural_concerns": structural_concerns,
            "estimated_labor_hours": round(total_labor_hours, 1) if total_labor_hours > 0 else None,
            "needs_physical_inspection": needs_inspection,
            "recommendation_next_step": next_step,
            "recommendation_reason": recommendation.get("reason", ""),
            "detected_vehicle": vehicle_info,
            "image_quality": res_data.get("imageQuality"),
            "cost_summary": cost_summary,
            "total_loss_likely": cost_summary.get("totalLossLikely", False),
            "damages": damages_list,
            "overall_confidence": res_data.get("overallConfidence"),
            "source": "RapidAPI Car Damage Assessment AI",
        }

    def _calculate_fallback_price(self, detections_raw, car_brand="", car_model="", year=None):
        if not detections_raw:
            return None

        replacement_classes = {3, 4, 5}
        replace_count = 0
        repair_count = 0
        oem_part = 0
        labour = 0
        paint = 0
        install = 0

        for d in detections_raw:
            cls_id = d.get("damage_cls_id", 0)
            conf = d.get("confidence", 0.5)

            is_replace = cls_id in replacement_classes or (cls_id == 2 and conf >= 0.75)
            if is_replace:
                replace_count += 1
                if cls_id == 3:
                    part_cost = 6500
                    install_cost = 1200
                elif cls_id == 4:
                    part_cost = 4500
                    install_cost = 800
                elif cls_id == 5:
                    part_cost = 4000
                    install_cost = 500
                else:
                    part_cost = 5500
                    install_cost = 1000
                oem_part += part_cost
                install += install_cost
            else:
                repair_count += 1
                if cls_id == 0:
                    labour += 1800
                    paint += 2200
                elif cls_id == 1:
                    labour += 1000
                    paint += 1800
                elif cls_id == 2:
                    labour += 1500
                    paint += 2000
                else:
                    labour += 1200

        if repair_count == 0 and replace_count == 0:
            repair_count = len(detections_raw)
            labour = repair_count * 1200

        afm_part = int(round(oem_part * 0.72))
        gst_rate = 0.18

        oem_subtotal = oem_part + labour + install + paint
        oem_gst = int(round(oem_subtotal * gst_rate))
        oem_total = oem_subtotal + oem_gst

        afm_subtotal = afm_part + labour + install + paint
        afm_gst = int(round(afm_subtotal * gst_rate))
        afm_total = afm_subtotal + afm_gst

        return {
            "total_oem_part_price": oem_part,
            "total_aftermarket_part_price": afm_part,
            "total_damage_labour": labour,
            "total_damage_installation": install,
            "total_damage_paint": paint,
            "gst_rate": gst_rate,
            "oem_subtotal_before_gst": oem_subtotal,
            "oem_gst_amount": oem_gst,
            "oem_total_estimate": oem_total,
            "aftermarket_subtotal_before_gst": afm_subtotal,
            "aftermarket_gst_amount": afm_gst,
            "aftermarket_total_estimate": afm_total,
            "repair_item_count": repair_count,
            "replacement_item_count": replace_count,
            "currency": "INR",
            "fraud_risk_score": None,
            "drivable": True if replace_count <= 1 else False,
            "structural_damage": False,
            "source": "Rule-based estimation (Configure RAPIDAPI_KEY for live RapidAPI assessment)",
        }

    def _img_to_base64(self, img_array):
        img_pil = Image.fromarray(img_array[..., ::-1])
        buffered = BytesIO()
        img_pil.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        return f"data:image/jpeg;base64,{img_str}"

    def analyze_car(
        self,
        image: Image.Image,
        car_brand: str = "Maruti Suzuki",
        car_model: str = "Swift",
        car_variant: str = "Base (synthetic)",
        car_type: str = "Petrol",
        year: int = 2020,
        currency: str = "INR",
        country: str = "IN",
        additional_image_urls: list = None,
        reference_image_url: str = None,
    ):
        self._ensure_models_loaded()
        result = {
            "success": True,
            "combined_b64": None,
            "damage_detect_b64": None,
            "damage_seg_b64": None,
            "parts_seg_b64": None,
            "grid_b64": None,
            "detections": [],
            "message": "Analysis complete."
        }

        missing_models = []
        if self.car_damage_classifier_model is None:
            missing_models.append("car_damage_classifier_pt_best.pt")
        if self.damage_detect is None:
            missing_models.append("cardetection1.pt")
        if self.damage_seg is None:
            missing_models.append("segmentation1.pt")
        if missing_models:
            result["success"] = False
            result["message"] = "Required model(s) unavailable: " + ", ".join(missing_models)
            return result

        try:
            import numpy as np
            import cv2

            det_res = None
            seg_res = None
            parts_res = None

            orig_bgr = np.array(image.convert("RGB"))[..., ::-1]

            # ── 0. PyTorch Car Damage Classifier & YOLO Detection ──────────────────────
            tensor_img = self.transform(image.convert("RGB")).unsqueeze(0)

            # Run YOLO parts & damage check
            if self.parts_seg:
                parts_res = self.parts_seg(image, conf=0.05, iou=0.40, retina_masks=True)[0]
            
            parts_found = parts_res is not None and len(parts_res.boxes) > 0
            
            if self.damage_detect:
                _quick_det = self.damage_detect(image, conf=0.10, iou=0.40)[0]
                damage_found_quick = _quick_det is not None and len(_quick_det.boxes) > 0
            else:
                damage_found_quick = False

            # ── 0b. PyTorch Car Damage Classifier ──────────────────────────────
            with torch.no_grad():
                d_prob = torch.sigmoid(self.car_damage_classifier_model(tensor_img)).item()

            is_damaged = (d_prob >= 0.15) or damage_found_quick or parts_found
            d_conf_pct = round((max(d_prob, 0.88 if damage_found_quick else d_prob)) * 100, 1)
            
            damage_class_res = {
                "is_damaged": is_damaged,
                "confidence": d_conf_pct,
                "status": f"{'Car Damage Identified' if is_damaged else 'No Surface Damage Classified'} ({d_conf_pct}%)"
            }
            result["car_damage_classifier"] = damage_class_res

            if not is_damaged:
                result["combined_b64"] = self._img_to_base64(orig_bgr)
                result["message"] = "The car classifier found no visible damage. Detection and segmentation were skipped."
                return result

            # 2. Damage Detection (cardetection1.pt)
            if self.damage_detect:
                det_res = self.damage_detect(image, conf=0.15, iou=0.40)[0]
                det_res = apply_nms_to_results(det_res)
                det_img = annotate_damage_results(orig_bgr, det_res, parts_res=parts_res, is_seg=False)
                result["damage_detect_b64"] = self._img_to_base64(det_img)

            # 3. Damage Segmentation (Segmentation1.pt)
            if self.damage_seg:
                seg_res = self.damage_seg(image, conf=0.15, iou=0.40, retina_masks=True)[0]
                seg_res = apply_nms_to_results(seg_res)
                seg_res = crop_masks_to_boxes(seg_res)
                seg_img = annotate_damage_results(orig_bgr, seg_res, parts_res=parts_res, is_seg=True)
                result["damage_seg_b64"] = self._img_to_base64(seg_img)

            # Collect all damage bounding boxes to filter car parts
            damage_boxes = []
            if det_res is not None and len(det_res.boxes) > 0:
                for b in det_res.boxes:
                    damage_boxes.append(b.xyxy[0].tolist())
            if seg_res is not None and len(seg_res.boxes) > 0:
                for b in seg_res.boxes:
                    damage_boxes.append(b.xyxy[0].tolist())

            # Filter car parts to keep ONLY parts that overlap with detected damages
            parts_res_damaged = None
            if parts_res is not None:
                parts_res = crop_masks_to_boxes(parts_res)
                keep_parts = []
                if len(parts_res.boxes) > 0 and len(damage_boxes) > 0:
                    for i, part_b in enumerate(parts_res.boxes):
                        part_box = part_b.xyxy[0].tolist()
                        if any(is_box_overlapping(part_box, d_box) for d_box in damage_boxes):
                            keep_parts.append(i)
                
                parts_res_damaged = parts_res[keep_parts] if len(keep_parts) > 0 else parts_res[[]]
                parts_img = parts_res_damaged.plot(line_width=2) if len(parts_res_damaged.boxes) > 0 else orig_bgr.copy()
                result["parts_seg_b64"] = self._img_to_base64(parts_img)

            # 4. Combined View (Damaged Car Parts + Damage Segmentation + Non-duplicate Damage Detections)
            comb = orig_bgr.copy()

            # Deduplicate det_res against seg_res so duplicate damage boxes are not plotted twice
            det_res_clean = det_res
            if seg_res is not None and len(seg_res.boxes) > 0 and det_res is not None and len(det_res.boxes) > 0:
                keep_det = []
                seg_box_list = [b.xyxy[0].tolist() for b in seg_res.boxes]
                for i, b_det in enumerate(det_res.boxes):
                    box_det = b_det.xyxy[0].tolist()
                    if not any(is_duplicate_box(box_det, box_seg, iou_thresh=0.25, iosma_thresh=0.40) for box_seg in seg_box_list):
                        keep_det.append(i)
                det_res_clean = det_res[keep_det]

            # Plot Damaged Car Parts masks first
            if parts_res_damaged is not None and len(parts_res_damaged.boxes) > 0:
                comb = parts_res_damaged.plot(img=comb, line_width=2)

            # Plot Damage Segmentation Masks + Annotations
            if seg_res is not None and len(seg_res.boxes) > 0:
                comb = annotate_damage_results(comb, seg_res, parts_res=parts_res, is_seg=True)

            # Plot Non-Duplicate Damage Detections + Annotations
            if det_res_clean is not None and len(det_res_clean.boxes) > 0:
                comb = annotate_damage_results(comb, det_res_clean, parts_res=parts_res, is_seg=False)

            result["combined_b64"] = self._img_to_base64(comb)

            # 5. Extract structured detections list (for damage price API aggregation)
            detections_list = []
            detections_raw   = []   # for damage price API input aggregation

            def append_detections(res, model_type):
                if res is None or len(res.boxes) == 0:
                    return
                for b in res.boxes:
                    box     = b.xyxy[0].tolist()
                    cls_id  = int(b.cls.item())
                    conf    = float(b.conf.item())
                    dmg_name = res.names.get(cls_id, f"damage_{cls_id}")
                    matched_part, part_cls_id = get_best_overlapping_part(box, parts_res)
                    if matched_part is None:
                        matched_part = "car panel"

                    detections_raw.append({
                        "damage_cls_id": cls_id,
                        "part_cls_id":   part_cls_id,
                        "confidence":    conf,
                    })
                    detections_list.append({
                        "car_part":    matched_part,
                        "damage_type": dmg_name,
                        "confidence":  round(conf * 100, 1),
                        "model_type":  model_type,
                    })

            if seg_res is not None and len(seg_res.boxes) > 0:
                append_detections(seg_res, "Segmentation Model")

            if det_res_clean is not None and len(det_res_clean.boxes) > 0:
                append_detections(det_res_clean, "Detection Model")

            result["detections"] = detections_list

            # ── Run Car Damage Assessment API for all damages combined ────────────────
            combined_price = None
            img_buf = BytesIO()
            image.convert("RGB").save(img_buf, format="JPEG")
            img_bytes = img_buf.getvalue()

            combined_price = self.predict_combined_price(
                car_brand=car_brand,
                car_model=car_model,
                car_variant=car_variant,
                car_type=car_type,
                year=year,
                detections_raw=detections_raw,
                image_bytes=img_bytes,
                currency=currency,
                country=country,
                additional_image_urls=additional_image_urls,
                reference_image_url=reference_image_url,
            )
            result["combined_price"] = combined_price

            # If RapidAPI returned part-level damages and local models found 0, populate from RapidAPI
            if combined_price and combined_price.get("damages"):
                rapid_damages = combined_price.get("damages")
                if len(detections_list) == 0:
                    for rd in rapid_damages:
                        p_name = rd.get("part") or "Vehicle Body"
                        d_type = rd.get("type") or "damage"
                        sev = rd.get("severityLabel") or f"Severity {rd.get('severity', '')}"
                        conf = float(rd.get("confidence", 85))
                        side_str = f" ({rd.get('side', '')})" if rd.get('side') else ""
                        detections_list.append({
                            "car_part": f"{p_name}{side_str}".strip(),
                            "damage_type": f"{d_type} - {sev}",
                            "confidence": conf,
                            "model_type": "RapidAPI Assessment AI",
                            "repair_action": rd.get("repairAction", ""),
                            "labor_hours": rd.get("laborHours", 0),
                            "cost_estimate": rd.get("costEstimate", {}),
                        })
                    result["detections"] = detections_list

            # 6. 4-Grid Collage Image
            h, w = orig_bgr.shape[:2]

            def resize_if_needed(img):
                if img is None:
                    return np.zeros((h, w, 3), dtype=np.uint8)
                if img.shape[:2] != (h, w):
                    return cv2.resize(img, (w, h))
                return img

            img_orig = orig_bgr
            img_det = resize_if_needed(det_img if det_res is not None else orig_bgr)
            img_seg = resize_if_needed(seg_img if seg_res is not None else orig_bgr)
            img_parts = resize_if_needed(parts_img)

            top_row = np.hstack([img_orig, img_det])
            bot_row = np.hstack([img_seg, img_parts])
            grid_img = np.vstack([top_row, bot_row])
            result["grid_b64"] = self._img_to_base64(grid_img)

        except Exception as e:
            result["success"] = False
            result["message"] = f"Inference error: {str(e)}"
            
        return result

model_service = ModelService()
