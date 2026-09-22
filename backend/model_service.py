import os
import logging
import base64
from io import BytesIO
from PIL import Image

try:
    from ultralytics import YOLO
    from ultralytics.utils.plotting import Annotator, colors
    ULTRALYTICS_AVAILABLE = True
except ImportError:
    ULTRALYTICS_AVAILABLE = False
    logging.warning("ultralytics package not found. Models will not be loaded.")

try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    logging.warning("tensorflow package not found.")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DAMAGE_DETECT_PATH = os.path.join(BASE_DIR, "cardetection1.pt")
DAMAGE_SEG_PATH = os.path.join(BASE_DIR, "Segmentation1.pt")
PARTS_SEG_PATH = os.path.join(BASE_DIR, "exp.pt")
PRICE_MODEL_PATH = os.path.join(BASE_DIR, "price.keras")

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
        self.price_model = None

        if not ULTRALYTICS_AVAILABLE:
            raise RuntimeError("ultralytics package is required but not installed.")

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
            raise e

        if not TF_AVAILABLE:
            raise RuntimeError("tensorflow package is required but not installed.")

        try:
            if not os.path.exists(PRICE_MODEL_PATH):
                raise FileNotFoundError(f"Missing Keras model file: {PRICE_MODEL_PATH}")
            self.price_model = tf.keras.models.load_model(PRICE_MODEL_PATH)
            logging.info("Keras price.keras model loaded successfully.")
        except Exception as e:
            logging.error(f"Error loading Keras price model: {e}")
            raise e

    def predict_combined_price(self, car_brand, car_model, car_variant, car_type, year, detections_raw):
        """
        Run price.keras once for all detected damages combined.
        Input features:
          [brand_idx, model_idx, variant_idx, fuel_idx, year_idx,
           damage_count, avg_damage_cls, avg_part_cls, avg_conf_bin]
        Output (14 targets):
          total_oem_part_price, total_aftermarket_part_price,
          total_damage_labour, total_damage_installation, total_damage_paint,
          gst_rate,
          oem_subtotal_before_gst, oem_gst_amount, oem_total_estimate,
          aftermarket_subtotal_before_gst, aftermarket_gst_amount, aftermarket_total_estimate,
          repair_item_count, replacement_item_count
        """
        import numpy as np

        if self.price_model is None:
            raise RuntimeError("price.keras model is not loaded!")

        b_idx = BRANDS.index(car_brand)     if car_brand    in BRANDS     else 0
        m_idx = CAR_MODELS.index(car_model) if car_model    in CAR_MODELS else 0
        v_idx = VARIANTS.index(car_variant) if car_variant  in VARIANTS   else 0
        t_idx = FUEL_TYPES.index(car_type)  if car_type     in FUEL_TYPES else 0
        y_idx = YEARS.index(int(year))      if (year is not None and int(year) in YEARS) else max(0, int(year) - 2010 if year else 10)

        n = len(detections_raw)
        if n == 0:
            return None

        avg_d = sum(d["damage_cls_id"] for d in detections_raw) / n
        avg_p = sum(d["part_cls_id"]   for d in detections_raw) / n
        avg_c = sum(min(2, max(0, int(d["confidence"] * 3))) for d in detections_raw) / n

        feature_vec = np.array(
            [[b_idx, m_idx, v_idx, t_idx, y_idx, n, avg_d, avg_p]],
            dtype=np.float32
        )

        raw = self.price_model.predict(feature_vec, verbose=0)[0]

        replacement_classes = {3, 4, 5}  # 3: glass shatter, 4: lamp broken, 5: tire flat
        replace_count = 0
        repair_count = 0
        for d in detections_raw:
            cls_id = d.get("damage_cls_id", 0)
            conf   = d.get("confidence", 0.0)
            if cls_id in replacement_classes or (cls_id == 2 and conf >= 0.75):
                replace_count += 1
            else:
                repair_count += 1

        if repair_count == 0 and replace_count == 0 and n > 0:
            repair_count = n

        # price.keras outputs are scaled in Thousands of Rupees (e.g. 10.84 = ₹10,840)
        # Replacement parts & installation charges apply ONLY when there are replacement items
        oem_part = max(0, int(round(float(raw[0]) * 1000.0))) if replace_count > 0 else 0
        afm_part = max(0, int(round(float(raw[1]) * 1000.0))) if replace_count > 0 else 0
        install  = max(0, int(round(max(0.0, float(raw[3])) * 1000.0))) if replace_count > 0 else 0

        # Repair labour charges apply ONLY when there are repair items
        labour   = max(0, int(round(abs(float(raw[2])) * 1000.0))) if repair_count > 0 else 0

        # Only assign paint cost if detected damages include paintable body panel items (dent=0, scratch=1, crack=2)
        needs_paint = any(d.get("damage_cls_id", 0) in {0, 1, 2} for d in detections_raw)
        paint       = max(0, int(round(max(0.0, float(raw[4])) * 1000.0))) if needs_paint else 0

        raw_gst  = float(raw[5])
        gst_rate = 0.18 if (raw_gst <= 0.05 or raw_gst > 0.5) else round(raw_gst, 4)

        oem_subtotal = oem_part + labour + install + paint
        oem_gst      = int(round(oem_subtotal * gst_rate))
        oem_total    = oem_subtotal + oem_gst

        afm_subtotal = afm_part + labour + install + paint
        afm_gst      = int(round(afm_subtotal * gst_rate))
        afm_total    = afm_subtotal + afm_gst

        return {
            "total_oem_part_price":              oem_part,
            "total_aftermarket_part_price":      afm_part,
            "total_damage_labour":               labour,
            "total_damage_installation":         install,
            "total_damage_paint":                paint,
            "gst_rate":                          gst_rate,
            "oem_subtotal_before_gst":           oem_subtotal,
            "oem_gst_amount":                    oem_gst,
            "oem_total_estimate":                oem_total,
            "aftermarket_subtotal_before_gst":   afm_subtotal,
            "aftermarket_gst_amount":            afm_gst,
            "aftermarket_total_estimate":        afm_total,
            "repair_item_count":                 repair_count,
            "replacement_item_count":            replace_count,
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
        year: int = 2020
    ):
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

        try:
            import numpy as np
            import cv2

            det_res = None
            seg_res = None
            parts_res = None

            orig_bgr = np.array(image.convert("RGB"))[..., ::-1]

            # 1. Car Parts Segmentation (exp.pt)
            if self.parts_seg:
                parts_res = self.parts_seg(image, conf=0.05, iou=0.40, retina_masks=True)[0]

            # ── Car Presence Check ──────────────────────────────────────────
            parts_found = parts_res is not None and len(parts_res.boxes) > 0
            if not parts_found and self.damage_detect:
                _quick_det = self.damage_detect(image, conf=0.10, iou=0.40)[0]
                damage_found_quick = _quick_det is not None and len(_quick_det.boxes) > 0
            else:
                damage_found_quick = False

            if not parts_found and not damage_found_quick:
                result["success"] = False
                result["message"] = (
                    "❌ No car detected in this image. "
                    "Please upload a clear photo of a car only."
                )
                return result
            # ────────────────────────────────────────────────────────────────

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

            # 5. Extract structured detections list (no per-damage price — price.keras runs once)
            detections_list = []
            detections_raw   = []   # for price.keras input aggregation

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

            # ── Run price.keras ONCE for all damages combined ────────────────
            combined_price = None
            if len(detections_raw) > 0:
                combined_price = self.predict_combined_price(
                    car_brand=car_brand,
                    car_model=car_model,
                    car_variant=car_variant,
                    car_type=car_type,
                    year=year,
                    detections_raw=detections_raw,
                )
            result["combined_price"] = combined_price

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
