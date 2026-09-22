from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
from PIL import Image
import base64
from model_service import model_service
import uvicorn

app = FastAPI(title="CarWorth AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "Backend is running"}

from typing import List, Optional
from fastapi import Form

@app.post("/api/analyze")
async def analyze_car(
    images: List[UploadFile] = File(...),
    car_brand: Optional[str] = Form("Maruti Suzuki"),
    car_model: Optional[str] = Form("Swift"),
    car_variant: Optional[str] = Form("Base (synthetic)"),
    car_type: Optional[str] = Form("Petrol"),
    year: Optional[int] = Form(2020)
):
    if len(images) > 1:
        return {"success": False, "analysis_message": "Please upload only 1 car photo at a time.", "results": []}

    results = []
    
    for image in images:
        try:
            image_data = await image.read()
            img = Image.open(BytesIO(image_data)).convert("RGB")
            
            # Convert original image to base64
            buffered = BytesIO()
            img.save(buffered, format="JPEG")
            orig_b64 = "data:image/jpeg;base64," + base64.b64encode(buffered.getvalue()).decode("utf-8")
            
            analysis_result = model_service.analyze_car(
                img,
                car_brand=car_brand,
                car_model=car_model,
                car_variant=car_variant,
                car_type=car_type,
                year=year
            )
            
            results.append({
                "filename": image.filename,
                "success": analysis_result["success"],
                "original_b64": orig_b64,
                "combined_b64": analysis_result.get("combined_b64"),
                "damage_detect_b64": analysis_result.get("damage_detect_b64"),
                "damage_seg_b64": analysis_result.get("damage_seg_b64"),
                "parts_seg_b64": analysis_result.get("parts_seg_b64"),
                "grid_b64": analysis_result.get("grid_b64"),
                "detections": analysis_result.get("detections", []),
                "combined_price": analysis_result.get("combined_price"),
                "analysis_message": analysis_result["message"]
            })
        except Exception as e:
            results.append({
                "filename": image.filename,
                "success": False,
                "analysis_message": f"Error processing image: {str(e)}"
            })

    return {
        "success": True,
        "results": results
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
